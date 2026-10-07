import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FaArrowsRotate, FaCheck, FaTruck, FaBan,
  FaEye, FaMagnifyingGlass, FaReceipt,
  FaFileInvoiceDollar, FaDownload, FaEnvelope, FaWhatsapp, FaPen, FaRotateLeft,
} from "react-icons/fa6";
import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import { currencies, formatted } from "../../../helpers/utils";
import {
  fetchCustomers, approveTransaction,
  deliveredTransaction, cancelTransaction, emitInvoice,
  changeOrderPaymentMethod, reactivateTransaction, applyOfferToOrder, changeDeliveryDay,
} from "../../../services/customersApi";
import { fetchPaymentMethods } from "../../../services/paymentMethodsApi";
import { fetchBusinessData } from "../../../services/businessApi";
import { fetchProducts } from "../../../services/productsApi";
import { fetchOffers } from "../../../services/offersApi";
import { isOfferApplicable, calcDiscount, distributeDiscount } from "../../../helpers/offerEngine";
import Select from "../../../components/Select";
import { Bike, Store, CalendarDays, Clock, AlertTriangle, Siren, Pencil, Gift, Receipt, Truck, MapPin, MessageSquare, Ruler, FileText, X, ClipboardList, SearchX } from "lucide-react";
import { PageHeader, StatusBadge, OrderStepper, SkeletonList, EmptyState, Button } from "../../../components/admin";
import DatePicker from "../../../components/DatePicker";
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
  { key: "Pendiente de pago", label: "Pend. pago", bg: "var(--state-pending-bg)", color: "var(--state-pending-fg)" },
  { key: "Pendiente de validación", label: "Por validar", bg: "var(--state-validating-bg)", color: "var(--state-validating-fg)" },
  { key: "Aprobada", label: "Aprobadas", bg: "var(--state-approved-bg)", color: "var(--state-approved-fg)" },
  { key: "Entregada", label: "Entregadas", bg: "var(--state-delivered-bg)", color: "var(--state-delivered-fg)" },
  { key: "Cancelada", label: "Canceladas", bg: "var(--state-cancelled-bg)", color: "var(--state-cancelled-fg)" },
];

const APPROVABLE = (s) => ["Pendiente de pago", "Pendiente de validación"].includes(s);
const CANCELLABLE = (s) => ["Pendiente de pago", "Pendiente de validación", "Aprobada"].includes(s);
const INVOICEABLE = (s) => ["Aprobada", "Entregada"].includes(s);
const DISCOUNTABLE = (s) => ["Pendiente de pago", "Pendiente de validación"].includes(s);
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const sym = (code) => currencies.find(c => c.code === code)?.symbol || code || "";

// ── Helper: limpiar teléfono RD para WhatsApp ─────────────────────────────────
const cleanPhoneRD = (raw) => {
  if (!raw) return "";
  let d = String(raw).replace(/\D/g, "");
  if (d.length === 10 && /^(8[024]9)/.test(d)) d = "1" + d;   // 809/829/849 → 1809...
  return d;
};

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
  if (diff < 0) return { type: "green", label: `En ${Math.abs(diff)} día${Math.abs(diff) !== 1 ? "s" : ""}` };
  if (diff === 0) return { type: "today", label: "Entrega hoy" };
  if (diff <= 2) return { type: "yellow", label: `Retraso ${diff} día${diff !== 1 ? "s" : ""}` };
  return { type: "red", label: `Retraso ${diff} días` };
};

// ── Orden de la lista ("Ordenar por") ──
const ORDER_SORT_KEY = "qatalo:orders:sort";
const ORDER_SORT_OPTIONS = [
  { value: "recent", label: "Más recientes" },
  { value: "delivery", label: "Entrega más próxima" },
];
const readOrderSort = () => {
  try {
    const v = localStorage.getItem(ORDER_SORT_KEY);
    return ORDER_SORT_OPTIONS.some(o => o.value === v) ? v : "recent";
  } catch { return "recent"; }
};
const localTodayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
// Fecha de entrega de la orden = la más temprana de sus ítems (igual que la tarjeta).
const orderDeliveryDay = (o) => o.items.map(t => (t.delivery_day || "").slice(0, 10)).filter(Boolean).sort()[0] || "";
// 1) hoy y futuras, ascendente; 2) vencidas, la más reciente primero; 3) sin fecha (orden original).
const sortByNextDelivery = (list) => {
  const today = localTodayISO();
  const rank = (d) => (!d ? 2 : d >= today ? 0 : 1);
  return list
    .map((o, i) => ({ o, i, d: orderDeliveryDay(o) }))
    .sort((a, b) => {
      const ra = rank(a.d), rb = rank(b.d);
      if (ra !== rb) return ra - rb;
      if (ra === 0) return a.d.localeCompare(b.d) || a.i - b.i;
      if (ra === 1) return b.d.localeCompare(a.d) || a.i - b.i;
      return a.i - b.i;
    })
    .map(x => x.o);
};

// Icono del estado de entrega (sustituye emojis; color en .ds_*)
const DS_ICON = { green: CalendarDays, today: CalendarDays, yellow: AlertTriangle, red: Siren };
const DeliveryIcon = ({ type }) => {
  const Icon = DS_ICON[type] || CalendarDays;
  return <Icon size={13} aria-hidden="true" />;
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

  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: ["customers", tenantId],
    queryFn: fetchCustomers,
    enabled: !!tenantId,
    retry: false,
  });

  const { data: business } = useQuery({
    queryKey: ["business", tenantId],
    queryFn: fetchBusinessData,
    enabled: !!tenantId,
    retry: false,
  });

  // Métodos de pago del negocio (para cambiar el método de una orden)
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["payment-methods", tenantId],
    queryFn: fetchPaymentMethods,
    enabled: !!tenantId,
    retry: false,
  });

  // Productos (para mapear product_id -> category_id, necesario en ofertas por categoría)
  const { data: products = [] } = useQuery({
    queryKey: ["products", tenantId],
    queryFn: fetchProducts,
    enabled: !!tenantId,
    retry: false,
  });
  const catMap = useMemo(
    () => Object.fromEntries((products || []).map(p => [p.product_id, p.category_id || ""])),
    [products]
  );

  // Ofertas del negocio (para validar el código ingresado)
  const { data: offers = [] } = useQuery({
    queryKey: ["offers", tenantId],
    queryFn: fetchOffers,
    enabled: !!tenantId,
    retry: false,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState(readOrderSort);
  const [viewOrder, setViewOrder] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [discountCode, setDiscountCode] = useState("");
  const [discountErr, setDiscountErr] = useState("");
  const [editingPm, setEditingPm] = useState(false);   // ← modo edición del método de pago
  const [editDelivDay, setEditDelivDay] = useState({ txId: null, value: "" }); // ← edición fecha entrega

  const [invoiceTarget, setInvoiceTarget] = useState(null);
  const [invoiceType, setInvoiceType] = useState("recibo");
  const [ncfManual, setNcfManual] = useState("");

  const ncfEnabled = !!business?.ncf_enabled;
  const ncfPool = business?.ncf_pool || [];
  const ncfAvailable = ncfPool.filter(n => !n.used).length;
  const businessName = business?.business_name || business?.name || "nuestro negocio";

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

  // Orden en cliente sobre lo ya cargado ("recent" = orden original de buildOrders)
  const sorted = useMemo(() => (sortBy === "delivery" ? sortByNextDelivery(filtered) : filtered), [filtered, sortBy]);
  const changeSort = (v) => {
    setSortBy(v);
    try { localStorage.setItem(ORDER_SORT_KEY, v); } catch { /* almacenamiento no disponible */ }
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: ["customers", tenantId] });

  // ── Enviar link de pago por WhatsApp ──
  const sendPaymentLinkWA = (order) => {
    const { customer, items } = order;
    const phone = cleanPhoneRD(customer.phone);
    if (!phone) {
      showError("Sin teléfono", "Este cliente no tiene un número de teléfono válido registrado.");
      return;
    }
    const total = orderTotal(items);
    const cur = sym(items[0]?.currency || items[0]?.payment_method?.currency || "");
    const nombre = customer.given_name || customer.full_name || "";
    const orderRef = String(order.order_id).slice(0, 8).toUpperCase();
    const msg =
      `¡Hola ${nombre}! 👋 Gracias por tu pedido en ${businessName} (#${orderRef}).\n\n` +
      `El total es ${cur} ${formatted(total)}. Aquí tienes tu link de pago:\n\n` +
      `[PEGA AQUÍ TU LINK DE PAGO]\n\n` +
      `Cuando completes el pago, avísame para confirmar tu pedido. ¡Gracias! 🛍️`;
    const url = `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener");
  };

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

  // Cambiar método de pago de la orden (todas las transacciones del grupo)
  const changePmM = useMutation({
    mutationFn: ({ customerId, transactionId, paymentMethodId }) =>
      changeOrderPaymentMethod(customerId, transactionId, paymentMethodId),
    onSuccess: (res) => {
      showSuccess("Actualizado", "Método de pago cambiado");
      // Refleja el cambio en el modal abierto sin cerrar
      setViewOrder(prev => {
        if (!prev) return prev;
        const newPm = res?.payment_method || {};
        return {
          ...prev,
          items: prev.items.map(it => ({ ...it, payment_method: newPm })),
        };
      });
      setEditingPm(false);
      invalidate();
    },
    onError: (e) => showError("Error", e.message),
  });

  // Reactivar orden cancelada (vuelve a su estado previo)
  const reactivateM = useMutation({
    mutationFn: ({ customerId, transactionId }) => reactivateTransaction(customerId, transactionId),
    onSuccess: () => {
      showSuccess("Reactivada", "La orden volvió a su estado anterior");
      invalidate();
      setViewOrder(null);
    },
    onError: (e) => {
      // Mensaje claro si falla por stock
      const body = e?.response?.data || {};
      if (body.error === "stock_insuficiente") {
        showError("Sin stock", body.message || "No hay stock suficiente para reactivar.");
      } else {
        showError("Error", e.message);
      }
    },
  });

  // Cambiar fecha de entrega de un ítem
  const changeDayM = useMutation({
    mutationFn: ({ customerId, txId, day }) => changeDeliveryDay(customerId, txId, day),
    onSuccess: () => { showSuccess("Guardado", "Fecha de entrega actualizada"); invalidate(); setEditDelivDay({ txId: null, value: "" }); },
    onError: (e) => showError("Error", e.message),
  });

  // ── Aplicar / quitar descuento a una orden creada ──
  const applyM = useMutation({
    mutationFn: ({ customerId, transactionId, payload }) =>
      applyOfferToOrder(customerId, transactionId, payload),
    onSuccess: (_res, vars) => {
      showSuccess(vars.offerId ? "Descuento aplicado" : "Descuento removido",
        vars.offerId ? "El total de la orden fue actualizado." : "Se restauró el precio original.");
      // Refleja el cambio en el modal abierto (sin cerrar)
      const map = Object.fromEntries((vars.distributed || []).map(x => [x.transaction_id, x]));
      setViewOrder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(t => {
            const u = map[t.transaction_id];
            return u ? {
              ...t,
              price: u.price,
              original_price: u.original_price,
              discount_amount: u.discount_amount,
              offer_id: vars.offerId,
              offer_name: vars.offerName,
              offer_code: vars.offerCode,
            } : t;
          }),
        };
      });
      setDiscountCode("");
      setDiscountErr("");
      invalidate();
    },
    onError: (e) => showError("Error", e.message),
  });

  // Precio base de un item (sin descuento previo)
  const basePrice = (t) => Number(t.original_price) > 0 ? Number(t.original_price) : Number(t.price);

  const handleApplyDiscount = (order) => {
    setDiscountErr("");
    const code = discountCode.trim().toUpperCase();
    if (!code) return setDiscountErr("Escribe un código.");
    const offer = (offers || []).find(
      o => o.trigger === "code" && (o.code || "").toUpperCase() === code
    );
    if (!offer) return setDiscountErr("Código no válido o inexistente.");

    const { items, customer } = order;
    const engineItems = items.map(t => ({
      transaction_id: t.transaction_id,
      product_id: t.product_id,
      category_id: catMap[t.product_id] || "",
      price: basePrice(t),
      quantity: Number(t.quantity) || 1,
    }));
    const baseSubtotal = engineItems.reduce((sum, it) => sum + it.price * it.quantity, 0);

    if (!isOfferApplicable(offer, engineItems, baseSubtotal))
      return setDiscountErr("El código no aplica a esta orden (pedido mínimo o productos).");
    const d = calcDiscount(offer, engineItems);
    if (d <= 0) return setDiscountErr("El código no genera descuento en esta orden.");

    const distributed = distributeDiscount(offer, engineItems, d).map(x => ({
      transaction_id: x.transaction_id,
      price: x.price,
      original_price: x.original_price,
      discount_amount: x.discount_amount,
    }));

    applyM.mutate({
      customerId: customer.customer_id,
      transactionId: items[0].transaction_id,
      payload: { offer_id: offer.offer_id, offer_name: offer.name, offer_code: offer.code || "", items: distributed },
      distributed, offerId: offer.offer_id, offerName: offer.name, offerCode: offer.code || "",
    });
  };

  const handleRemoveDiscount = (order) => {
    const { items, customer } = order;
    const distributed = items.map(t => {
      const base = basePrice(t);
      return { transaction_id: t.transaction_id, price: base, original_price: base, discount_amount: 0 };
    });
    applyM.mutate({
      customerId: customer.customer_id,
      transactionId: items[0].transaction_id,
      payload: { offer_id: "", offer_name: "", offer_code: "", items: distributed },
      distributed, offerId: "", offerName: "", offerCode: "",
    });
  };

  const invoiceM = useMutation({
    mutationFn: (payload) => emitInvoice(payload),
    onSuccess: (res, vars) => {
      if (vars.action === "download" && res?.url) {
        window.open(res.url, "_blank", "noopener");
        showSuccess("Comprobante generado", "Se abrió el PDF en una pestaña nueva.");
      } else if (vars.action === "email") {
        showSuccess("Enviado", res?.message || "Comprobante enviado al correo del cliente.");
      }
      invalidate();
      closeInvoice();
    },
    onError: (e) => showError("Error", e.message),
  });

  const openInvoice = (order) => {
    setViewOrder(null);
    setInvoiceTarget(order);
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

  // Esc cierra el modal abierto (el de más arriba primero)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (receiptUrl) setReceiptUrl(null);
      else if (cancelTarget) { setCancelTarget(null); setCancelReason(""); }
      else if (invoiceTarget) closeInvoice();
      else if (viewOrder) { setViewOrder(null); setEditingPm(false); setEditDelivDay({ txId: null, value: "" }); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Órdenes" description="Vista operativa de todos los pedidos" />
        <SkeletonList rows={6} label="Cargando órdenes..." media={false} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Órdenes" description="Vista operativa de todos los pedidos" />

      {/* ── Barra de estado ── */}
      <div className={styles.statusBar}>
        {STATUS_BAR.map(s => (
          <button
            key={s.key}
            className={`${styles.statusChip} ${statusFilter === s.key ? styles.statusChipActive : ""}`}
            style={statusFilter === s.key ? { background: s.bg, color: s.color, borderColor: s.color } : {}}
            onClick={() => setStatusFilter(prev => prev === s.key ? "all" : s.key)}
            aria-pressed={statusFilter === s.key}
          >
            <span className={styles.chipCount} style={{ color: s.color }}>
              {statusCounts[s.key] || 0}
            </span>
            {s.label}
          </button>
        ))}
        <button className={styles.refreshBtn} onClick={() => refetch()}>
          <FaArrowsRotate aria-hidden="true" /> Actualizar
        </button>
      </div>

      {/* ── Buscador ── */}
      <div className={styles.searchBar}>
        <FaMagnifyingGlass aria-hidden="true" />
        <input
          className={styles.searchInput}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por cliente o producto..."
          aria-label="Buscar órdenes por cliente o producto"
          type="search"
        />
        {search && <button className={styles.searchClear} onClick={() => setSearch("")} aria-label="Limpiar búsqueda"><X size={16} aria-hidden="true" /></button>}
      </div>

      {/* ── Ordenar por ── */}
      <div className={styles.sortBar} role="radiogroup" aria-label="Ordenar órdenes por">
        <span className={styles.sortLabel} aria-hidden="true">Ordenar por</span>
        {ORDER_SORT_OPTIONS.map(o => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={sortBy === o.value}
            tabIndex={sortBy === o.value ? 0 : -1}
            className={`${styles.sortChip} ${sortBy === o.value ? styles.sortChipActive : ""}`}
            onClick={() => changeSort(o.value)}
            onKeyDown={(e) => {
              if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
              e.preventDefault();
              const i = ORDER_SORT_OPTIONS.findIndex(x => x.value === sortBy);
              const step = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
              const next = ORDER_SORT_OPTIONS[(i + step + ORDER_SORT_OPTIONS.length) % ORDER_SORT_OPTIONS.length];
              changeSort(next.value);
              e.currentTarget.parentElement.querySelector(`[data-sort="${next.value}"]`)?.focus();
            }}
            data-sort={o.value}
          >
            {o.value === "delivery" ? <CalendarDays size={14} aria-hidden="true" /> : <Clock size={14} aria-hidden="true" />}
            {o.label}
          </button>
        ))}
      </div>

      {/* ── Lista ── */}
      {filtered.length === 0 ? (
        orders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Aún no hay órdenes"
            description="Cuando un cliente haga un pedido desde tu catálogo, aparecerá aquí."
            action={<Button variant="secondary" icon={FaArrowsRotate} onClick={() => refetch()}>Actualizar</Button>}
          />
        ) : (
          <EmptyState
            icon={SearchX}
            title="No hay órdenes que coincidan"
            description="Prueba con otro nombre o quita el filtro de estado."
            action={<Button variant="secondary" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Quitar filtros</Button>}
          />
        )
      ) : (
        <div className={styles.orderList}>
          {sorted.map(order => {
            const { customer, items, create_date, order_id } = order;
            const firstTx = items[0];
            const status = firstTx?.status || "";
            const cur = sym(firstTx?.currency || firstTx?.payment_method?.currency || "");
            const total = orderTotal(items);
            const delivDay = items.map(t => t.delivery_day).filter(Boolean).sort()[0] || null;
            const ds = deliveryStatus(delivDay, status);
            const hasDelivery = items.some(t => t.fulfillment_type === "delivery");
            const hasTakeout = items.some(t => t.fulfillment_type === "takeout");
            const locality = items.find(t => t.locality)?.locality || "";
            const names = [...new Set(items.map(t => t.product_name).filter(Boolean))];
            const preview = names.slice(0, 2).join(", ") +
              (names.length > 2 ? ` y ${names.length - 2} más` : "");
            const isPayLinkPending =
              firstTx?.payment_method?.payment_type === "payment_link" &&
              status === "Pendiente de pago";

            return (
              <div key={order_id} className={`${styles.orderCard} ${status === "Cancelada" ? styles.dimmed : ""}`}>
                <div className={styles.orderMain}>
                  <div className={styles.colLeft}>
                    <span className={styles.orderDate}>{formatDate(create_date)}</span>
                    <span className={styles.orderCustomer}>
                      {customer.full_name || `${customer.given_name} ${customer.family_name}`}
                    </span>
                    <span className={styles.orderEmail}>{customer.email}</span>
                  </div>

                  <div className={styles.colCenter}>
                    <span className={styles.orderProducts}>{preview || "—"}</span>
                    {(hasDelivery || hasTakeout || locality) && (
                      <span className={styles.orderFulfillment}>
                        {hasDelivery ? <><Bike size={14} aria-hidden="true" /> Delivery</> : hasTakeout ? <><Store size={14} aria-hidden="true" /> Take out</> : ""}
                        {locality ? ` · ${locality}` : ""}
                      </span>
                    )}
                  </div>

                  <div className={styles.colRight}>
                    <span className={styles.orderTotal}>{cur} {formatted(total)}</span>
                    <StatusBadge status={status}>{STATUS_LABEL[status] || status}</StatusBadge>
                    {ds && (
                      <span className={`${styles.delivPill} ${styles[`ds_${ds.type}`]}`}>
                        <DeliveryIcon type={ds.type} />{ds.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.orderActions}>
                  <button className={styles.actBtn} onClick={() => setViewOrder(order)}>
                    <FaEye /> Ver
                  </button>
                  {isPayLinkPending && (
                    <button
                      className={`${styles.actBtn} ${styles.actWhats}`}
                      onClick={() => sendPaymentLinkWA(order)}
                      title="Enviar link de pago por WhatsApp"
                    >
                      <FaWhatsapp /> Enviar link
                    </button>
                  )}
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
                  {status === "Cancelada" && (
                    <button
                      className={`${styles.actBtn} ${styles.actReactivate}`}
                      disabled={reactivateM.isPending}
                      onClick={() => reactivateM.mutate({ customerId: customer.customer_id, transactionId: firstTx.transaction_id })}
                    >
                      <FaRotateLeft /> Reactivar
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
        const cur = sym(firstTx?.currency || firstTx?.payment_method?.currency || "");
        const subtotal = items.reduce((s, t) => s + (Number(t.price) || 0) * (Number(t.quantity) || 1), 0);
        const deliveryAmt = items.reduce((s, t) => s + (Number(t.delivery_price) || 0), 0);
        const discountAmt = items.reduce((s, t) => s + (Number(t.discount_amount) || 0), 0);
        const total = subtotal + deliveryAmt - discountAmt;
        const existingNcf = items.find(t => t.ncf_used)?.ncf_used || "";
        const isPayLinkPending =
          firstTx?.payment_method?.payment_type === "payment_link" &&
          status === "Pendiente de pago";

        return (
          <div className={styles.overlay} onClick={() => { setViewOrder(null); setEditingPm(false); setEditDelivDay({ txId: null, value: "" }); }}>
            <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
              <h3 id="order-detail-title">Detalle de orden</h3>
              <div className={styles.stepperWrap}><OrderStepper status={status} /></div>

              <div className={styles.section}>
                <div className={styles.sectionTitle}>Cliente</div>
                <div className={styles.row}>
                  <span className={styles.bold}>{customer.full_name || `${customer.given_name} ${customer.family_name}`}</span>
                  <span className={styles.muted}>{customer.email}</span>
                </div>
                {customer.phone && <div className={styles.muted} style={{ marginTop: ".2rem" }}>{customer.phone}</div>}
              </div>

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
                            {t.fulfillment_type === "delivery" ? <Bike size={14} aria-label="Delivery" /> : <Store size={14} aria-label="Take out" />}
                          </span>
                        )}
                      </div>
                      {editDelivDay.txId === t.transaction_id ? (
                        <div className={styles.itemSub} style={{ display: "flex", alignItems: "center", gap: ".4rem", flexWrap: "wrap" }}>
                          <DatePicker
                            value={editDelivDay.value}
                            onChange={(v) => setEditDelivDay(prev => ({ ...prev, value: v }))}
                            aria-label="Nueva fecha de entrega"
                            clearable={false}
                            wrapperClassName={styles.delivDayPicker}
                          />
                          <button
                            className={styles.linkLikeBtn}
                            disabled={changeDayM.isPending || !editDelivDay.value}
                            onClick={() => changeDayM.mutate({ customerId: customer.customer_id, txId: t.transaction_id, day: editDelivDay.value })}
                            style={{ color: "var(--color-success-fg)" }}
                          >
                            {changeDayM.isPending ? "Guardando…" : "Guardar"}
                          </button>
                          <button className={styles.linkLikeBtn} onClick={() => setEditDelivDay({ txId: null, value: "" })}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className={styles.itemSub} style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
                          {t.delivery_day ? (
                            <>
                              Entrega: {t.delivery_day}
                              {itemDs && (
                                <span className={`${styles.delivPill} ${styles[`ds_${itemDs.type}`]}`}>
                                  <DeliveryIcon type={itemDs.type} />{itemDs.label}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className={styles.muted}>Sin fecha de entrega</span>
                          )}
                          {["Pendiente de pago", "Pendiente de validación", "Aprobada"].includes(status) && (
                            <button
                              title="Cambiar fecha de entrega"
                              className={styles.linkLikeBtn}
                              aria-label="Cambiar fecha de entrega"
                              style={{ fontSize: ".75rem", padding: "0 4px", color: "var(--color-ink-soft)" }}
                              onClick={() => setEditDelivDay({ txId: t.transaction_id, value: t.delivery_day || "" })}
                            >
                              <Pencil size={14} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      )}
                      {!t.delivery_day && Number(t.delivery_days_after_payment || 0) > 0 && (
                        <div className={styles.itemSub}>
                          <Truck size={14} aria-hidden="true" /> Entrega en {t.delivery_days_after_payment} día{Number(t.delivery_days_after_payment) !== 1 ? "s" : ""} tras confirmar el pago
                          {status !== "Aprobada" && status !== "Entregada" && (
                            <span style={{ marginLeft: ".4rem", color: "var(--color-ink-soft)" }}>(se calcula al aprobar)</span>
                          )}
                        </div>
                      )}
                      {t.delivery_address && (
                        <div className={styles.itemSub}><MapPin size={14} aria-hidden="true" /> {t.delivery_address}</div>
                      )}
                      {t.comment && (
                        <div className={styles.itemSub}><MessageSquare size={14} aria-hidden="true" /> {t.comment}</div>
                      )}
                      {(t.customization || []).length > 0 && (
                        <div className={styles.itemSub}>
                          <Ruler size={14} aria-hidden="true" /> {t.customization.map((c) => `${c.label}: ${c.value}${c.type === "measurement" ? (c.unit || "") : ""}`).join(" · ")}
                        </div>
                      )}
                      {(t.discount_amount > 0) && (
                        <div className={styles.itemDiscount}>
                          <Gift size={14} aria-hidden="true" /> {t.offer_name ? `${t.offer_name} ·` : ""} −{cur} {formatted(t.discount_amount)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={styles.section}>
                <div className={styles.sectionTitle}>Totales</div>
                <div className={styles.row}><span>Subtotal</span><strong>{cur} {formatted(subtotal)}</strong></div>
                {deliveryAmt > 0 && <div className={styles.row}><span className={styles.iconLabel}><Bike size={14} aria-hidden="true" /> Delivery</span><strong>{cur} {formatted(deliveryAmt)}</strong></div>}
                {discountAmt > 0 && <div className={styles.row} style={{ color: "var(--color-success-fg)" }}><span className={styles.iconLabel}><Gift size={14} aria-hidden="true" /> Descuento</span><strong>− {cur} {formatted(discountAmt)}</strong></div>}
                <div className={styles.row} style={{ fontWeight: 800, borderTop: "1px solid var(--color-line-strong)", paddingTop: ".5rem", marginTop: ".25rem" }}>
                  <span>Total</span><strong>{cur} {formatted(total)}</strong>
                </div>
              </div>

              {/* ── Descuento (solo en pendientes) ── */}
              {DISCOUNTABLE(status) && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Descuento</div>
                  {discountAmt > 0 ? (
                    <>
                      <div className={styles.row} style={{ color: "var(--color-success-fg)" }}>
                        <span className={styles.iconLabel}><Gift size={14} aria-hidden="true" /> {firstTx?.offer_name || "Descuento aplicado"}{firstTx?.offer_code ? ` (${firstTx.offer_code})` : ""}</span>
                        <strong>− {cur} {formatted(discountAmt)}</strong>
                      </div>
                      <button
                        className={styles.linkLikeBtn}
                        style={{ color: "var(--color-danger)", marginTop: ".4rem" }}
                        disabled={applyM.isPending}
                        onClick={() => handleRemoveDiscount(viewOrder)}
                      >
                        {applyM.isPending ? "Quitando…" : "Quitar descuento"}
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ display: "flex", gap: ".5rem", alignItems: "stretch" }}>
                        <input
                          className="input"
                          style={{ flex: 1 }}
                          value={discountCode}
                          onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscountErr(""); }}
                          onKeyDown={e => e.key === "Enter" && handleApplyDiscount(viewOrder)}
                          placeholder="Código de descuento"
                          aria-label="Código de descuento"
                        />
                        <button
                          className={styles.btnApprove}
                          disabled={applyM.isPending}
                          onClick={() => handleApplyDiscount(viewOrder)}
                        >
                          {applyM.isPending ? "Aplicando…" : "Aplicar"}
                        </button>
                      </div>
                      {discountErr && (
                        <div role="alert" style={{ color: "var(--color-danger)", fontSize: ".82rem", marginTop: ".4rem" }}>{discountErr}</div>
                      )}
                      {status === "Pendiente de validación" && (
                        <div className={styles.iconLabel} style={{ color: "var(--state-pending-fg)", fontSize: ".8rem", marginTop: ".4rem", lineHeight: 1.4, alignItems: "flex-start" }}>
                          <AlertTriangle size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} /> El cliente ya subió comprobante por el monto anterior. Si aplicas un descuento, avísale del nuevo total.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className={styles.section}>
                <div className={styles.sectionTitle}>Pago</div>
                <div className={styles.row}>
                  {editingPm && status !== "Entregada" && status !== "Cancelada" ? (
                    <div style={{ width: "100%" }}>
                      <Select
                        value={firstTx?.payment_method?.payment_method_id || ""}
                        onChange={(pmId) => changePmM.mutate({
                          customerId: customer.customer_id,
                          transactionId: firstTx.transaction_id,
                          paymentMethodId: pmId,
                        })}
                        options={paymentMethods.map(pm => ({
                          value: pm.payment_method_id,
                          label: pm.payment_method_name,
                        }))}
                        placeholder="Seleccionar método"
                        searchable={false}
                      />
                      <div style={{ display: "flex", gap: ".5rem", marginTop: ".5rem", alignItems: "center" }}>
                        {changePmM.isPending && <span className={styles.muted}>Guardando…</span>}
                        <button className={styles.linkLikeBtn} onClick={() => setEditingPm(false)}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: ".5rem" }}>
                        {firstTx?.payment_method?.payment_type === "bank_transfer"
                          ? "Transferencia bancaria"
                          : firstTx?.payment_method?.payment_method_name || "Link de pago"}
                        {status !== "Entregada" && status !== "Cancelada" && (
                          <button
                            className={styles.editPmBtn}
                            onClick={() => setEditingPm(true)}
                            title="Cambiar método de pago"
                          >
                            <FaPen size={11} /> Cambiar
                          </button>
                        )}
                      </span>
                      <StatusBadge status={status}>{STATUS_LABEL[status] || status}</StatusBadge>
                    </>
                  )}
                </div>
                {existingNcf && (
                  <div className={styles.iconLabel} style={{ fontSize: ".82rem", color: "var(--state-approved-fg)", marginTop: ".4rem", fontWeight: 600 }}>
                    <Receipt size={14} aria-hidden="true" /> Facturada con NCF: <span style={{ fontFamily: "monospace" }}>{existingNcf}</span>
                  </div>
                )}
                {status === "Cancelada" && firstTx?.cancellation_reason && (
                  <div style={{ fontSize: ".82rem", color: "var(--color-danger)", marginTop: ".3rem" }}>
                    Razón: {firstTx.cancellation_reason}
                  </div>
                )}
              </div>

              {isPayLinkPending && (
                <div className={styles.payLinkAdminNote}>
                  <MessageSquare size={14} aria-hidden="true" /> Esta orden espera que le envíes el <strong>link de pago</strong> al cliente por el total exacto.
                  Usa el botón de WhatsApp y pega tu link en el mensaje.
                </div>
              )}

              {firstTx?.receipt_url && (
                <button className={styles.receiptBtn} onClick={() => setReceiptUrl(firstTx.receipt_url)}>
                  <FaReceipt /> Ver comprobante
                </button>
              )}

              <div className={styles.modalActions}>
                <button className={styles.btnOutline} onClick={() => { setViewOrder(null); setEditingPm(false); setEditDelivDay({ txId: null, value: "" }); }}>Cerrar</button>
                {isPayLinkPending && (
                  <button className={styles.btnWhats} onClick={() => sendPaymentLinkWA(viewOrder)}>
                    <FaWhatsapp /> Enviar link por WhatsApp
                  </button>
                )}
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
                {status === "Cancelada" && (
                  <button className={styles.btnReactivate} disabled={reactivateM.isPending}
                    onClick={() => reactivateM.mutate({ customerId: customer.customer_id, transactionId: firstTx.transaction_id })}>
                    <FaRotateLeft /> {reactivateM.isPending ? "Reactivando..." : "Reactivar orden"}
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
        const noNcfLeft = isFactura && !existingNcf && !ncfManual.trim() && ncfAvailable === 0;
        const busy = invoiceM.isPending;

        return (
          <div className={styles.overlay} onClick={closeInvoice}>
            <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="order-invoice-title">
              <h3 id="order-invoice-title">Emitir comprobante</h3>
              <p style={{ color: "var(--color-ink)", marginBottom: "1rem", fontSize: ".9rem" }}>
                Orden <strong style={{ fontFamily: "monospace" }}>#{String(invoiceTarget.order_id).slice(0, 8).toUpperCase()}</strong>
                {" · "}{customer.full_name || `${customer.given_name} ${customer.family_name}`}
              </p>

              {existingNcf && (
                <div className={styles.invoiceNotice}>
                  <Receipt size={14} aria-hidden="true" /> Esta orden ya fue facturada con NCF <strong>{existingNcf}</strong>. Se reutilizará el mismo (no consume otro).
                </div>
              )}

              <div className={styles.invoiceOptions}>
                <label className={`${styles.invoiceOption} ${!isFactura ? styles.invoiceOptionActive : ""}`}>
                  <input type="radio" name="invtype" checked={!isFactura}
                    onChange={() => setInvoiceType("recibo")} disabled={!!existingNcf} />
                  <div>
                    <div className={styles.invoiceOptTitle}><FileText size={16} aria-hidden="true" /> Recibo de pago</div>
                    <div className={styles.invoiceOptDesc}>Comprobante simple sin valor fiscal.</div>
                  </div>
                </label>

                <label className={`${styles.invoiceOption} ${isFactura ? styles.invoiceOptionActive : ""} ${!ncfEnabled ? styles.invoiceOptionDisabled : ""}`}>
                  <input type="radio" name="invtype" checked={isFactura}
                    onChange={() => setInvoiceType("factura")} disabled={!ncfEnabled} />
                  <div>
                    <div className={styles.invoiceOptTitle}><Receipt size={16} aria-hidden="true" /> Factura con NCF</div>
                    <div className={styles.invoiceOptDesc}>
                      {ncfEnabled
                        ? `Comprobante fiscal. Disponibles: ${ncfAvailable}.`
                        : "Activa los NCF en Configuración → Facturación."}
                    </div>
                  </div>
                </label>
              </div>

              {isFactura && !existingNcf && (
                <div className={styles.formGroup} style={{ marginBottom: "1rem" }}>
                  <label htmlFor="order-ncf-manual" style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--color-ink-strong)" }}>
                    NCF manual (opcional)
                  </label>
                  <input
                    id="order-ncf-manual"
                    className="input"
                    value={ncfManual}
                    onChange={e => setNcfManual(e.target.value.toUpperCase())}
                    placeholder="Dejar vacío para tomar el siguiente disponible"
                  />
                </div>
              )}

              {noNcfLeft && (
                <div className={styles.invoiceWarning}>
                  <AlertTriangle size={14} aria-hidden="true" /> No tienes NCF disponibles. Carga más en Configuración → Facturación o escribe uno manual.
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
                <p style={{ fontSize: ".78rem", color: "var(--color-danger)", marginTop: ".5rem", textAlign: "right" }}>
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
          <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="order-cancel-title">
            <h3 id="order-cancel-title">Cancelar orden</h3>
            <p style={{ color: "var(--color-ink)", marginBottom: "1rem" }}>
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
              aria-label="Razón de la cancelación (opcional)"
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
          <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="order-receipt-title">
            <h3 id="order-receipt-title">Comprobante de pago</h3>
            <img src={receiptUrl} alt="Comprobante de pago enviado por el cliente" style={{ width: "100%", borderRadius: "8px", marginBottom: "1rem" }} />
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