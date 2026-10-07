import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Pause, Play, RefreshCw, Tag, Zap, ShoppingBag, Package, FolderOpen, Gift, ArrowUp, ArrowDown, Minus, Receipt, Layers } from "lucide-react";

import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import { formatted } from "../../../helpers/utils";
import { fetchProducts } from "../../../services/productsApi";
import { fetchCategories } from "../../../services/categoryApi";
import { fetchOffers, createOffer, updateOffer, deleteOffer } from "../../../services/offersApi";
import { PageHeader, Button, IconButton, Modal, EmptyState, SkeletonForm, SkeletonList } from "../../../components/admin";
import styles from "./Offers.module.css";
import Select from "../../../components/Select";
import DatePicker, { toISODate } from "../../../components/DatePicker";

const emptyForm = {
  offer_id: "", name: "", description: "", is_active: true,
  trigger: "code", code: "",
  discount_type: "percentage", discount_value: "", fixed_mode: "order",
  applies_to: "all", product_ids: [], category_ids: [],
  has_min_order: false, min_order_amount: "",
  has_min_qty: false, min_quantity: "",
  unlimited_uses: true, max_uses: "",
  no_expiry: true, valid_from: "", valid_until: "",
  buy_quantity: "", paid_quantity: "",
  priority: "media",
};

// Etiqueta legible de prioridad
const PRIORITY_LABEL = { alta: "Alta", media: "Media", baja: "Baja" };
// Tono visual de prioridad (clases en Offers.module.css con tokens)
const PRIORITY_TONE = { alta: "toneDanger", media: "toneWarning", baja: "toneInfo" };

const Toggle = ({ checked, onChange, label }) => (
  <label className={styles.toggle}>
    <input className={styles.srOnly} type="checkbox" role="switch" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
    <span className={styles.track}><span className={styles.thumb} /></span>
    {label && <span className={styles.toggleLabel}>{label}</span>}
  </label>
);

const offerStatus = (o) => {
  const today = toISODate(new Date()); // fecha LOCAL (toISOString es UTC: tras las 8 p. m. en RD daba mañana)
  if (!o.is_active) return "inactive";
  if (o.valid_until && o.valid_until < today) return "expired";
  if (o.max_uses !== null && o.uses_count >= o.max_uses) return "exhausted";
  if (o.valid_from && o.valid_from > today) return "scheduled";
  return "active";
};
const STATUS_LABEL = { active: "Activa", inactive: "Pausada", expired: "Vencida", exhausted: "Agotada", scheduled: "Programada" };
// Tono visual de estado (clases en Offers.module.css con tokens --state-*)
const STATUS_TONE = {
  active: "toneApproved", inactive: "toneNeutral", expired: "toneCancelled",
  exhausted: "tonePending", scheduled: "toneValidating",
};

const TRIGGER_OPTIONS = [["code", "Código de descuento", Tag], ["automatic", "Automática", Zap]];
const SCOPE_OPTIONS = [["all", "Todos los productos", ShoppingBag], ["products", "Productos específicos", Package], ["categories", "Categorías", FolderOpen]];
// Modo del monto fijo: una vez al total o por cada unidad elegible
const FIXED_MODE_OPTIONS = [["order", "Una vez al total", Receipt], ["per_unit", "Por cada unidad", Layers]];
const PRIORITY_OPTIONS = [["alta", "Alta", ArrowUp], ["media", "Media", Minus], ["baja", "Baja", ArrowDown]];

// Tarjeta de opción (radio accesible con icono)
const OptionCard = ({ name, value, current, onSelect, label, icon }) => {
  const Icon = icon;
  return (
    <label className={`${styles.optionCard} ${current === value ? styles.optionActive : ""}`}>
      <input className={styles.srOnly} type="radio" name={name} value={value} checked={current === value} onChange={() => onSelect(value)} />
      <Icon size={16} aria-hidden="true" />
      {label}
    </label>
  );
};

const Offers = () => {
  const auth = getTokenInfo();
  const tenantId = auth?.sub;
  const { showError, showWarning, showSuccess } = useNotification();
  const qc = useQueryClient();

  const { data: offers = [], isLoading, refetch } = useQuery({ queryKey: ["offers", tenantId], queryFn: fetchOffers, enabled: !!tenantId, retry: false });
  const { data: products = [] } = useQuery({ queryKey: ["products", tenantId], queryFn: fetchProducts, enabled: !!tenantId, retry: false });
  const { data: categories = [] } = useQuery({ queryKey: ["categories", tenantId], queryFn: fetchCategories, enabled: !!tenantId, retry: false });

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState("all");
  const [toDelete, setToDelete] = useState(null);

  const editingId = form.offer_id;
  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const resetForm = () => { setForm(emptyForm); setErrors({}); };

  const toggleId = (field, id) =>
    setForm(p => { const ids = p[field] || []; return { ...p, [field]: ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id] }; });

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = "El nombre es requerido";
    if (form.trigger === "code" && !form.code.trim()) err.code = "El código es requerido";

    if (form.discount_type === "buy_x_get_y") {
      if (!form.buy_quantity || Number(form.buy_quantity) < 2)
        err.discount_value = "La cantidad a comprar debe ser al menos 2";
      else if (!form.paid_quantity || Number(form.paid_quantity) < 1)
        err.discount_value = "La cantidad a pagar debe ser al menos 1";
      else if (Number(form.paid_quantity) >= Number(form.buy_quantity))
        err.discount_value = "La cantidad a pagar debe ser menor que la de comprar";
    } else {
      if (!form.discount_value || Number(form.discount_value) <= 0)
        err.discount_value = "El descuento debe ser mayor a 0";
      if (form.discount_type === "percentage" && Number(form.discount_value) > 100)
        err.discount_value = "El porcentaje no puede superar 100";
    }

    if (form.has_min_qty && (!Number.isInteger(Number(form.min_quantity)) || Number(form.min_quantity) < 1))
      err.min_quantity = "La cantidad mínima debe ser un número entero mayor a 0";

    if (form.applies_to === "products" && !form.product_ids?.length) err.applies = "Selecciona al menos un producto";
    if (form.applies_to === "categories" && !form.category_ids?.length) err.applies = "Selecciona al menos una categoría";
    return err;
  };

  const buildPayload = () => ({
    ...form,
    code: form.trigger === "code" ? form.code.trim().toUpperCase() : "",
    discount_value: Number(form.discount_value) || 0,
    fixed_mode: form.discount_type === "fixed" && form.fixed_mode === "per_unit" ? "per_unit" : "order",
    min_order_amount: form.has_min_order ? Number(form.min_order_amount) || 0 : 0,
    min_quantity: form.has_min_qty ? Math.floor(Number(form.min_quantity)) || 0 : 0,
    max_uses: !form.unlimited_uses && form.max_uses ? Number(form.max_uses) : null,
    valid_from: form.no_expiry ? "" : (form.valid_from || ""),
    valid_until: form.no_expiry ? "" : (form.valid_until || ""),
    buy_quantity: form.discount_type === "buy_x_get_y" ? Number(form.buy_quantity) || 0 : 0,
    paid_quantity: form.discount_type === "buy_x_get_y" ? Number(form.paid_quantity) || 0 : 0,
    priority: form.priority || "media",
  });

  const saveMutation = useMutation({
    mutationFn: () => form.offer_id ? updateOffer(buildPayload()) : createOffer(buildPayload()),
    onSuccess: () => { showSuccess("¡Éxito!", editingId ? "Oferta actualizada" : "Oferta creada"); qc.invalidateQueries({ queryKey: ["offers", tenantId] }); resetForm(); },
    onError: (e) => showWarning("Error", e.message),
  });
  const toggleMutation = useMutation({
    mutationFn: (o) => updateOffer({ ...o, is_active: !o.is_active }),
    onSuccess: () => { showSuccess("Actualizado", "Estado cambiado"); qc.invalidateQueries({ queryKey: ["offers", tenantId] }); },
    onError: (e) => showError("Error", e.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteOffer(id),
    onSuccess: () => { showSuccess("Eliminada", "Oferta eliminada"); qc.invalidateQueries({ queryKey: ["offers", tenantId] }); setToDelete(null); },
    onError: (e) => showError("Error", e.message),
  });

  const handleSubmit = (e) => { e.preventDefault(); const err = validate(); setErrors(err); if (Object.keys(err).length) return; saveMutation.mutate(); };

  const handleEdit = (o) => {
    setForm({
      ...o,
      discount_value: o.discount_value || "",
      has_min_order: (o.min_order_amount || 0) > 0,
      min_order_amount: o.min_order_amount || "",
      fixed_mode: o.fixed_mode === "per_unit" ? "per_unit" : "order",
      has_min_qty: (Number(o.min_quantity) || 0) > 0,
      min_quantity: o.min_quantity || "",
      unlimited_uses: o.max_uses === null,
      max_uses: o.max_uses || "",
      no_expiry: !o.valid_from && !o.valid_until,
      product_ids: o.product_ids || [],
      category_ids: o.category_ids || [],
      buy_quantity: o.buy_quantity || "",
      paid_quantity: o.paid_quantity || "",
      priority: o.priority || "media",
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredOffers = useMemo(() => {
    if (filter === "all") return offers;
    if (filter === "active") return offers.filter(o => offerStatus(o) === "active");
    if (filter === "code") return offers.filter(o => o.trigger === "code");
    if (filter === "automatic") return offers.filter(o => o.trigger === "automatic");
    return offers;
  }, [offers, filter]);

  const discountLabel = (o) =>
    o.discount_type === "buy_x_get_y" ? `${o.buy_quantity}x${o.paid_quantity}`
      : o.discount_type === "percentage" ? `${o.discount_value}% off`
        : o.fixed_mode === "per_unit" ? `${formatted(o.discount_value)} off por unidad`
          : `${formatted(o.discount_value)} off al total`;
  const scopeLabel = (o) => o.applies_to === "all" ? "Todos los productos" : o.applies_to === "products" ? `${o.product_ids?.length || 0} producto(s)` : `${o.category_ids?.length || 0} categoría(s)`;

  const header = (
    <PageHeader title="Ofertas" description="Crea descuentos, códigos promo y ofertas automáticas para tu catálogo." />
  );

  if (isLoading) {
    return (
      <div>
        {header}
        <SkeletonForm fields={4} label="Cargando ofertas..." />
        <SkeletonList rows={3} media={false} />
      </div>
    );
  }

  const focusForm = () => {
    document.getElementById("offer-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("of-name")?.focus({ preventScroll: true });
  };

  return (
    <div>
      {header}

      {/* ── Formulario ── */}
      <div className={styles.card} id="offer-form">
        <h2>{editingId ? "Editar oferta" : "Nueva oferta"}</h2>
        <p className={styles.requiredNote}>
          Los campos marcados con <span className={styles.required}>*</span> son obligatorios.
        </p>
        <form onSubmit={handleSubmit}>

          {/* Nombre + descripción */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="of-name">Nombre interno <span className={styles.required}>*</span></label>
              <input id="of-name" className="input" value={form.name} onChange={e => sf("name", e.target.value)} placeholder="Ej: Descuento Navidad 2025" />
              {errors.name && <span className={styles.err} role="alert">{errors.name}</span>}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="of-description">Descripción visible para el cliente</label>
              <input id="of-description" className="input" value={form.description} onChange={e => sf("description", e.target.value)} placeholder="Ej: 20% off en toda la tienda" />
            </div>
          </div>

          {/* Tipo de activación */}
          <div className={styles.section}>
            <span className={styles.sectionLabel} id="of-trigger-label">¿Cómo se activa?</span>
            <div className={styles.optionGroup} role="radiogroup" aria-labelledby="of-trigger-label">
              {TRIGGER_OPTIONS.map(([val, lbl, icon]) => (
                <OptionCard key={val} name="trigger" value={val} current={form.trigger} onSelect={(v) => sf("trigger", v)} label={lbl} icon={icon} />
              ))}
            </div>
            {form.trigger === "code" && (
              <div className={`${styles.formGroup} ${styles.codeGroup}`}>
                <label htmlFor="of-code">Código promo <span className={styles.required}>*</span></label>
                <input id="of-code" className={`input ${styles.upper}`} value={form.code}
                  onChange={e => sf("code", e.target.value.toUpperCase())} placeholder="VERANO20" />
                {errors.code && <span className={styles.err} role="alert">{errors.code}</span>}
              </div>
            )}
          </div>

          {/* Descuento */}
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Tipo y valor del descuento</span>
            <div className={styles.formRow}>
              <div className={styles.formGroup} role="group" aria-labelledby="of-type-label">
                <span className={styles.label} id="of-type-label">Tipo <span className={styles.required}>*</span></span>
                <Select
                  value={form.discount_type}
                  onChange={(e) => sf("discount_type", e)}
                  options={[
                    { value: "percentage", label: "Porcentaje (%)" },
                    { value: "fixed", label: "Monto fijo" },
                    { value: "buy_x_get_y", label: "Paga X lleva Y (2x1, 3x2...)" },
                  ]}
                />
              </div>
              {form.discount_type === "buy_x_get_y" ? (
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="of-buy">Compra (X) <span className={styles.required}>*</span></label>
                    <input id="of-buy" type="number" min="2" className="input"
                      value={form.buy_quantity} onChange={e => sf("buy_quantity", e.target.value)}
                      placeholder="2" />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="of-paid">Paga (Y) <span className={styles.required}>*</span></label>
                    <input id="of-paid" type="number" min="1" className="input"
                      value={form.paid_quantity} onChange={e => sf("paid_quantity", e.target.value)}
                      placeholder="1" />
                  </div>
                </>
              ) : (
                <div className={styles.formGroup}>
                  <label htmlFor="of-value">{form.discount_type === "fixed" ? "Monto" : "Valor"} <span className={styles.required}>*</span> {form.discount_type === "percentage" ? "(%)" : ""}</label>
                  <input id="of-value" type="number" min="0.01" step="0.01" className="input"
                    value={form.discount_value} onChange={e => sf("discount_value", e.target.value)}
                    placeholder={form.discount_type === "percentage" ? "20" : "200"} />
                </div>
              )}
              {errors.discount_value && <span className={styles.err} role="alert">{errors.discount_value}</span>}
            </div>

            {form.discount_type === "fixed" && (
              <div className={styles.subSection}>
                <span className={styles.label} id="of-fixed-mode-label">Aplicar el monto</span>
                <div className={styles.optionGroup} role="radiogroup" aria-labelledby="of-fixed-mode-label" aria-describedby="of-fixed-mode-hint">
                  {FIXED_MODE_OPTIONS.map(([val, lbl, icon]) => (
                    <OptionCard key={val} name="fixed_mode" value={val} current={form.fixed_mode} onSelect={(v) => sf("fixed_mode", v)} label={lbl} icon={icon} />
                  ))}
                </div>
                <p className={styles.fieldHint} id="of-fixed-mode-hint">
                  {form.fixed_mode === "per_unit"
                    ? "Se descuenta el monto por cada unidad en oferta. Ej.: RD$200 menos por cada rollo: 5 rollos = RD$1,000 de descuento."
                    : "Se descuenta el monto una sola vez en la compra, sin importar cuántas unidades lleve. Ej.: RD$200 menos en el total, lleve 1 o 5 rollos."}
                </p>
              </div>
            )}
          </div>

          {/* Alcance */}
          <div className={styles.section}>
            <span className={styles.sectionLabel} id="of-scope-label">¿A qué aplica?</span>
            <div className={styles.optionGroup} role="radiogroup" aria-labelledby="of-scope-label">
              {SCOPE_OPTIONS.map(([val, lbl, icon]) => (
                <OptionCard key={val} name="applies_to" value={val} current={form.applies_to} onSelect={(v) => sf("applies_to", v)} label={lbl} icon={icon} />
              ))}
            </div>
            {errors.applies && <span className={styles.err} role="alert">{errors.applies}</span>}

            {form.applies_to === "products" && (
              <div className={styles.pillSection}>
                <p className={styles.pillHint}>Selecciona los productos a los que aplica el descuento.</p>
                <div className={styles.pills}>
                  {products.map(p => {
                    const active = (form.product_ids || []).includes(p.product_id);
                    return <button type="button" key={p.product_id} onClick={() => toggleId("product_ids", p.product_id)} aria-pressed={active} className={`${styles.pill} ${active ? styles.pillActive : ""}`}>{p.name}</button>;
                  })}
                </div>
              </div>
            )}

            {form.applies_to === "categories" && (
              <div className={styles.pillSection}>
                <p className={styles.pillHint}>Selecciona las categorías a las que aplica el descuento.</p>
                <div className={styles.pills}>
                  {categories.map(c => {
                    const active = (form.category_ids || []).includes(c.category_id);
                    return <button type="button" key={c.category_id} onClick={() => toggleId("category_ids", c.category_id)} aria-pressed={active} className={`${styles.pill} ${active ? styles.pillActive : ""}`}>{c.name}</button>;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Prioridad */}
          <div className={styles.section}>
            <span className={styles.sectionLabel} id="of-priority-label">Prioridad de la oferta</span>
            <p className={styles.pillHint}>
              Si varias ofertas aplican al mismo tiempo, se usa la de mayor prioridad.
              Si dos tienen la misma prioridad, gana la que más le ahorre al cliente. Las ofertas no se suman entre sí.
            </p>
            <div className={styles.optionGroup} role="radiogroup" aria-labelledby="of-priority-label">
              {PRIORITY_OPTIONS.map(([val, lbl, icon]) => (
                <OptionCard key={val} name="priority" value={val} current={form.priority} onSelect={(v) => sf("priority", v)} label={lbl} icon={icon} />
              ))}
            </div>
          </div>

          {/* Condiciones y límites */}
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Condiciones y límites</span>
            <div className={styles.conditionRow}>
              <Toggle checked={form.has_min_order} onChange={v => sf("has_min_order", v)} label="Monto mínimo de compra" />
              {form.has_min_order && (
                <input type="number" min="0" step="0.01" className={`input ${styles.shortInput}`} aria-label="Monto mínimo de compra"
                  aria-describedby="of-min-order-hint"
                  value={form.min_order_amount} onChange={e => sf("min_order_amount", e.target.value)} placeholder="Ej: 1500" />
              )}
            </div>
            {form.has_min_order && (
              <p className={styles.conditionHint} id="of-min-order-hint">
                Cuenta solo los productos en oferta, no todo el carrito. Ej.: si el mínimo es RD$1,500 y la oferta es para camisas, el cliente debe llevar RD$1,500 en camisas.
              </p>
            )}
            <div className={styles.conditionRow}>
              <Toggle checked={form.has_min_qty} onChange={v => sf("has_min_qty", v)} label="Cantidad mínima de unidades" />
              {form.has_min_qty && (
                <input type="number" min="1" step="1" className={`input ${styles.shortInput}`} aria-label="Cantidad mínima de unidades"
                  aria-describedby="of-min-qty-hint" aria-invalid={errors.min_quantity ? true : undefined}
                  value={form.min_quantity} onChange={e => sf("min_quantity", e.target.value)} placeholder="Ej: 5" />
              )}
            </div>
            {form.has_min_qty && (
              <p className={styles.conditionHint} id="of-min-qty-hint">
                La oferta aplica solo si el cliente lleva al menos esta cantidad de unidades de los productos en oferta. Ej.: compra 5 rollos y llévate RD$100 de descuento en el total.
              </p>
            )}
            {errors.min_quantity && <span className={styles.err} role="alert">{errors.min_quantity}</span>}
            <div className={styles.conditionRow}>
              <Toggle checked={form.unlimited_uses} onChange={v => sf("unlimited_uses", v)} label="Usos ilimitados" />
              {!form.unlimited_uses && (
                <input type="number" min="1" className={`input ${styles.shortInput}`} aria-label="Cantidad máxima de usos"
                  value={form.max_uses} onChange={e => sf("max_uses", e.target.value)} placeholder="Ej: 50 usos" />
              )}
            </div>
            <div className={styles.conditionRow}>
              <Toggle checked={form.no_expiry} onChange={v => sf("no_expiry", v)} label="Sin vencimiento" />
              {!form.no_expiry && (
                <div className={styles.dateRow}>
                  <div className={styles.formGroup}>
                    <label id="of-from-label" htmlFor="of-from">Desde</label>
                    <DatePicker id="of-from" name="valid_from" aria-labelledby="of-from-label" clearable
                      value={form.valid_from} max={form.valid_until || undefined} onChange={v => sf("valid_from", v)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label id="of-until-label" htmlFor="of-until">Hasta</label>
                    <DatePicker id="of-until" name="valid_until" aria-labelledby="of-until-label" clearable
                      value={form.valid_until} min={form.valid_from || undefined} onChange={v => sf("valid_until", v)} />
                  </div>
                </div>
              )}
            </div>
            <div className={styles.conditionRow}>
              <Toggle checked={form.is_active} onChange={v => sf("is_active", v)} label="Oferta activa al guardar" />
            </div>
          </div>

          <div className={styles.formActions}>
            <Button type="submit" loading={saveMutation.isPending}>{saveMutation.isPending ? "Guardando..." : editingId ? "Actualizar oferta" : "Crear oferta"}</Button>
            {editingId && <Button variant="secondary" onClick={resetForm} disabled={saveMutation.isPending}>Cancelar</Button>}
          </div>
        </form>
      </div>

      {/* ── Lista ── */}
      <div className={styles.listHeader}>
        <h2>Ofertas existentes</h2>
        <div className={styles.listHeaderRight}>
          <div className={styles.filterTabs} role="group" aria-label="Filtrar ofertas">
            {[["all", "Todas"], ["active", "Activas"], ["code", "Códigos"], ["automatic", "Automáticas"]].map(([v, l]) => (
              <button type="button" key={v} aria-pressed={filter === v} className={`${styles.filterTab} ${filter === v ? styles.filterTabActive : ""}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => refetch()}>Actualizar</Button>
        </div>
      </div>

      {filteredOffers.length === 0 ? (
        offers.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="Aún no tienes ofertas"
            description="Crea un código promo o un descuento automático para mover tus productos."
            action={<Button variant="secondary" onClick={focusForm}>Crear la primera</Button>}
          />
        ) : (
          <EmptyState
            compact
            title="No hay ofertas en este filtro"
            action={<Button variant="secondary" size="sm" onClick={() => setFilter("all")}>Ver todas</Button>}
          />
        )
      ) : (
        <div className={styles.offerList}>
          {filteredOffers.map(offer => {
            const status = offerStatus(offer);
            const prio = offer.priority || "media";
            return (
              <div key={offer.offer_id} className={`${styles.offerCard} ${status !== "active" ? styles.offerCardDim : ""}`}>
                <div className={styles.offerCardLeft}>
                  <div className={styles.offerCardHeader}>
                    <span className={styles.offerName}>{offer.name}</span>
                    <span className={`${styles.statusBadge} ${styles[STATUS_TONE[status]]}`}>{STATUS_LABEL[status]}</span>
                    <span className={`${styles.statusBadge} ${styles[PRIORITY_TONE[prio]]}`}>Prioridad: {PRIORITY_LABEL[prio]}</span>
                  </div>
                  {offer.description && <div className={styles.offerDesc}>{offer.description}</div>}
                  <div className={styles.offerMeta}>
                    <span className={styles.discountBadge}><Gift size={14} aria-hidden="true" /> {discountLabel(offer)}</span>
                    {offer.trigger === "code" && <span className={styles.codeBadge}><Tag size={14} aria-hidden="true" /> {offer.code}</span>}
                    {offer.trigger === "automatic" && <span className={styles.autoBadge}><Zap size={14} aria-hidden="true" /> Automática</span>}
                    <span className={styles.metaChip}><Package size={14} aria-hidden="true" /> {scopeLabel(offer)}</span>
                    {(offer.min_order_amount || 0) > 0 && <span className={styles.metaChip}>Compra mín. en oferta: {formatted(offer.min_order_amount)}</span>}
                    {(Number(offer.min_quantity) || 0) > 0 && <span className={styles.metaChip}>Mín. {offer.min_quantity} unidades</span>}
                  </div>
                  <div className={styles.offerFooter}>
                    {offer.max_uses !== null ? (
                      <div className={styles.usageWrap}>
                        <span className={styles.usageText}>{offer.uses_count} / {offer.max_uses} usos</span>
                        <div className={styles.usageTrack}>
                          <div className={styles.usageFill} style={{ width: `${Math.min(100, (offer.uses_count / offer.max_uses) * 100)}%` }} />
                        </div>
                      </div>
                    ) : (
                      <span className={styles.metaChip}>Sin límite de usos · {offer.uses_count} usada(s)</span>
                    )}
                    {!offer.no_expiry && offer.valid_until && <span className={styles.metaChip}>Vence: {offer.valid_until}</span>}
                  </div>
                </div>
                <div className={styles.offerCardActions}>
                  <IconButton icon={Pencil} label={`Editar ${offer.name}`} onClick={() => handleEdit(offer)} />
                  <IconButton
                    icon={offer.is_active ? Pause : Play}
                    label={offer.is_active ? `Pausar ${offer.name}` : `Activar ${offer.name}`}
                    onClick={() => toggleMutation.mutate(offer)}
                    disabled={toggleMutation.isPending}
                  />
                  <IconButton icon={Trash2} variant="danger" label={`Eliminar ${offer.name}`} onClick={() => setToDelete(offer)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        dismissible={!deleteMutation.isPending}
        size="sm"
        title="Eliminar oferta"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)} disabled={deleteMutation.isPending}>Cancelar</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(toDelete.offer_id)}>
              {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </>
        }
      >
        <p className={styles.modalText}>¿Eliminar <strong>{toDelete?.name}</strong>? Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  );
};

export default Offers;