import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaPen, FaTrashCan, FaTag, FaArrowsRotate } from "react-icons/fa6";
import { LuPause, LuPlay } from "react-icons/lu";

import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import Loading from "../../../components/UI/Loading";
import PrimaryButton from "../../../components/PrimaryButton";
import { formatted } from "../../../helpers/utils";
import { fetchProducts } from "../../../services/productsApi";
import { fetchCategories } from "../../../services/categoryApi";
import { fetchOffers, createOffer, updateOffer, deleteOffer } from "../../../services/offersApi";
import adminStyles from "../AdminDashboard.module.css";
import styles from "./Offers.module.css";

const emptyForm = {
  offer_id: "", name: "", description: "", is_active: true,
  trigger: "code", code: "",
  discount_type: "percentage", discount_value: "",
  applies_to: "all", product_ids: [], category_ids: [],
  has_min_order: false, min_order_amount: "",
  unlimited_uses: true, max_uses: "",
  no_expiry: true, valid_from: "", valid_until: "",
  buy_quantity: "", paid_quantity: "",
};

const Toggle = ({ checked, onChange, label }) => (
  <label className={styles.toggle}>
    <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
    <span className={styles.track}><span className={styles.thumb} /></span>
    {label && <span className={styles.toggleLabel}>{label}</span>}
  </label>
);

const offerStatus = (o) => {
  const today = new Date().toISOString().slice(0, 10);
  if (!o.is_active) return "inactive";
  if (o.valid_until && o.valid_until < today) return "expired";
  if (o.max_uses !== null && o.uses_count >= o.max_uses) return "exhausted";
  if (o.valid_from && o.valid_from > today) return "scheduled";
  return "active";
};
const STATUS_LABEL = { active: "Activa", inactive: "Pausada", expired: "Vencida", exhausted: "Agotada", scheduled: "Programada" };
const STATUS_COLOR = {
  active: { background: "#d1fae5", color: "#065f46" },
  inactive: { background: "#f3f4f6", color: "#6b7280" },
  expired: { background: "#fee2e2", color: "#991b1b" },
  exhausted: { background: "#fef3c7", color: "#92400e" },
  scheduled: { background: "#ede9fe", color: "#5b21b6" },
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

    if (form.applies_to === "products" && !form.product_ids?.length) err.applies = "Selecciona al menos un producto";
    if (form.applies_to === "categories" && !form.category_ids?.length) err.applies = "Selecciona al menos una categoría";
    return err;
  };

  const buildPayload = () => ({
    ...form,
    code: form.trigger === "code" ? form.code.trim().toUpperCase() : "",
    discount_value: Number(form.discount_value) || 0,
    min_order_amount: form.has_min_order ? Number(form.min_order_amount) || 0 : 0,
    max_uses: !form.unlimited_uses && form.max_uses ? Number(form.max_uses) : null,
    valid_from: form.no_expiry ? "" : (form.valid_from || ""),
    valid_until: form.no_expiry ? "" : (form.valid_until || ""),
    buy_quantity: form.discount_type === "buy_x_get_y" ? Number(form.buy_quantity) || 0 : 0,
    paid_quantity: form.discount_type === "buy_x_get_y" ? Number(form.paid_quantity) || 0 : 0,
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
      unlimited_uses: o.max_uses === null,
      max_uses: o.max_uses || "",
      no_expiry: !o.valid_from && !o.valid_until,
      product_ids: o.product_ids || [],
      category_ids: o.category_ids || [],
      buy_quantity: o.buy_quantity || "",
      paid_quantity: o.paid_quantity || "",
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
        : `${formatted(o.discount_value)} off`;
  const scopeLabel = (o) => o.applies_to === "all" ? "Todos los productos" : o.applies_to === "products" ? `${o.product_ids?.length || 0} producto(s)` : `${o.category_ids?.length || 0} categoría(s)`;

  if (isLoading) return <Loading message="Cargando ofertas..." />;

  return (
    <div>
      <div className={adminStyles.adminHeader}>
        <h1>Gestión de Ofertas</h1>
        <p>Crea descuentos, códigos promo y ofertas automáticas para tu catálogo.</p>
      </div>

      {/* ── Formulario ── */}
      <div className={styles.card}>
        <h2>{editingId ? "Editar Oferta" : "Nueva Oferta"}</h2>
        <p className={styles.requiredNote}>
          Los campos marcados con <span className={styles.required}>*</span> son obligatorios.
        </p>
        <form onSubmit={handleSubmit}>

          {/* Nombre + descripción */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Nombre interno <span className={styles.required}>*</span></label>
              <input className="input" value={form.name} onChange={e => sf("name", e.target.value)} placeholder="Ej: Descuento Navidad 2025" />
              {errors.name && <span className={styles.err}>{errors.name}</span>}
            </div>
            <div className={styles.formGroup}>
              <label>Descripción visible para el cliente</label>
              <input className="input" value={form.description} onChange={e => sf("description", e.target.value)} placeholder="Ej: 20% off en toda la tienda" />
            </div>
          </div>

          {/* Tipo de activación */}
          <div className={styles.section}>
            <span className={styles.sectionLabel}>¿Cómo se activa?</span>
            <div className={styles.optionGroup}>
              {[["code", "🏷️ Código de descuento"], ["automatic", "⚡ Automática"]].map(([val, lbl]) => (
                <label key={val} className={`${styles.optionCard} ${form.trigger === val ? styles.optionActive : ""}`}>
                  <input type="radio" name="trigger" value={val} checked={form.trigger === val} onChange={() => sf("trigger", val)} />
                  {lbl}
                </label>
              ))}
            </div>
            {form.trigger === "code" && (
              <div className={styles.formGroup} style={{ marginTop: ".75rem", maxWidth: 260 }}>
                <label>Código promo <span className={styles.required}>*</span></label>
                <input className="input" value={form.code} style={{ textTransform: "uppercase" }}
                  onChange={e => sf("code", e.target.value.toUpperCase())} placeholder="VERANO20" />
                {errors.code && <span className={styles.err}>{errors.code}</span>}
              </div>
            )}
          </div>

          {/* Descuento */}
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Tipo y valor del descuento</span>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Tipo <span className={styles.required}>*</span></label>
                <select className="input" value={form.discount_type} onChange={e => sf("discount_type", e.target.value)}>
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto fijo</option>
                  <option value="buy_x_get_y">Paga X lleva Y (2x1, 3x2...)</option>
                </select>
              </div>
              {/* <div className={styles.formGroup}>
                <label>Valor <span className={styles.required}>*</span> {form.discount_type === "percentage" ? "(%)" : ""}</label>
                <input type="number" min="0.01" step="0.01" className="input"
                  value={form.discount_value} onChange={e => sf("discount_value", e.target.value)}
                  placeholder={form.discount_type === "percentage" ? "20" : "200"} />
                {errors.discount_value && <span className={styles.err}>{errors.discount_value}</span>}
              </div> */}
              {form.discount_type === "buy_x_get_y" ? (
                <>
                  <div className={styles.formGroup}>
                    <label>Compra (X) <span className={styles.required}>*</span></label>
                    <input type="number" min="2" className="input"
                      value={form.buy_quantity} onChange={e => sf("buy_quantity", e.target.value)}
                      placeholder="2" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Paga (Y) <span className={styles.required}>*</span></label>
                    <input type="number" min="1" className="input"
                      value={form.paid_quantity} onChange={e => sf("paid_quantity", e.target.value)}
                      placeholder="1" />
                  </div>
                </>
              ) : (
                <div className={styles.formGroup}>
                  <label>Valor <span className={styles.required}>*</span> {form.discount_type === "percentage" ? "(%)" : ""}</label>
                  <input type="number" min="0.01" step="0.01" className="input"
                    value={form.discount_value} onChange={e => sf("discount_value", e.target.value)}
                    placeholder={form.discount_type === "percentage" ? "20" : "200"} />
                </div>
              )}
              {errors.discount_value && <span className={styles.err}>{errors.discount_value}</span>}
            </div>
          </div>

          {/* Alcance */}
          <div className={styles.section}>
            <span className={styles.sectionLabel}>¿A qué aplica?</span>
            <div className={styles.optionGroup}>
              {[["all", "🛍️ Todos los productos"], ["products", "📦 Productos específicos"], ["categories", "🗂️ Categorías"]].map(([val, lbl]) => (
                <label key={val} className={`${styles.optionCard} ${form.applies_to === val ? styles.optionActive : ""}`}>
                  <input type="radio" name="applies_to" value={val} checked={form.applies_to === val} onChange={() => sf("applies_to", val)} />
                  {lbl}
                </label>
              ))}
            </div>
            {errors.applies && <span className={styles.err}>{errors.applies}</span>}

            {form.applies_to === "products" && (
              <div className={styles.pillSection}>
                <p className={styles.pillHint}>Selecciona los productos a los que aplica el descuento.</p>
                <div className={styles.pills}>
                  {products.map(p => {
                    const active = (form.product_ids || []).includes(p.product_id);
                    return <button type="button" key={p.product_id} onClick={() => toggleId("product_ids", p.product_id)} className={`${styles.pill} ${active ? styles.pillActive : ""}`}>{p.name}</button>;
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
                    return <button type="button" key={c.category_id} onClick={() => toggleId("category_ids", c.category_id)} className={`${styles.pill} ${active ? styles.pillActive : ""}`}>{c.name}</button>;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Condiciones y límites */}
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Condiciones y límites</span>
            <div className={styles.conditionRow}>
              <Toggle checked={form.has_min_order} onChange={v => sf("has_min_order", v)} label="Monto mínimo de orden" />
              {form.has_min_order && (
                <input type="number" min="0" step="0.01" className="input" style={{ maxWidth: 180 }}
                  value={form.min_order_amount} onChange={e => sf("min_order_amount", e.target.value)} placeholder="Ej: 1500" />
              )}
            </div>
            <div className={styles.conditionRow}>
              <Toggle checked={form.unlimited_uses} onChange={v => sf("unlimited_uses", v)} label="Usos ilimitados" />
              {!form.unlimited_uses && (
                <input type="number" min="1" className="input" style={{ maxWidth: 180 }}
                  value={form.max_uses} onChange={e => sf("max_uses", e.target.value)} placeholder="Ej: 50 usos" />
              )}
            </div>
            <div className={styles.conditionRow}>
              <Toggle checked={form.no_expiry} onChange={v => sf("no_expiry", v)} label="Sin vencimiento" />
              {!form.no_expiry && (
                <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label>Desde</label>
                    <input type="date" className="input" value={form.valid_from} onChange={e => sf("valid_from", e.target.value)} />
                  </div>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label>Hasta</label>
                    <input type="date" className="input" value={form.valid_until} onChange={e => sf("valid_until", e.target.value)} />
                  </div>
                </div>
              )}
            </div>
            <div className={styles.conditionRow}>
              <Toggle checked={form.is_active} onChange={v => sf("is_active", v)} label="Oferta activa al guardar" />
            </div>
          </div>

          <div className={styles.formActions}>
            <PrimaryButton type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Guardando..." : editingId ? "Actualizar oferta" : "Crear oferta"}</PrimaryButton>
            {editingId && <button type="button" className={styles.btnOutline} onClick={resetForm}>Cancelar</button>}
          </div>
        </form>
      </div>

      {/* ── Lista ── */}
      <div className={styles.listHeader}>
        <h2>Ofertas existentes</h2>
        <div className={styles.listHeaderRight}>
          <div className={styles.filterTabs}>
            {[["all", "Todas"], ["active", "Activas"], ["code", "Códigos"], ["automatic", "Automáticas"]].map(([v, l]) => (
              <button key={v} className={`${styles.filterTab} ${filter === v ? styles.filterTabActive : ""}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
          <button className={styles.refreshBtn} onClick={() => refetch()}><FaArrowsRotate /> Actualizar</button>
        </div>
      </div>

      {filteredOffers.length === 0 ? (
        <div className={styles.empty}>{offers.length === 0 ? "Aún no tienes ofertas. Crea la primera arriba." : "No hay ofertas en este filtro."}</div>
      ) : (
        <div className={styles.offerList}>
          {filteredOffers.map(offer => {
            const status = offerStatus(offer);
            return (
              <div key={offer.offer_id} className={`${styles.offerCard} ${status !== "active" ? styles.offerCardDim : ""}`}>
                <div className={styles.offerCardLeft}>
                  <div className={styles.offerCardHeader}>
                    <span className={styles.offerName}>{offer.name}</span>
                    <span className={styles.statusBadge} style={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</span>
                  </div>
                  {offer.description && <div className={styles.offerDesc}>{offer.description}</div>}
                  <div className={styles.offerMeta}>
                    <span className={styles.discountBadge}>🎁 {discountLabel(offer)}</span>
                    {offer.trigger === "code" && <span className={styles.codeBadge}>🏷️ {offer.code}</span>}
                    {offer.trigger === "automatic" && <span className={styles.autoBadge}>⚡ Automática</span>}
                    <span className={styles.metaChip}>📦 {scopeLabel(offer)}</span>
                    {(offer.min_order_amount || 0) > 0 && <span className={styles.metaChip}>Mín: {formatted(offer.min_order_amount)}</span>}
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
                  <button className={styles.iconBtn} onClick={() => handleEdit(offer)} aria-label="Editar"><FaPen /></button>
                  <button className={styles.iconBtn} onClick={() => toggleMutation.mutate(offer)} aria-label={offer.is_active ? "Pausar" : "Activar"} title={offer.is_active ? "Pausar" : "Activar"}>
                    {offer.is_active ? <LuPause /> : <LuPlay />}
                  </button>
                  <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => setToDelete(offer)} aria-label="Eliminar"><FaTrashCan /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toDelete && (
        <div className={styles.modalOverlay} onClick={() => setToDelete(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Eliminar oferta</h3>
            <p>¿Eliminar <strong>{toDelete.name}</strong>? Esta acción no se puede deshacer.</p>
            <div className={styles.modalActions}>
              <button className={styles.btnOutline} onClick={() => setToDelete(null)}>Cancelar</button>
              <button className={styles.btnDanger} disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(toDelete.offer_id)}>
                {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Offers;