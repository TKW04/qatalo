import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FaPen, FaTrashCan, FaEye, FaArrowsRotate, FaPlus, FaWhatsapp,
  FaChevronDown, FaChevronUp, FaCheck, FaTruck, FaBan, FaReceipt, FaMagnifyingGlass,
} from "react-icons/fa6";

import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import { Bike, Gift, Users, SearchX } from "lucide-react";
import { PageHeader, Button, IconButton, Modal, EmptyState, StatusBadge, OrderStepper, SkeletonList } from "../../../components/admin";
import { currencies, formatted } from "../../../helpers/utils";
import { txTotal } from "../../../helpers/orderTotals";
import { fetchBusinessData } from "../../../services/businessApi";
import { fetchProducts } from "../../../services/productsApi";
import { fetchPaymentMethods } from "../../../services/paymentMethodsApi";
import {
  fetchCustomers, createCustomer, updateCustomer, deleteCustomer, mergeCustomers,
  addTransaction, updateTransaction, deleteTransaction,
  approveTransaction, deliveredTransaction, cancelTransaction,
} from "../../../services/customersApi";
import DatePicker from "../../../components/DatePicker";
import styles from "./Customers.module.css";
import Select from "../../../components/Select";

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
const emptyTx = { transaction_id: "", product_id: "", product_name: "", price: "", quantity: 1, delivery_day: "", payment_method_id: "", locality: "", };

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

  // ---- Fusión de clientes ----
  const [mergeSelection, setMergeSelection] = useState([]);   // hasta 2 customer_id
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeChoices, setMergeChoices] = useState({ name: "A", email: "A", phone: "A" });

  const editingCustomer = !!cForm.customer_id;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["customers", tenantId] });
  const symbol = (code) => currencies.find((c) => c.code === code)?.symbol || code || "";
  const productCurrency = (productId) => products.find((p) => p.product_id === productId)?.currency || "";
  const txCurrency = (t) => symbol(t.currency || t.payment_method?.currency || productCurrency(t.product_id));
  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const toggleMergeSelect = (id) => {
    setMergeSelection((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) { showWarning("Aviso", "Solo puedes seleccionar 2 clientes para fusionar"); return prev; }
      return [...prev, id];
    });
  };
  const clearMergeSelection = () => setMergeSelection([]);
  const openMergeModal = () => { setMergeChoices({ name: "A", email: "A", phone: "A" }); setMergeModalOpen(true); };
  const closeMergeModal = () => setMergeModalOpen(false);
  const mergeA = customers.find((c) => c.customer_id === mergeSelection[0]) || null;
  const mergeB = customers.find((c) => c.customer_id === mergeSelection[1]) || null;

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
  const mergeM = useMutation({
    mutationFn: () => {
      const pick = (field, aVal, bVal) => (mergeChoices[field] === "A" ? aVal : bVal);
      return mergeCustomers({
        keep_customer_id: mergeA.customer_id,
        remove_customer_id: mergeB.customer_id,
        given_name: pick("name", mergeA.given_name, mergeB.given_name),
        family_name: pick("name", mergeA.family_name, mergeB.family_name),
        email: pick("email", mergeA.email, mergeB.email),
        phone: pick("phone", mergeA.phone, mergeB.phone),
      });
    },
    onSuccess: () => {
      showSuccess("¡Fusionados!", "Los clientes se combinaron correctamente");
      invalidate();
      closeMergeModal();
      clearMergeSelection();
    },
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
        locality: txForm.locality || "",
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
      locality: t.locality || "",
      initial_price: t.price ?? "", discount_amount: t.discount_amount || 0,
    });
    setTxErrors({});
  };
  const closeTxModal = () => { setTxCustomer(null); setTxForm(emptyTx); setTxErrors({}); };

  const pickProduct = (id) => {
    const p = products.find((x) => x.product_id === id);
    setTxForm((f) => ({ ...f, product_id: id, product_name: p?.name || "", price: p ? p.price : f.price, locality: "", }));
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

  const header = <PageHeader title="Clientes" description="Registra clientes, sus órdenes y los pagos recibidos." />;

  if (isLoading) {
    return (
      <div>
        {header}
        <SkeletonList rows={5} media={false} label="Cargando clientes..." />
      </div>
    );
  }

  return (
    <div>
      {header}

      {/* Formulario cliente */}
      <section className={styles.card} aria-labelledby="customer-form-title">
        <h2 id="customer-form-title">{editingCustomer ? "Editar cliente" : "Nuevo cliente"}</h2>
        <p className={styles.requiredNote}>
          Los campos marcados con <span className={styles.required}>*</span> son obligatorios.
        </p>
        <form onSubmit={submitCustomer} noValidate>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="cust-given">Nombre <span className={styles.required}>*</span></label>
              <input id="cust-given" className="input" value={cForm.given_name} onChange={(e) => setCForm({ ...cForm, given_name: e.target.value })} placeholder="Juan" autoComplete="given-name" aria-invalid={!!cErrors.given_name || undefined} />
              {cErrors.given_name && <span className={styles.err}>{cErrors.given_name}</span>}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="cust-family">Apellido <span className={styles.required}>*</span></label>
              <input id="cust-family" className="input" value={cForm.family_name} onChange={(e) => setCForm({ ...cForm, family_name: e.target.value })} placeholder="Pérez" autoComplete="family-name" aria-invalid={!!cErrors.family_name || undefined} />
              {cErrors.family_name && <span className={styles.err}>{cErrors.family_name}</span>}
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="cust-email">Email <span className={styles.required}>*</span></label>
              <input id="cust-email" type="email" className="input" value={cForm.email} onChange={(e) => setCForm({ ...cForm, email: e.target.value })} placeholder="juan@ejemplo.com" autoComplete="email" aria-invalid={!!cErrors.email || undefined} />
              {cErrors.email && <span className={styles.err}>{cErrors.email}</span>}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="cust-phone">Teléfono <span className={styles.required}>*</span></label>
              <input id="cust-phone" type="tel" className="input" value={cForm.phone} onChange={(e) => setCForm({ ...cForm, phone: e.target.value })} placeholder="18095551212" autoComplete="tel" />
            </div>
          </div>
          <div className={styles.formActions}>
            <Button type="submit" loading={saveCustomer.isPending}>
              {saveCustomer.isPending ? "Guardando..." : editingCustomer ? "Actualizar cliente" : "Crear cliente"}
            </Button>
            {editingCustomer && <Button variant="secondary" onClick={() => { setCForm(emptyCustomer); setCErrors({}); }}>Cancelar</Button>}
          </div>
        </form>
      </section>

      {/* Listado */}
      <div className={styles.listHeader}>
        <h2>Tus clientes</h2>
        <div className={styles.listActions}>
          {mergeSelection.length > 0 && (
            <>
              <span className={styles.mergeCount} aria-live="polite">
                {mergeSelection.length} de 2 seleccionados para fusionar
              </span>
              <Button variant="secondary" size="sm" onClick={clearMergeSelection}>
                Cancelar selección
              </Button>
              <Button variant="secondary" size="sm" disabled={mergeSelection.length !== 2} onClick={openMergeModal}>
                Fusionar clientes
              </Button>
            </>
          )}
          <Button variant="secondary" size="sm" icon={FaArrowsRotate} onClick={() => refetch()}>Actualizar</Button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBar}>
          <FaMagnifyingGlass aria-hidden="true" />
          <label htmlFor="cust-search" className={styles.srOnly}>Buscar clientes</label>
          <input
            id="cust-search"
            type="search"
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
          />
        </div>
        <div className={styles.statusSelect}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e)}
            options={[
              { value: "all", label: "Todos los estados" },
              ...Object.keys(STATUS_LABEL).map((s) => ({ value: s, label: STATUS_LABEL[s] })),
            ]}
          />
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aún no tienes clientes"
            description="Se agregan solos cuando alguien pide desde tu catálogo, o puedes crearlos con el formulario de arriba."
            action={<Button variant="secondary" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); document.getElementById("cust-given")?.focus({ preventScroll: true }); }}>Crear cliente</Button>}
          />
        ) : (
          <EmptyState
            icon={SearchX}
            title="No hay clientes que coincidan"
            description="Prueba con otro nombre o quita el filtro de estado."
            action={<Button variant="secondary" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Quitar filtros</Button>}
          />
        )
      ) : (
        <div className={styles.list}>
          {filteredCustomers.map((c) => {
            const txs = c._txs;
            const open = !!expanded[c.customer_id] || statusFilter !== "all";
            const wa = `https://wa.me/${(c.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${c.full_name}, te escribo de "${business?.name || ""}".`)}`;
            const txPanelId = `cust-tx-${c.customer_id}`;
            return (
              <div key={c.customer_id} className={styles.customerCard}>
                <div className={styles.customerHead}>
                  <div className={styles.customerMain}>
                    <label className={styles.mergeCheck} title="Seleccionar para fusionar">
                      <input
                        type="checkbox"
                        checked={mergeSelection.includes(c.customer_id)}
                        onChange={() => toggleMergeSelect(c.customer_id)}
                        aria-label={`Seleccionar a ${c.full_name} para fusionar`}
                      />
                    </label>
                    <div className={styles.customerInfo}>
                      <span className={styles.customerName}>{c.full_name}</span>
                      <span className={styles.customerMeta}>{c.email}</span>
                      {c.phone && (
                        <a className={styles.waLink} href={wa} target="_blank" rel="noreferrer" aria-label={`Escribir por WhatsApp a ${c.phone}`}>
                          {c.phone} <FaWhatsapp aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className={styles.customerActions}>
                    <IconButton icon={FaPlus} label="Agregar transacción" onClick={() => openAddTx(c)} />
                    <IconButton icon={FaPen} label={`Editar a ${c.full_name}`} onClick={() => { setCForm({ customer_id: c.customer_id, given_name: c.given_name, family_name: c.family_name, email: c.email, phone: c.phone }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
                    <IconButton icon={FaTrashCan} variant="danger" label={`Eliminar a ${c.full_name}`} onClick={() => setDelCustomer(c)} />
                    <button type="button" className={styles.expandBtn} onClick={() => toggle(c.customer_id)} aria-expanded={open} aria-controls={txPanelId}>
                      {txs.length} {txs.length === 1 ? "orden" : "órdenes"} {open ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {open && (
                  <div className={styles.txWrap} id={txPanelId}>
                    {txs.length === 0 ? (
                      <div className={styles.txEmpty}>
                        Sin transacciones.
                        <Button variant="ghost" size="sm" icon={FaPlus} onClick={() => openAddTx(c)}>Agregar transacción</Button>
                      </div>
                    ) : (
                      txs.map((t) => (
                        <div key={t.transaction_id} className={styles.txRow}>
                          <span className={styles.txProduct}>{t.product_name}</span>
                          <span className={styles.txQty}>x{t.quantity}</span>
                          <span className={styles.txPrice}>{txCurrency(t)} {formatted(t.price)}</span>
                          <span className={styles.txTotal}>{txCurrency(t)} {formatted(txTotal(t))}</span>
                          <span className={styles.txStatus}><StatusBadge status={t.status}>{STATUS_LABEL[t.status] || t.status}</StatusBadge></span>
                          <span className={styles.txActions}>
                            <IconButton icon={FaEye} label="Ver transacción" onClick={() => setViewTx({ customer: c, tx: t })} />
                            {EDITABLE(t.status) && <IconButton icon={FaPen} label="Editar transacción" onClick={() => openEditTx(c, t)} />}
                            {t.status === "Pendiente de pago" && <IconButton icon={FaTrashCan} variant="danger" label="Eliminar transacción" onClick={() => setDelTx({ customer: c, tx: t })} />}
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
      <Modal
        open={!!txCustomer}
        onClose={closeTxModal}
        size="lg"
        dismissible={!saveTx.isPending}
        title={txForm.transaction_id ? "Editar transacción" : "Nueva transacción"}
        description={txCustomer?.full_name}
        footer={
          <>
            <Button variant="secondary" onClick={closeTxModal} disabled={saveTx.isPending}>Cancelar</Button>
            <Button type="submit" form="cust-tx-form" loading={saveTx.isPending}>{saveTx.isPending ? "Guardando..." : txForm.transaction_id ? "Actualizar" : "Crear"}</Button>
          </>
        }
      >
        {txCustomer && (
          <form id="cust-tx-form" onSubmit={submitTx} noValidate>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <span className={styles.groupLabel}>Producto <span className={styles.required}>*</span></span>
                <Select
                  value={txForm.product_id}
                  onChange={(e) => pickProduct(e)}
                  options={[
                    { value: "", label: "Selecciona un producto" },
                    ...products.map((p) => ({ value: p.product_id, label: p.name })),
                  ]}
                />
                {txErrors.product && <span className={styles.err}>{txErrors.product}</span>}
              </div>
              <div className={styles.formGroup}>
                <span className={styles.groupLabel}>Método de pago <span className={styles.required}>*</span></span>
                <Select
                  value={txForm.payment_method_id}
                  onChange={(e) => setTxForm({ ...txForm, payment_method_id: e })}
                  options={[
                    { value: "", label: "Selecciona un método" },
                    ...paymentMethods.map((pm) => ({ value: pm.payment_method_id, label: pm.payment_method_name })),
                  ]}
                />
                {txErrors.pm && <span className={styles.err}>{txErrors.pm}</span>}
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="tx-price">Precio <span className={styles.required}>*</span></label>
                <input id="tx-price" type="number" step="0.01" min="0" inputMode="decimal" className="input" value={txForm.price} onChange={(e) => setTxForm({ ...txForm, price: e.target.value })} placeholder="1850.00" />
                {txErrors.price && <span className={styles.err}>{txErrors.price}</span>}
                {Number(txForm.discount_amount) > 0 && Number(txForm.price) !== Number(txForm.initial_price) && (
                  <span className={styles.warnHint} role="status">Al cambiar el precio se quita el descuento de esta línea.</span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="tx-qty">Cantidad <span className={styles.required}>*</span></label>
                <input id="tx-qty" type="number" min="1" inputMode="numeric" className="input" value={txForm.quantity} onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })} />
                {txErrors.quantity && <span className={styles.err}>{txErrors.quantity}</span>}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="tx-delivery">Fecha de entrega</label>
              <DatePicker id="tx-delivery" className="input" value={txForm.delivery_day} onChange={(v) => setTxForm({ ...txForm, delivery_day: v })} />
            </div>
            {(() => {
              const selectedProd = products.find((p) => p.product_id === txForm.product_id);
              const locs = selectedProd?.localities?.length
                ? selectedProd.localities
                : (business?.localities || []);
              if (!locs.length) return null;
              return (
                <div className={styles.formGroup}>
                  <span className={styles.groupLabel}>Localidad</span>
                  <Select
                    value={txForm.locality}
                    onChange={(e) => setTxForm({ ...txForm, locality: e })}
                    options={[
                      { value: "", label: "Sin especificar" },
                      ...locs.map(l => ({ value: l, label: l })),
                    ]}
                  />
                </div>
              );
            })()}
          </form>
        )}
      </Modal>

      {/* Modal detalle transacción */}
      <Modal
        open={!!viewTx}
        onClose={() => setViewTx(null)}
        title={viewTx?.tx.product_name}
        footer={<Button variant="secondary" onClick={() => setViewTx(null)}>Cerrar</Button>}
      >
        {viewTx && (() => {
          const { customer, tx } = viewTx;
          const cur = txCurrency(tx);
          return (
            <>
              <div className={styles.stepperWrap}><OrderStepper status={tx.status} /></div>
              <ul className={styles.detailList}>
                <li><span>Cantidad</span><strong>{tx.quantity}</strong></li>
                <li><span>Precio</span><strong>{cur} {formatted(tx.price)}</strong></li>
                {Number(tx.delivery_price) > 0 && (
                  <li><span className={styles.detailIcon}><Bike size={16} aria-hidden="true" /> Envío</span><strong>{cur} {formatted(tx.delivery_price)}</strong></li>
                )}
                {Number(tx.discount_amount) > 0 && (
                  <li><span className={styles.detailIcon}><Gift size={16} aria-hidden="true" /> Descuento</span><strong className={styles.positive}>− {cur} {formatted(tx.discount_amount)}</strong></li>
                )}
                <li><span>Total</span><strong>{cur} {formatted(txTotal(tx))}</strong></li>
                {tx.delivery_day && <li><span>Entrega</span><strong>{tx.delivery_day}</strong></li>}
                {tx.delivery_address && (
                  <li><span>Dirección de entrega</span><strong>{tx.delivery_address}</strong></li>
                )}
                <li><span>Método</span><strong>{tx.payment_method?.payment_type === "bank_transfer" ? "Transferencia" : "Link de pago"}</strong></li>
                <li><span>Estado</span><strong><StatusBadge status={tx.status}>{STATUS_LABEL[tx.status] || tx.status}</StatusBadge></strong></li>
                {tx.status === "Cancelada" && <li><span>Razón</span><strong>{tx.cancellation_reason}</strong></li>}
              </ul>
              <div className={styles.workflow}>
                {tx.receipt_url && <Button variant="secondary" size="sm" icon={FaReceipt} onClick={() => setReceiptUrl(tx.receipt_url)}>Ver recibo</Button>}
                {APPROVABLE(tx.status) && <Button size="sm" icon={FaCheck} loading={approveM.isPending} onClick={() => approveM.mutate({ customerId: customer.customer_id, transactionId: tx.transaction_id })}>Validar pago</Button>}
                {tx.status === "Aprobada" && <Button size="sm" icon={FaTruck} loading={deliverM.isPending} onClick={() => deliverM.mutate({ customerId: customer.customer_id, transactionId: tx.transaction_id })}>Marcar entregada</Button>}
                {APPROVABLE(tx.status) && <Button variant="ghost" size="sm" icon={FaBan} className={styles.dangerText} onClick={() => setCancelTarget({ customer, tx })}>Cancelar orden</Button>}
              </div>
            </>
          );
        })()}
      </Modal>

      {/* Modal cancelar (razón) */}
      <Modal
        open={!!cancelTarget}
        onClose={() => { setCancelTarget(null); setCancelReason(""); }}
        size="sm"
        dismissible={!cancelM.isPending}
        title="Cancelar transacción"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCancelTarget(null); setCancelReason(""); }} disabled={cancelM.isPending}>Volver</Button>
            <Button variant="danger" loading={cancelM.isPending} onClick={() => cancelM.mutate({ customerId: cancelTarget.customer.customer_id, transactionId: cancelTarget.tx.transaction_id, reason: cancelReason || "No especificada" })}>
              {cancelM.isPending ? "Cancelando..." : "Confirmar cancelación"}
            </Button>
          </>
        }
      >
        <label htmlFor="cust-cancel-reason" className={styles.groupLabel}>Razón de la cancelación</label>
        <textarea id="cust-cancel-reason" className={`input ${styles.textarea}`} rows={4} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Ej.: el cliente ya no lo necesita" />
      </Modal>

      {/* Modal recibo */}
      <Modal
        open={!!receiptUrl}
        onClose={() => setReceiptUrl(null)}
        title="Recibo de pago"
        footer={<Button variant="secondary" onClick={() => setReceiptUrl(null)}>Cerrar</Button>}
      >
        {receiptUrl && <img src={receiptUrl} alt="Recibo de pago enviado por el cliente" className={styles.receiptImg} />}
      </Modal>

      {/* Modal fusionar clientes */}
      <Modal
        open={!!(mergeModalOpen && mergeA && mergeB)}
        onClose={closeMergeModal}
        dismissible={!mergeM.isPending}
        title="Fusionar clientes"
        description="Elige qué dato usar de cada cliente. Las transacciones de ambos se combinarán en un solo cliente; el otro registro se eliminará. Esta acción no se puede deshacer."
        footer={
          <>
            <Button variant="secondary" onClick={closeMergeModal} disabled={mergeM.isPending}>Cancelar</Button>
            <Button variant="danger" loading={mergeM.isPending} onClick={() => mergeM.mutate()}>
              {mergeM.isPending ? "Fusionando..." : "Sí, fusionar clientes"}
            </Button>
          </>
        }
      >
        {mergeA && mergeB && (
          <>
            {[
              { key: "name", label: "Nombre", aVal: `${mergeA.given_name} ${mergeA.family_name}`, bVal: `${mergeB.given_name} ${mergeB.family_name}` },
              { key: "email", label: "Correo", aVal: mergeA.email, bVal: mergeB.email },
              { key: "phone", label: "Teléfono", aVal: mergeA.phone, bVal: mergeB.phone },
            ].map((f) => (
              <fieldset key={f.key} className={styles.mergeField}>
                <legend className={styles.groupLabel}>{f.label}</legend>
                <label className={styles.radioRow}>
                  <input type="radio" name={`merge-${f.key}`} checked={mergeChoices[f.key] === "A"}
                    onChange={() => setMergeChoices((p) => ({ ...p, [f.key]: "A" }))} />
                  {f.aVal || <em className={styles.muted}>(vacío)</em>}
                </label>
                <label className={styles.radioRow}>
                  <input type="radio" name={`merge-${f.key}`} checked={mergeChoices[f.key] === "B"}
                    onChange={() => setMergeChoices((p) => ({ ...p, [f.key]: "B" }))} />
                  {f.bVal || <em className={styles.muted}>(vacío)</em>}
                </label>
              </fieldset>
            ))}

            <div className={styles.note}>
              Se moverán <strong>{(mergeB.transactions || []).length}</strong> transacción(es) de{" "}
              <strong>{mergeB.given_name} {mergeB.family_name}</strong> hacia el cliente combinado, y ese registro se eliminará.
              <br />
              Total de órdenes tras la fusión: <strong>{(mergeA.transactions || []).length + (mergeB.transactions || []).length}</strong>.
            </div>
          </>
        )}
      </Modal>

      {/* Modal eliminar cliente */}
      <Modal
        open={!!delCustomer}
        onClose={() => setDelCustomer(null)}
        size="sm"
        dismissible={!delCustomerM.isPending}
        title="Eliminar cliente"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDelCustomer(null)} disabled={delCustomerM.isPending}>Cancelar</Button>
            <Button variant="danger" loading={delCustomerM.isPending} onClick={() => delCustomerM.mutate(delCustomer.customer_id)}>{delCustomerM.isPending ? "Eliminando..." : "Sí, eliminar"}</Button>
          </>
        }
      >
        {delCustomer && <p className={styles.modalText}>¿Eliminar a <strong>{delCustomer.full_name}</strong>? Se borrarán también todas sus transacciones. Esta acción no se puede deshacer.</p>}
      </Modal>

      {/* Modal eliminar transacción */}
      <Modal
        open={!!delTx}
        onClose={() => setDelTx(null)}
        size="sm"
        dismissible={!delTxM.isPending}
        title="Eliminar transacción"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDelTx(null)} disabled={delTxM.isPending}>Cancelar</Button>
            <Button variant="danger" loading={delTxM.isPending} onClick={() => delTxM.mutate({ customerId: delTx.customer.customer_id, transactionId: delTx.tx.transaction_id })}>{delTxM.isPending ? "Eliminando..." : "Sí, eliminar"}</Button>
          </>
        }
      >
        {delTx && <p className={styles.modalText}>¿Eliminar la orden de <strong>{delTx.tx.product_name}</strong>?</p>}
      </Modal>
    </div>
  );
};

export default Customers;
