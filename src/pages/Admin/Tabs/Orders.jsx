import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FaArrowsRotate, FaCheck, FaTruck, FaBan,
  FaEye, FaMagnifyingGlass, FaReceipt,
  FaFileInvoiceDollar, FaDownload, FaEnvelope,
} from "react-icons/fa6";
import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import Loading from "../../../components/UI/Loading";
import { currencies, formatted, getStatusStyle } from "../../../helpers/utils";
import {
  fetchCustomers, approveTransaction,
  deliveredTransaction, cancelTransaction, emitInvoice,
} from "../../../services/customersApi";
import { fetchBusinessData } from "../../../services/businessApi";
import adminStyles from "../AdminDashboard.module.css";
import styles from "./Orders.module.css";

// ── Constantes ────────────────────────────────────────────────────────────────
const STATUS_LABEL = {
  "Pendiente de pago": "Pend. de pago",
  "Pendiente de validación": "Por validar",
  Aprobada: "Pago aprobado",
  Entregada: "Entregada",
  Cancelada: "Cancelada",
};

const STATUS_BAR = [
  { key: "Pendiente de pago", label: "Pend. pago", bg: "#FEF3C7", color: "#92400E" },
  { key: "Pendiente de validación", label: "Por validar", bg: "#DBEAFE", color: "#1E40AF" },
  { key: "Aprobada", label: "Aprobadas", bg: "#D1FAE5", color: "#065F46" },
  { key: "Entregada", label: "Entregadas", bg: "#CFFAFE", color: "#0E7490" },
  { key: "Cancelada", label: "Canceladas", bg: "#FEE2E2", color: "#991B1B" },
];

const APPROVABLE = (s) => ["Pendiente de pago", "Pendiente de validación"].includes(s);
const CANCELLABLE = (s) => ["Pendiente de pago", "Pendiente de validación", "Aprobada"].includes(s);
const INVOICEABLE = (s) => ["Aprobada", "Entregada"].includes(s);
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const sym = (code) => currencies.find(c => c.code === code)?.symbol || code || "";

// ── Helpers ───────────────────────────────────────────────────────────────────
const buildOrders = (customers) => {
  const map = {};
  customers.forEach(customer => {
    (customer.transactions || []).forEach(tx => {
      const key = tx.order_group || tx.transaction_id;
      if (!map[key]) map[key] = { order_id: key, customer, items: [], create_date: tx.create_date || "" };
      if ((tx.create_date || "") > map[key].create_date) map[key].create_date = tx.create_date;
      map[key].items.push(tx);
    });
  });
  return Object.values(map).sort((a, b) =>
    (b.create_date || "").localeCompare(a.create_date || "")
  );
};

const deliveryStatus = (deliveryDay, status) => {
  if (!deliveryDay || status === "Entregada" || status === "Cancelada") return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(deliveryDay + "T00:00:00");
  const diff = Math.floor((today - target) / 86400000);
  if (diff < 0) return { type: "green", label: `📅 En ${Math.abs(diff)} día${Math.abs(diff) !== 1 ? "s" : ""}` };
  if (diff === 0) return { type: "today", label: "📅 Entrega hoy" };
  if (diff <= 2) return { type: "yellow", label: `⚠️ Retraso ${diff} día${diff !== 1 ? "s" : ""}` };
  return { type: "red", label: `🚨 Retraso ${diff} días` };
};

const formatDate = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  const tod = new Date(); tod.setHours(0, 0, 0, 0);
  const yest = new Date(tod); yest.setDate(yest.getDate() - 1);
  const time = d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  if (d >= tod) return `Hoy · ${time}`;
  if (d >= yest) return `Ayer · ${time}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} · ${time}`;
};

const orderTotal = (items) =>
  items.reduce((s, t) =>
    s + (Number(t.price) || 0) * (Number(t.quantity) || 1) + (Number(t.delivery_price) || 0), 0
  );

// ── Componente ────────────────────────────────────────────────────────────────
const Orders = () => {
  const auth = getTokenInfo();
  const tenantId = auth?.sub;
  const { showError, showSuccess } = useNotification();
  const qc = useQueryClient();

  // Caché compartido con Clientes y Reportes — sin fetch extra
  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: ["customers", tenantId],
    queryFn: fetchCustomers,
    enabled: !!tenantId,
    retry: false,
  });

  // Caché compartido con Configuración del negocio — sin fetch extra
  const { data: business } = useQuery({
    queryKey: ["business", tenantId],
    queryFn: fetchBusinessData,
    enabled: !!tenantId,
    retry: false,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewOrder, setViewOrder] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [receiptUrl, setReceiptUrl] = useState(null);

  // Facturación
  const [invoiceTarget, setInvoiceTarget] = useState(null);
  const [invoiceType, setInvoiceType] = useState("recibo"); // "recibo" | "factura"
  const [ncfManual, setNcfManual] = useState("");

  const ncfEnabled = !!business?.ncf_enabled;
  const ncfPool = business?.ncf_pool || [];
  const ncfAvailable = ncfPool.filter(n => !n.used).length;

  const orders = useMemo(() => buildOrders(customers), [customers]);

  const statusCounts = useMemo(() => {
    const c = {};
    orders.forEach(o => { const s = o.items[0]?.status || ""; c[s] = (c[s] || 0) + 1; });
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter(o => {
      const matchSearch = !term ||
        (o.customer.full_name || "").toLowerCase().includes(term) ||
        (`${o.customer.given_name} ${o.customer.family_name}`).toLowerCase().includes(term) ||
        o.items.some(t => (t.product_name || "").toLowerCase().includes(term));
      const matchStatus = statusFilter === "all" || o.items[0]?.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["customers", tenantId] });

  const approveM = useMutation({
    mutationFn: ({ customerId, transactionId }) => approveTransaction(customerId, transactionId),
    onSuccess: () => { showSuccess("Aprobada", "Pago validado"); invalidate(); setViewOrder(null); },
    onError: (e) => showError("Error", e.message),
  });
  const deliverM = useMutation({
    mutationFn: ({ customerId, transactionId }) => deliveredTransaction(customerId, transactionId),
    onSuccess: () => { showSuccess("Entregada", "Orden marcada como entregada"); invalidate(); setViewOrder(null); },
    onError: (e) => showError("Error", e.message),
  });
  const cancelM = useMutation({
    mutationFn: ({ customerId, transactionId, reason }) => cancelTransaction(customerId, transactionId, reason),
    onSuccess: () => {
      showSuccess("Cancelada", "Orden cancelada");
      invalidate(); setCancelTarget(null); setCancelReason(""); setViewOrder(null);
    },
    onError: (e) => showError("Error", e.message),
  });

  // Emisión de comprobante (factura / recibo)
  const invoiceM = useMutation({
    mutationFn: (payload) => emitInvoice(payload),
    onSuccess: (res, vars) => {
      if (vars.action === "download" && res?.url) {
        window.open(res.url, "_blank", "noopener");
        showSuccess("Comprobante generado", "Se abrió el PDF en una pestaña nueva.");
      } else if (vars.action === "email") {
        showSuccess("Enviado", res?.message || "Comprobante enviado al correo del cliente.");
      }
      invalidate(); // refleja el ncf_used recién persistido
      closeInvoice();
    },
    onError: (e) => showError("Error", e.message),
  });

  const openInvoice = (order) => {
    setViewOrder(null);
    setInvoiceTarget(order);
    // Si ya fue facturada con NCF, arranca en modo factura; si no, recibo
    const existing = order.items.find(t => t.ncf_used)?.ncf_used;
    setInvoiceType(existing ? "factura" : "recibo");
    setNcfManual("");
  };

  const closeInvoice = () => {
    setInvoiceTarget(null);
    setNcfManual("");
    setInvoiceType("recibo");
  };

  const submitInvoice = (action) => {
    if (!invoiceTarget) return;
    invoiceM.mutate({
      order_group: invoiceTarget.order_id,
      customer_id: invoiceTarget.customer.customer_id,
      with_ncf: invoiceType === "factura",
      ncf_manual: ncfManual.trim().toUpperCase(),
      action,
    });
  };

  if (isLoading) return <Loading message="Cargando órdenes..." />;

  return (
    <div>
      <div className={adminStyles.adminHeader}>
        <h1>Órdenes</h1>
        <p>Vista operativa de todos los pedidos</p>
      </div>

      {/* ── Barra de estado ── */}
      <div className={styles.statusBar}>
        {STATUS_BAR.map(s => (
          <button
            key={s.key}
            className={`${styles.statusChip} ${statusFilter === s.key ? styles.statusChipActive : ""}`}
            style={statusFilter === s.key ? { background: s.bg, color: s.color, borderColor: s.color } : {}}
            onClick={() => setStatusFilter(prev => prev === s.key ? "all" : s.key)}
          >
            <span className={styles.chipCount} style={{ color: s.color }}>
              {statusCounts[s.key] || 0}
            </span>
            {s.label}
          </button>
        ))}
        <button className={styles.refreshBtn} onClick={() => refetch()}>
          <FaArrowsRotate /> Actualizar
        </button>
      </div>

      {/* ── Buscador ── */}
      <div className={styles.searchBar}>
        <FaMagnifyingGlass color="#667085" />
        <input
          className={styles.searchInput}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por cliente o producto..."
        />
        {search && <button className={styles.searchClear} onClick={() => setSearch("")}>×</button>}
      </div>

      {/* ── Lista ── */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          {orders.length === 0 ? "Aún no hay órdenes." : "No hay órdenes que coincidan con la búsqueda."}
        </div>
      ) : (
        <div className={styles.orderList}>
          {filtered.map(order => {
            const { customer, items, create_date, order_id } = order;
            const firstTx = items[0];
            const status = firstTx?.status || "";
            const cur = sym(firstTx?.payment_method?.currency || "");
            const total = orderTotal(items);
            const delivDay = items.map(t => t.delivery_day).filter(Boolean).sort()[0] || null;
            const ds = deliveryStatus(delivDay, status);
            const hasDelivery = items.some(t => t.fulfillment_type === "delivery");
            const hasTakeout = items.some(t => t.fulfillment_type === "takeout");
            const locality = items.find(t => t.locality)?.locality || "";
            const names = [...new Set(items.map(t => t.product_name).filter(Boolean))];
            const preview = names.slice(0, 2).join(", ") +
              (names.length > 2 ? ` y ${names.length - 2} más` : "");

            return (
              <div key={order_id} className={`${styles.orderCard} ${status === "Cancelada" ? styles.dimmed : ""}`}>
                <div className={styles.orderMain}>
                  {/* Fecha + cliente */}
                  <div className={styles.colLeft}>
                    <span className={styles.orderDate}>{formatDate(create_date)}</span>
                    <span className={styles.orderCustomer}>
                      {customer.full_name || `${customer.given_name} ${customer.family_name}`}
                    </span>
                    <span className={styles.orderEmail}>{customer.email}</span>
                  </div>

                  {/* Productos + entrega */}
                  <div className={styles.colCenter}>
                    <span className={styles.orderProducts}>{preview || "—"}</span>
                    {(hasDelivery || hasTakeout || locality) && (
                      <span className={styles.orderFulfillment}>
                        {hasDelivery ? "🛵 Delivery" : hasTakeout ? "🏪 Take out" : ""}
                        {locality ? ` · ${locality}` : ""}
                      </span>
                    )}
                  </div>

                  {/* Total + status + semáforo */}
                  <div className={styles.colRight}>
                    <span className={styles.orderTotal}>{cur} {formatted(total)}</span>
                    <span className={styles.statusBadge} style={getStatusStyle(status)}>
                      {STATUS_LABEL[status] || status}
                    </span>
                    {ds && (
                      <span className={`${styles.delivPill} ${styles[`ds_${ds.type}`]}`}>
                        {ds.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones rápidas */}
                <div className={styles.orderActions}>
                  <button className={styles.actBtn} onClick={() => setViewOrder(order)}>
                    <FaEye /> Ver
                  </button>
                  {APPROVABLE(status) && (
                    <button
                      className={`${styles.actBtn} ${styles.actApprove}`}
                      disabled={approveM.isPending}
                      onClick={() => approveM.mutate({ customerId: customer.customer_id, transactionId: firstTx.transaction_id })}
                    >
                      <FaCheck /> Aprobar
                    </button>
                  )}
                  {status === "Aprobada" && (
                    <button
                      className={`${styles.actBtn} ${styles.actApprove}`}
                      disabled={deliverM.isPending}
                      onClick={() => deliverM.mutate({ customerId: customer.customer_id, transactionId: firstTx.transaction_id })}
                    >
                      <FaTruck /> Entregada
                    </button>
                  )}
                  {INVOICEABLE(status) && (
                    <button
                      className={`${styles.actBtn} ${styles.actInvoice}`}
                      onClick={() => openInvoice(order)}
                    >
                      <FaFileInvoiceDollar /> Factura
                    </button>
                  )}
                  {CANCELLABLE(status) && (
                    <button
                      className={`${styles.actBtn} ${styles.actCancel}`}
                      onClick={() => setCancelTarget(order)}
                    >
                      <FaBan /> Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: detalle ── */}
      {viewOrder && (() => {
        const { customer, items } = viewOrder;
        const firstTx = items[0];
        const status = firstTx?.status || "";
        const cur = sym(firstTx?.payment_method?.currency || "");
        const subtotal = items.reduce((s, t) => s + (Number(t.price) || 0) * (Number(t.quantity) || 1), 0);
        const deliveryAmt = items.reduce((s, t) => s + (Number(t.delivery_price) || 0), 0);
        const discountAmt = items.reduce((s, t) => s + (Number(t.discount_amount) || 0), 0);
        const total = subtotal + deliveryAmt - discountAmt;
        const existingNcf = items.find(t => t.ncf_used)?.ncf_used || "";

        return (
          <div className={styles.overlay} onClick={() => setViewOrder(null)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <h3>Detalle de orden</h3>

              {/* Cliente */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Cliente</div>
                <div className={styles.row}>
                  <span className={styles.bold}>{customer.full_name || `${customer.given_name} ${customer.family_name}`}</span>
                  <span className={styles.muted}>{customer.email}</span>
                </div>
                {customer.phone && <div className={styles.muted} style={{ marginTop: ".2rem" }}>{customer.phone}</div>}
              </div>

              {/* Productos */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Productos ({items.length})</div>
                {items.map((t, i) => {
                  const itemDs = deliveryStatus(t.delivery_day, status);
                  return (
                    <div key={t.transaction_id || i} className={styles.itemRow}>
                      <div className={styles.itemName}>
                        {t.product_name}
                        {t.variant_label && <span className={styles.variantTag}>{t.variant_label}</span>}
                      </div>
                      <div className={styles.itemMeta}>
                        x{t.quantity} · {cur} {formatted(t.price)} c/u
                        {t.fulfillment_type && (
                          <span style={{ marginLeft: ".4rem" }}>
                            {t.fulfillment_type === "delivery" ? "🛵" : "🏪"}
                          </span>
                        )}
                      </div>
                      {t.delivery_day && (
                        <div className={styles.itemSub}>
                          Entrega: {t.delivery_day}
                          {itemDs && (
                            <span className={`${styles.delivPill} ${styles[`ds_${itemDs.type}`]}`} style={{ marginLeft: ".4rem" }}>
                              {itemDs.label}
                            </span>
                          )}
                        </div>
                      )}
                      {t.delivery_address && (
                        <div className={styles.itemSub}>📍 {t.delivery_address}</div>
                      )}
                      {(t.discount_amount > 0) && (
                        <div className={styles.itemDiscount}>
                          🎁 {t.offer_name ? `${t.offer_name} ·` : ""} −{cur} {formatted(t.discount_amount)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Totales */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Totales</div>
                <div className={styles.row}><span>Subtotal</span><strong>{cur} {formatted(subtotal)}</strong></div>
                {deliveryAmt > 0 && <div className={styles.row}><span>🛵 Delivery</span><strong>{cur} {formatted(deliveryAmt)}</strong></div>}
                {discountAmt > 0 && <div className={styles.row} style={{ color: "#067647" }}><span>🎁 Descuento</span><strong>− {cur} {formatted(discountAmt)}</strong></div>}
                <div className={styles.row} style={{ fontWeight: 800, borderTop: "2px solid #eef0f3", paddingTop: ".5rem", marginTop: ".25rem" }}>
                  <span>Total</span><strong>{cur} {formatted(total)}</strong>
                </div>
              </div>

              {/* Pago + estado */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Pago</div>
                <div className={styles.row}>
                  <span>{firstTx?.payment_method?.payment_type === "bank_transfer" ? "Transferencia bancaria" : "Link de pago"}</span>
                  <span className={styles.statusBadge} style={getStatusStyle(status)}>
                    {STATUS_LABEL[status] || status}
                  </span>
                </div>
                {existingNcf && (
                  <div style={{ fontSize: ".82rem", color: "#065F46", marginTop: ".4rem", fontWeight: 600 }}>
                    🧾 Facturada con NCF: <span style={{ fontFamily: "monospace" }}>{existingNcf}</span>
                  </div>
                )}
                {status === "Cancelada" && firstTx?.cancellation_reason && (
                  <div style={{ fontSize: ".82rem", color: "#b42318", marginTop: ".3rem" }}>
                    Razón: {firstTx.cancellation_reason}
                  </div>
                )}
              </div>

              {/* Comprobante de pago (subido por el cliente) */}
              {firstTx?.receipt_url && (
                <button className={styles.receiptBtn} onClick={() => setReceiptUrl(firstTx.receipt_url)}>
                  <FaReceipt /> Ver comprobante
                </button>
              )}

              <div className={styles.modalActions}>
                <button className={styles.btnOutline} onClick={() => setViewOrder(null)}>Cerrar</button>
                {INVOICEABLE(status) && (
                  <button className={styles.btnInvoice} onClick={() => openInvoice(viewOrder)}>
                    <FaFileInvoiceDollar /> Emitir factura
                  </button>
                )}
                {APPROVABLE(status) && (
                  <button className={styles.btnApprove} disabled={approveM.isPending}
                    onClick={() => approveM.mutate({ customerId: customer.customer_id, transactionId: firstTx.transaction_id })}>
                    <FaCheck /> Validar pago
                  </button>
                )}
                {status === "Aprobada" && (
                  <button className={styles.btnApprove} disabled={deliverM.isPending}
                    onClick={() => deliverM.mutate({ customerId: customer.customer_id, transactionId: firstTx.transaction_id })}>
                    <FaTruck /> Marcar entregada
                  </button>
                )}
                {CANCELLABLE(status) && (
                  <button className={styles.btnDanger}
                    onClick={() => { setViewOrder(null); setCancelTarget(viewOrder); }}>
                    <FaBan /> Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modal: emitir comprobante ── */}
      {invoiceTarget && (() => {
        const { customer, items } = invoiceTarget;
        const existingNcf = items.find(t => t.ncf_used)?.ncf_used || "";
        const custEmail = customer.email || "";
        const isFactura = invoiceType === "factura";
        // No se puede emitir factura nueva si no hay NCF y la orden no tiene uno ya asignado
        const noNcfLeft = isFactura && !existingNcf && !ncfManual.trim() && ncfAvailable === 0;
        const busy = invoiceM.isPending;

        return (
          <div className={styles.overlay} onClick={closeInvoice}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <h3>Emitir comprobante</h3>
              <p style={{ color: "#475467", marginBottom: "1rem", fontSize: ".9rem" }}>
                Orden <strong style={{ fontFamily: "monospace" }}>#{String(invoiceTarget.order_id).slice(0, 8).toUpperCase()}</strong>
                {" · "}{customer.full_name || `${customer.given_name} ${customer.family_name}`}
              </p>

              {existingNcf && (
                <div className={styles.invoiceNotice}>
                  🧾 Esta orden ya fue facturada con NCF <strong>{existingNcf}</strong>. Se reutilizará el mismo (no consume otro).
                </div>
              )}

              {/* Tipo de comprobante */}
              <div className={styles.invoiceOptions}>
                <label className={`${styles.invoiceOption} ${!isFactura ? styles.invoiceOptionActive : ""}`}>
                  <input type="radio" name="invtype" checked={!isFactura}
                    onChange={() => setInvoiceType("recibo")} disabled={!!existingNcf} />
                  <div>
                    <div className={styles.invoiceOptTitle}>📄 Recibo de pago</div>
                    <div className={styles.invoiceOptDesc}>Comprobante simple sin valor fiscal.</div>
                  </div>
                </label>

                <label className={`${styles.invoiceOption} ${isFactura ? styles.invoiceOptionActive : ""} ${!ncfEnabled ? styles.invoiceOptionDisabled : ""}`}>
                  <input type="radio" name="invtype" checked={isFactura}
                    onChange={() => setInvoiceType("factura")} disabled={!ncfEnabled} />
                  <div>
                    <div className={styles.invoiceOptTitle}>🧾 Factura con NCF</div>
                    <div className={styles.invoiceOptDesc}>
                      {ncfEnabled
                        ? `Comprobante fiscal. Disponibles: ${ncfAvailable}.`
                        : "Activa los NCF en Configuración → Facturación."}
                    </div>
                  </div>
                </label>
              </div>

              {/* NCF manual (solo factura, sin NCF ya asignado) */}
              {isFactura && !existingNcf && (
                <div className={styles.formGroup} style={{ marginBottom: "1rem" }}>
                  <label style={{ fontSize: ".82rem", fontWeight: 600, color: "#475467" }}>
                    NCF manual (opcional)
                  </label>
                  <input
                    className="input"
                    value={ncfManual}
                    onChange={e => setNcfManual(e.target.value.toUpperCase())}
                    placeholder="Dejar vacío para tomar el siguiente disponible"
                  />
                </div>
              )}

              {noNcfLeft && (
                <div className={styles.invoiceWarning}>
                  ⚠️ No tienes NCF disponibles. Carga más en Configuración → Facturación o escribe uno manual.
                </div>
              )}

              <div className={styles.modalActions} style={{ flexWrap: "wrap", gap: ".6rem" }}>
                <button className={styles.btnOutline} onClick={closeInvoice} disabled={busy}>Cerrar</button>
                <button className={styles.btnInvoice} disabled={busy || noNcfLeft}
                  onClick={() => submitInvoice("download")}>
                  <FaDownload /> {busy ? "Generando..." : "Descargar PDF"}
                </button>
                <button className={styles.btnApprove} disabled={busy || noNcfLeft || !custEmail}
                  title={!custEmail ? "El cliente no tiene correo registrado" : ""}
                  onClick={() => submitInvoice("email")}>
                  <FaEnvelope /> {busy ? "Enviando..." : "Enviar al cliente"}
                </button>
              </div>
              {!custEmail && (
                <p style={{ fontSize: ".78rem", color: "#b42318", marginTop: ".5rem", textAlign: "right" }}>
                  El cliente no tiene correo registrado.
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Modal: cancelar ── */}
      {cancelTarget && (
        <div className={styles.overlay} onClick={() => setCancelTarget(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Cancelar orden</h3>
            <p style={{ color: "#475467", marginBottom: "1rem" }}>
              ¿Cancelar la orden de{" "}
              <strong>
                {cancelTarget.customer.full_name || cancelTarget.customer.email}
              </strong>?
            </p>
            <textarea
              className={styles.cancelInput}
              rows={3}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Razón (opcional)"
            />
            <div className={styles.modalActions}>
              <button className={styles.btnOutline} onClick={() => { setCancelTarget(null); setCancelReason(""); }}>Cerrar</button>
              <button className={styles.btnDanger} disabled={cancelM.isPending}
                onClick={() => cancelM.mutate({
                  customerId: cancelTarget.customer.customer_id,
                  transactionId: cancelTarget.items[0].transaction_id,
                  reason: cancelReason || "No especificada",
                })}>
                {cancelM.isPending ? "Cancelando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: recibo ── */}
      {receiptUrl && (
        <div className={styles.overlay} onClick={() => setReceiptUrl(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Comprobante de pago</h3>
            <img src={receiptUrl} alt="Comprobante" style={{ width: "100%", borderRadius: "8px", marginBottom: "1rem" }} />
            <div className={styles.modalActions}>
              <button className={styles.btnOutline} onClick={() => setReceiptUrl(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;