import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FaPen, FaTrashCan, FaEye, FaArrowsRotate, FaPlus, FaWhatsapp,
  FaChevronDown, FaChevronUp, FaCheck, FaTruck, FaBan, FaReceipt, FaMagnifyingGlass,
} from "react-icons/fa6";

import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import Loading from "../../../components/UI/Loading";
import PrimaryButton from "../../../components/PrimaryButton";
import { currencies, formatted, getStatusStyle } from "../../../helpers/utils";
import { fetchBusinessData } from "../../../services/businessApi";
import { fetchProducts } from "../../../services/productsApi";
import { fetchPaymentMethods } from "../../../services/paymentMethodsApi";
import {
  fetchCustomers, createCustomer, updateCustomer, deleteCustomer,
  addTransaction, updateTransaction, deleteTransaction,
  approveTransaction, deliveredTransaction, cancelTransaction,
} from "../../../services/customersApi";
import adminStyles from "../AdminDashboard.module.css";
import styles from "./Customers.module.css";

const STATUS_LABEL = {
  Aprobada: "Pago Completado",
  Entregada: "Orden Entregada",
  "Pendiente de pago": "Pendiente de pago",
  "Pendiente de validación": "Pendiente de validación",
  Cancelada: "Cancelada",
};
const EDITABLE = (s) => !["Aprobada", "Entregada", "Cancelada"].includes(s);
const APPROVABLE = (s) => ["Pendiente de pago", "Pendiente de validación"].includes(s);

const emptyCustomer = { customer_id: "", given_name: "", family_name: "", email: "", phone: "" };
const emptyTx = { transaction_id: "", product_id: "", product_name: "", price: "", quantity: 1, delivery_day: "", payment_method_id: "" };

const Customers = () => {
  const auth = getTokenInfo();
  const tenantId = auth?.sub;
  const { showError, showWarning, showSuccess } = useNotification();
  const queryClient = useQueryClient();

  const { data: business } = useQuery({ queryKey: ["business", tenantId], queryFn: fetchBusinessData, enabled: !!tenantId, retry: false });
  const { data: customers = [], isLoading, refetch } = useQuery({ queryKey: ["customers", tenantId], queryFn: fetchCustomers, enabled: !!tenantId, retry: false });
  const { data: products = [] } = useQuery({ queryKey: ["products", tenantId], queryFn: fetchProducts, enabled: !!tenantId, retry: false });
  const { data: paymentMethods = [] } = useQuery({ queryKey: ["paymentMethods", tenantId], queryFn: fetchPaymentMethods, enabled: !!tenantId, retry: false });

  const [cForm, setCForm] = useState(emptyCustomer);
  const [cErrors, setCErrors] = useState({});
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [txCustomer, setTxCustomer] = useState(null);
  const [txForm, setTxForm] = useState(emptyTx);
  const [txErrors, setTxErrors] = useState({});

  const [viewTx, setViewTx] = useState(null);            // { customer, tx }
  const [cancelTarget, setCancelTarget] = useState(null); // { customer, tx }
  const [cancelReason, setCancelReason] = useState("");
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [delCustomer, setDelCustomer] = useState(null);
  const [delTx, setDelTx] = useState(null);              // { customer, tx }

  const editingCustomer = !!cForm.customer_id;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["customers", tenantId] });
  const symbol = (code) => currencies.find((c) => c.code === code)?.symbol || code || "";
  const txCurrency = (t) => symbol(t.payment_method?.currency);
  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return customers
      .map((c) => ({
        ...c,
        _txs: statusFilter === "all"
          ? (c.transactions || [])
          : (c.transactions || []).filter((t) => t.status === statusFilter),
      }))
      .filter((c) => {
        const matchesName = !term ||
          (c.full_name || "").toLowerCase().includes(term) ||
          (c.email || "").toLowerCase().includes(term);
        const matchesStatus = statusFilter === "all" || c._txs.length > 0;
        return matchesName && matchesStatus;
      });
  }, [customers, search, statusFilter]);

  // ---- Mutaciones ----
  const saveCustomer = useMutation({
    mutationFn: (payload) => (payload.customer_id ? updateCustomer(payload) : createCustomer(payload)),
    onSuccess: () => { showSuccess("¡Éxito!", editingCustomer ? "Cliente actualizado" : "Cliente creado"); invalidate(); setCForm(emptyCustomer); setCErrors({}); },
    onError: (e) => showWarning("Revisa la información", e.message),
  });
  const delCustomerM = useMutation({
    mutationFn: (id) => deleteCustomer(id),
    onSuccess: () => { showSuccess("Eliminado", "Cliente eliminado"); invalidate(); setDelCustomer(null); },
    onError: (e) => showError("Error", e.message),
  });
  const saveTx = useMutation({
    mutationFn: () => {
      const pm = paymentMethods.find((p) => p.payment_method_id === txForm.payment_method_id);
      const t = {
        transaction_id: txForm.transaction_id || undefined,
        product_id: txForm.product_id, product_name: txForm.product_name,
        price: Number(txForm.price) || 0, quantity: Number(txForm.quantity) || 1,
        delivery_day: txForm.delivery_day, payment_method: pm,
      };
      return txForm.transaction_id ? updateTransaction(txCustomer.customer_id, t) : addTransaction(txCustomer.customer_id, t);
    },
    onSuccess: () => { showSuccess("¡Éxito!", txForm.transaction_id ? "Transacción actualizada" : "Transacción creada"); invalidate(); closeTxModal(); },
    onError: (e) => showWarning("Revisa la información", e.message),
  });
  const delTxM = useMutation({
    mutationFn: ({ customerId, transactionId }) => deleteTransaction(customerId, transactionId),
    onSuccess: () => { showSuccess("Eliminada", "Transacción eliminada"); invalidate(); setDelTx(null); },
    onError: (e) => showError("Error", e.message),
  });
  const approveM = useMutation({
    mutationFn: ({ customerId, transactionId }) => approveTransaction(customerId, transactionId),
    onSuccess: () => { showSuccess("Aprobada", "Pago validado"); invalidate(); setViewTx(null); },
    onError: (e) => showError("Error", e.message),
  });
  const deliverM = useMutation({
    mutationFn: ({ customerId, transactionId }) => deliveredTransaction(customerId, transactionId),
    onSuccess: () => { showSuccess("Entregada", "Orden marcada como entregada"); invalidate(); setViewTx(null); },
    onError: (e) => showError("Error", e.message),
  });
  const cancelM = useMutation({
    mutationFn: ({ customerId, transactionId, reason }) => cancelTransaction(customerId, transactionId, reason),
    onSuccess: () => { showSuccess("Cancelada", "Transacción cancelada"); invalidate(); setCancelTarget(null); setCancelReason(""); setViewTx(null); },
    onError: (e) => showError("Error", e.message),
  });

  // ---- Handlers ----
  const submitCustomer = (e) => {
    e.preventDefault();
    const err = {};
    if (!cForm.given_name.trim()) err.given_name = "El nombre es requerido";
    if (!cForm.family_name.trim()) err.family_name = "El apellido es requerido";
    if (!cForm.email.trim()) err.email = "El email es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cForm.email)) err.email = "Email inválido";
    setCErrors(err);
    if (Object.keys(err).length) return;
    saveCustomer.mutate({
      customer_id: cForm.customer_id || undefined,
      given_name: cForm.given_name.trim(), family_name: cForm.family_name.trim(),
      email: cForm.email.trim(), phone: cForm.phone, business_id: business?.business_id,
    });
  };

  const openAddTx = (customer) => { setTxCustomer(customer); setTxForm(emptyTx); setTxErrors({}); };
  const openEditTx = (customer, t) => {
    setTxCustomer(customer);
    setTxForm({
      transaction_id: t.transaction_id, product_id: t.product_id, product_name: t.product_name,
      price: t.price ?? "", quantity: t.quantity ?? 1, delivery_day: t.delivery_day || "",
      payment_method_id: t.payment_method?.payment_method_id || "",
    });
    setTxErrors({});
  };
  const closeTxModal = () => { setTxCustomer(null); setTxForm(emptyTx); setTxErrors({}); };

  const pickProduct = (id) => {
    const p = products.find((x) => x.product_id === id);
    setTxForm((f) => ({ ...f, product_id: id, product_name: p?.name || "", price: p ? p.price : f.price }));
  };

  const submitTx = (e) => {
    e.preventDefault();
    const err = {};
    if (!txForm.product_id) err.product = "Selecciona un producto";
    if (!txForm.payment_method_id) err.pm = "Selecciona un método de pago";
    if (txForm.price === "" || Number(txForm.price) <= 0) err.price = "Precio inválido";
    if (Number(txForm.quantity) < 1) err.quantity = "Cantidad inválida";
    setTxErrors(err);
    if (Object.keys(err).length) return;
    saveTx.mutate();
  };

  if (isLoading) return <Loading message="Cargando clientes..." />;

  return (
    <div>
      <div className={adminStyles.adminHeader}>
        <h1>Gestión de Clientes</h1>
      </div>

      {/* Formulario cliente */}
      <div className={styles.card}>
        <h2>{editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}</h2>
        <form onSubmit={submitCustomer}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Nombre *</label>
              <input className="input" value={cForm.given_name} onChange={(e) => setCForm({ ...cForm, given_name: e.target.value })} placeholder="Juan" />
              {cErrors.given_name && <span className={styles.err}>{cErrors.given_name}</span>}
            </div>
            <div className={styles.formGroup}>
              <label>Apellido *</label>
              <input className="input" value={cForm.family_name} onChange={(e) => setCForm({ ...cForm, family_name: e.target.value })} placeholder="Pérez" />
              {cErrors.family_name && <span className={styles.err}>{cErrors.family_name}</span>}
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Email *</label>
              <input className="input" value={cForm.email} onChange={(e) => setCForm({ ...cForm, email: e.target.value })} placeholder="juan@ejemplo.com" />
              {cErrors.email && <span className={styles.err}>{cErrors.email}</span>}
            </div>
            <div className={styles.formGroup}>
              <label>Teléfono</label>
              <input className="input" value={cForm.phone} onChange={(e) => setCForm({ ...cForm, phone: e.target.value })} placeholder="18095551212" />
            </div>
          </div>
          <div className={styles.formActions}>
            <PrimaryButton type="submit" disabled={saveCustomer.isPending}>
              {saveCustomer.isPending ? "Guardando..." : editingCustomer ? "Actualizar cliente" : "Crear cliente"}
            </PrimaryButton>
            {editingCustomer && <button type="button" className={styles.btnOutline} onClick={() => { setCForm(emptyCustomer); setCErrors({}); }}>Cancelar</button>}
          </div>
        </form>
      </div>

      {/* Listado */}
      <div className={styles.listHeader}>
        <h2>Clientes existentes</h2>
        <button className={styles.refreshBtn} onClick={() => refetch()}><FaArrowsRotate /> Actualizar</button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBar}>
          <FaMagnifyingGlass />
          <input
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
          />
        </div>
        <select className={`input ${styles.statusSelect}`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos los estados</option>
          {Object.keys(STATUS_LABEL).map((s) => (<option key={s} value={s}>{STATUS_LABEL[s]}</option>))}
        </select>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className={styles.empty}>
          {customers.length === 0 ? "Aún no tienes clientes." : "No hay clientes que coincidan con la búsqueda."}
        </div>
      ) : (
        <div className={styles.list}>
          {filteredCustomers.map((c) => {
            const txs = c._txs;
            const open = !!expanded[c.customer_id] || statusFilter !== "all";
            const wa = `https://wa.me/${(c.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${c.full_name}, te escribo de "${business?.name || ""}".`)}`;
            return (
              <div key={c.customer_id} className={styles.customerCard}>
                <div className={styles.customerHead}>
                  <div className={styles.customerInfo}>
                    <span className={styles.customerName}>{c.full_name}</span>
                    <span className={styles.customerMeta}>{c.email}</span>
                    {c.phone && <a className={styles.waLink} href={wa} target="_blank" rel="noreferrer">{c.phone} <FaWhatsapp color="#25D366" /></a>}
                  </div>
                  <div className={styles.customerActions}>
                    <button className={styles.iconBtn} onClick={() => openAddTx(c)} aria-label="Agregar transacción"><FaPlus /></button>
                    <button className={styles.iconBtn} onClick={() => { setCForm({ customer_id: c.customer_id, given_name: c.given_name, family_name: c.family_name, email: c.email, phone: c.phone }); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="Editar"><FaPen /></button>
                    <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => setDelCustomer(c)} aria-label="Eliminar"><FaTrashCan /></button>
                    <button className={styles.expandBtn} onClick={() => toggle(c.customer_id)}>
                      {txs.length} {txs.length === 1 ? "orden" : "órdenes"} {open ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>
                </div>

                {open && (
                  <div className={styles.txWrap}>
                    {txs.length === 0 ? (
                      <div className={styles.txEmpty}>Sin transacciones.</div>
                    ) : (
                      txs.map((t) => (
                        <div key={t.transaction_id} className={styles.txRow}>
                          <span className={styles.txProduct}>{t.product_name}</span>
                          <span>x{t.quantity}</span>
                          <span>{txCurrency(t)} {formatted(t.price)}</span>
                          <span className={styles.txTotal}>{txCurrency(t)} {formatted(t.price * t.quantity)}</span>
                          <span style={getStatusStyle(t.status)}>{STATUS_LABEL[t.status] || t.status}</span>
                          <span className={styles.txActions}>
                            <button className={styles.iconBtn} onClick={() => setViewTx({ customer: c, tx: t })} aria-label="Ver"><FaEye /></button>
                            {EDITABLE(t.status) && <button className={styles.iconBtn} onClick={() => openEditTx(c, t)} aria-label="Editar"><FaPen /></button>}
                            {t.status === "Pendiente de pago" && <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => setDelTx({ customer: c, tx: t })} aria-label="Eliminar"><FaTrashCan /></button>}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal transacción (crear/editar) */}
      {txCustomer && (
        <div className={styles.modalOverlay} onClick={closeTxModal}>
          <div className={`${styles.modal} ${styles.modalWide}`} onClick={(e) => e.stopPropagation()}>
            <h3>{txForm.transaction_id ? "Editar transacción" : "Nueva transacción"} — {txCustomer.full_name}</h3>
            <form onSubmit={submitTx}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Producto *</label>
                  <select className="input" value={txForm.product_id} onChange={(e) => pickProduct(e.target.value)}>
                    <option value="">Selecciona un producto</option>
                    {products.map((p) => (<option key={p.product_id} value={p.product_id}>{p.name}</option>))}
                  </select>
                  {txErrors.product && <span className={styles.err}>{txErrors.product}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label>Método de pago *</label>
                  <select className="input" value={txForm.payment_method_id} onChange={(e) => setTxForm({ ...txForm, payment_method_id: e.target.value })}>
                    <option value="">Selecciona un método</option>
                    {paymentMethods.map((pm) => (<option key={pm.payment_method_id} value={pm.payment_method_id}>{pm.payment_method_name}</option>))}
                  </select>
                  {txErrors.pm && <span className={styles.err}>{txErrors.pm}</span>}
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Precio *</label>
                  <input type="number" step="0.01" min="0" className="input" value={txForm.price} onChange={(e) => setTxForm({ ...txForm, price: e.target.value })} placeholder="1850.00" />
                  {txErrors.price && <span className={styles.err}>{txErrors.price}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label>Cantidad *</label>
                  <input type="number" min="1" className="input" value={txForm.quantity} onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })} />
                  {txErrors.quantity && <span className={styles.err}>{txErrors.quantity}</span>}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Fecha de entrega</label>
                <input type="date" className="input" value={txForm.delivery_day} onChange={(e) => setTxForm({ ...txForm, delivery_day: e.target.value })} />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnOutline} onClick={closeTxModal}>Cancelar</button>
                <PrimaryButton type="submit" disabled={saveTx.isPending}>{saveTx.isPending ? "Guardando..." : txForm.transaction_id ? "Actualizar" : "Crear"}</PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal detalle transacción */}
      {viewTx && (() => {
        const { customer, tx } = viewTx;
        const cur = txCurrency(tx);
        return (
          <div className={styles.modalOverlay} onClick={() => setViewTx(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>{tx.product_name}</h3>
              <ul className={styles.detailList}>
                <li><span>Cantidad</span><strong>{tx.quantity}</strong></li>
                <li><span>Precio</span><strong>{cur} {formatted(tx.price)}</strong></li>
                <li><span>Total</span><strong>{cur} {formatted(tx.price * tx.quantity)}</strong></li>
                {tx.delivery_day && <li><span>Entrega</span><strong>{tx.delivery_day}</strong></li>}
                <li><span>Método</span><strong>{tx.payment_method?.payment_type === "bank_transfer" ? "Transferencia" : "Link de pago"}</strong></li>
                <li><span>Estado</span><strong style={getStatusStyle(tx.status)}>{STATUS_LABEL[tx.status] || tx.status}</strong></li>
                {tx.status === "Cancelada" && <li><span>Razón</span><strong>{tx.cancellation_reason}</strong></li>}
              </ul>
              <div className={styles.workflow}>
                {tx.receipt_url && <button className={styles.wfBtn} onClick={() => setReceiptUrl(tx.receipt_url)}><FaReceipt /> Ver recibo</button>}
                {APPROVABLE(tx.status) && <button className={`${styles.wfBtn} ${styles.wfOk}`} disabled={approveM.isPending} onClick={() => approveM.mutate({ customerId: customer.customer_id, transactionId: tx.transaction_id })}><FaCheck /> Validar pago</button>}
                {tx.status === "Aprobada" && <button className={`${styles.wfBtn} ${styles.wfOk}`} disabled={deliverM.isPending} onClick={() => deliverM.mutate({ customerId: customer.customer_id, transactionId: tx.transaction_id })}><FaTruck /> Marcar entregada</button>}
                {APPROVABLE(tx.status) && <button className={`${styles.wfBtn} ${styles.wfDanger}`} onClick={() => setCancelTarget({ customer, tx })}><FaBan /> Cancelar orden</button>}
              </div>
              <div className={styles.modalActions}>
                <button className={styles.btnOutline} onClick={() => setViewTx(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal cancelar (razón) */}
      {cancelTarget && (
        <div className={styles.modalOverlay} onClick={() => setCancelTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Cancelar transacción</h3>
            <textarea className="input" rows={4} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Razón de la cancelación" />
            <div className={styles.modalActions}>
              <button className={styles.btnOutline} onClick={() => { setCancelTarget(null); setCancelReason(""); }}>Cerrar</button>
              <button className={styles.btnDanger} disabled={cancelM.isPending} onClick={() => cancelM.mutate({ customerId: cancelTarget.customer.customer_id, transactionId: cancelTarget.tx.transaction_id, reason: cancelReason || "No especificada" })}>
                {cancelM.isPending ? "Cancelando..." : "Confirmar cancelación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal recibo */}
      {receiptUrl && (
        <div className={styles.modalOverlay} onClick={() => setReceiptUrl(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Recibo de pago</h3>
            <img src={receiptUrl} alt="Recibo" className={styles.receiptImg} />
            <div className={styles.modalActions}><button className={styles.btnOutline} onClick={() => setReceiptUrl(null)}>Cerrar</button></div>
          </div>
        </div>
      )}

      {/* Modal eliminar cliente */}
      {delCustomer && (
        <div className={styles.modalOverlay} onClick={() => setDelCustomer(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar cliente</h3>
            <p>¿Eliminar a <strong>{delCustomer.full_name}</strong>? Se borrarán también todas sus transacciones. Esta acción no se puede deshacer.</p>
            <div className={styles.modalActions}>
              <button className={styles.btnOutline} onClick={() => setDelCustomer(null)}>Cancelar</button>
              <button className={styles.btnDanger} disabled={delCustomerM.isPending} onClick={() => delCustomerM.mutate(delCustomer.customer_id)}>{delCustomerM.isPending ? "Eliminando..." : "Sí, eliminar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar transacción */}
      {delTx && (
        <div className={styles.modalOverlay} onClick={() => setDelTx(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar transacción</h3>
            <p>¿Eliminar la orden de <strong>{delTx.tx.product_name}</strong>?</p>
            <div className={styles.modalActions}>
              <button className={styles.btnOutline} onClick={() => setDelTx(null)}>Cancelar</button>
              <button className={styles.btnDanger} disabled={delTxM.isPending} onClick={() => delTxM.mutate({ customerId: delTx.customer.customer_id, transactionId: delTx.tx.transaction_id })}>{delTxM.isPending ? "Eliminando..." : "Sí, eliminar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;