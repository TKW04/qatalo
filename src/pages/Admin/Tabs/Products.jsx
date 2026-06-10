import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaPen, FaTrashCan, FaEye, FaArrowsRotate, FaRegImage, FaPlus } from "react-icons/fa6";

import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import Loading from "../../../components/UI/Loading";
import PrimaryButton from "../../../components/PrimaryButton";
import { currencies, getAges, formatted } from "../../../helpers/utils";
import { fetchBusinessData } from "../../../services/businessApi";
import { fetchCategories } from "../../../services/categoryApi";
import {
  fetchProducts, createProduct, updateProduct, deleteProduct,
  deleteProductImage, uploadProductImages,
} from "../../../services/productsApi";
import adminStyles from "../AdminDashboard.module.css";
import styles from "./Products.module.css";

const MAX_IMAGES = 5;
const emptyVariant = { color: "", size: "", quantity: 0, extra_price: 0 };
const emptyForm = {
  product_id: "", name: "", description: "", currency: "", price: "",
  category_id: "", is_available: "available", orden: 0, quantity: 0,
  show_quantity: false, just_one: false, min_age_allow: false, min_age: 0,
  required_delivery_day: false, delivery_start_day: "", terms: "", imagesUrl: [],
  localities: [], is_customizable: false, variants: [],
};

const Toggle = ({ checked, onChange, label }) => (
  <label className={styles.toggle}>
    <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
    <span className={styles.track}><span className={styles.thumb} /></span>
    {label && <span className={styles.toggleLabel}>{label}</span>}
  </label>
);

const Products = () => {
  const auth = getTokenInfo();
  const tenantId = auth?.sub;
  const { showError, showWarning, showSuccess } = useNotification();
  const queryClient = useQueryClient();

  const { data: business } = useQuery({ queryKey: ["business", tenantId], queryFn: fetchBusinessData, enabled: !!tenantId, retry: false });
  const { data: categories = [] } = useQuery({ queryKey: ["categories", tenantId], queryFn: fetchCategories, enabled: !!tenantId, retry: false });
  const { data: products = [], isLoading, refetch } = useQuery({ queryKey: ["products", tenantId], queryFn: fetchProducts, enabled: !!tenantId, retry: false });

  const businessLocalities = business?.localities || [];

  const [form, setForm] = useState(emptyForm);
  const [newFiles, setNewFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [variantForm, setVariantForm] = useState(emptyVariant);
  const [editingVariantId, setEditingVariantId] = useState(null);

  const editingId = form.product_id;
  const categoryName = useMemo(() => (id) => categories.find((c) => c.category_id === id)?.name || "Sin categoría", [categories]);

  const setField = (id, value) => setForm((p) => ({ ...p, [id]: value }));
  const resetForm = () => { setForm(emptyForm); setNewFiles([]); setErrors({}); setVariantForm(emptyVariant); setEditingVariantId(null); };

  const toggleLocality = (loc) =>
    setForm((p) => {
      const list = p.localities || [];
      return { ...p, localities: list.includes(loc) ? list.filter((l) => l !== loc) : [...list, loc] };
    });

  const existingUrls = (form.imagesUrl || []).map((i) => (typeof i === "string" ? i : i.image));
  const totalImages = existingUrls.length + newFiles.length;

  const onSelectFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (totalImages + files.length > MAX_IMAGES) { showWarning("Demasiadas imágenes", `Máximo ${MAX_IMAGES}`); e.target.value = ""; return; }
    setNewFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };
  const removeNewFile = (idx) => setNewFiles((prev) => prev.filter((_, i) => i !== idx));

  const imageDeleteMutation = useMutation({
    mutationFn: ({ productId, url }) => deleteProductImage(productId, url),
    onSuccess: (_d, { url }) => {
      setForm((p) => ({ ...p, imagesUrl: (p.imagesUrl || []).filter((i) => (typeof i === "string" ? i : i.image) !== url) }));
      queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
      showSuccess("Imagen eliminada", "La imagen se eliminó correctamente");
    },
    onError: (e) => showError("Error", e.message),
  });

  // ---- Variant helpers ----
  const addOrUpdateVariant = () => {
    if (!variantForm.color.trim()) { showWarning("Aviso", "El color es requerido"); return; }
    if (editingVariantId) {
      setForm((p) => ({ ...p, variants: p.variants.map((v) => v.variant_id === editingVariantId ? { ...variantForm, variant_id: editingVariantId } : v) }));
    } else {
      setForm((p) => ({ ...p, variants: [...(p.variants || []), { ...variantForm, variant_id: crypto.randomUUID() }] }));
    }
    setVariantForm(emptyVariant);
    setEditingVariantId(null);
  };
  const removeVariant = (vid) => setForm((p) => ({ ...p, variants: p.variants.filter((v) => v.variant_id !== vid) }));
  const startEditVariant = (v) => { setVariantForm({ color: v.color, size: v.size || "", quantity: v.quantity, extra_price: v.extra_price || 0 }); setEditingVariantId(v.variant_id); };
  const cancelEditVariant = () => { setVariantForm(emptyVariant); setEditingVariantId(null); };

  // ---- Validation ----
  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = "El nombre es requerido";
    if (form.price === "" || isNaN(Number(form.price)) || Number(form.price) < 0) err.price = "El precio debe ser ≥ 0";
    if (!form.category_id) err.category_id = "La categoría es requerida";
    if (!form.currency) err.currency = "La moneda es requerida";
    if (totalImages < 1) err.images = "Selecciona al menos 1 imagen";
    if (totalImages > MAX_IMAGES) err.images = `Máximo ${MAX_IMAGES} imágenes`;
    if (form.is_customizable && (!form.variants || form.variants.length === 0)) err.variants = "Agrega al menos una variante";
    return err;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const uploaded = newFiles.length ? await uploadProductImages(newFiles) : [];
      let quantity, is_available;
      if (form.is_customizable) {
        quantity = (form.variants || []).reduce((s, v) => s + (Number(v.quantity) || 0), 0);
        is_available = quantity > 0 ? "available" : "unavailable";
      } else {
        quantity = Number(form.quantity) || 0;
        is_available = quantity < 1 ? "unavailable" : form.is_available;
      }
      const payload = {
        product_id: form.product_id || undefined,
        business_id: business?.business_id,
        name: form.name.trim(), description: form.description, currency: form.currency,
        price: Number(form.price) || 0, category_id: form.category_id, is_available,
        orden: Number(form.orden) || 0, quantity, show_quantity: form.show_quantity,
        just_one: form.just_one, min_age_allow: form.min_age_allow, min_age: Number(form.min_age) || 0,
        required_delivery_day: form.required_delivery_day, delivery_start_day: form.delivery_start_day,
        terms: form.terms, imagesUrl: [...existingUrls, ...uploaded], localities: form.localities || [],
        is_customizable: form.is_customizable,
        variants: form.is_customizable ? (form.variants || []) : [],
      };
      return form.product_id ? updateProduct(payload) : createProduct(payload);
    },
    onSuccess: () => {
      showSuccess("¡Éxito!", editingId ? "Producto actualizado" : "Producto creado");
      queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
      resetForm();
    },
    onError: (e) => showWarning("Revisa la información", e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: () => { showSuccess("Eliminado", "Producto eliminado"); queryClient.invalidateQueries({ queryKey: ["products", tenantId] }); setToDelete(null); },
    onError: (e) => showError("Error", e.message),
  });

  const handleSubmit = (e) => { e.preventDefault(); const err = validate(); setErrors(err); if (Object.keys(err).length) return; saveMutation.mutate(); };

  const handleEdit = (p) => {
    setForm({
      product_id: p.product_id, name: p.name || "", description: p.description || "",
      currency: p.currency || "", price: p.price ?? "", category_id: p.category_id || "",
      is_available: p.is_available || "available", orden: p.orden ?? 0, quantity: p.quantity ?? 0,
      show_quantity: !!p.show_quantity, just_one: !!p.just_one, min_age_allow: !!p.min_age_allow,
      min_age: p.min_age ?? 0, required_delivery_day: !!p.required_delivery_day,
      delivery_start_day: p.delivery_start_day || "", terms: p.terms || "", imagesUrl: p.imagesUrl || [],
      localities: p.localities || [], is_customizable: !!p.is_customizable, variants: p.variants || [],
    });
    setNewFiles([]); setErrors({}); setVariantForm(emptyVariant); setEditingVariantId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) return <Loading message="Cargando productos..." />;
  const busy = saveMutation.isPending;

  return (
    <div>
      <div className={adminStyles.adminHeader}>
        <h1>Gestión de Productos</h1>
        <p>Administra tu catálogo de productos</p>
      </div>

      {busy && <Loading message={editingId ? "Actualizando producto..." : "Creando producto..."} />}

      <div className={styles.card}>
        <h2>{editingId ? "Editar Producto" : "Nuevo Producto"}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Nombre *</label>
            <input className="input" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Camisa de lino" />
            {errors.name && <span className={styles.err}>{errors.name}</span>}
          </div>
          <div className={styles.formGroup}>
            <label>Descripción</label>
            <input className="input" value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Camisa fresca 100% lino" />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Moneda *</label>
              <select className="input" value={form.currency} onChange={(e) => setField("currency", e.target.value)}>
                <option value="">Seleccionar moneda</option>
                {currencies.map((c) => (<option key={c.code} value={c.symbol}>{c.name} ({c.symbol})</option>))}
              </select>
              {errors.currency && <span className={styles.err}>{errors.currency}</span>}
            </div>
            <div className={styles.formGroup}>
              <label>Precio base * {form.currency}</label>
              <input type="number" step="0.01" min="0" className="input" value={form.price} onChange={(e) => setField("price", e.target.value)} placeholder="1850.00" />
              {errors.price && <span className={styles.err}>{errors.price}</span>}
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Categoría *</label>
              <select className="input" value={form.category_id} onChange={(e) => setField("category_id", e.target.value)}>
                <option value="">Seleccionar categoría</option>
                {categories.map((c) => (<option key={c.category_id} value={c.category_id}>{c.name}</option>))}
              </select>
              {errors.category_id && <span className={styles.err}>{errors.category_id}</span>}
            </div>
            {!form.is_customizable && (
              <div className={styles.formGroup}>
                <label>Estado</label>
                <select className="input" value={form.is_available} onChange={(e) => setField("is_available", e.target.value)}>
                  <option value="available">Disponible</option>
                  <option value="unavailable">Agotado</option>
                </select>
              </div>
            )}
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Orden</label>
              <input type="number" min="0" className="input" value={form.orden} onChange={(e) => setField("orden", e.target.value)} />
            </div>
            {!form.is_customizable && (
              <div className={styles.formGroup}>
                <label>Cantidad</label>
                <input type="number" min="0" className="input" value={form.quantity} onChange={(e) => setField("quantity", e.target.value)} />
              </div>
            )}
          </div>

          {businessLocalities.length > 0 && (
            <div className={styles.formGroup}>
              <label>Localidades disponibles</label>
              <p style={{ color: "#667085", fontSize: ".82rem", margin: "-.2rem 0 .5rem" }}>Sin selección = disponible en todas.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
                {businessLocalities.map((loc) => {
                  const active = (form.localities || []).includes(loc);
                  return (
                    <button type="button" key={loc} onClick={() => toggleLocality(loc)} style={{ border: active ? "1px solid #113f67" : "1px solid #d0d5dd", background: active ? "#113f67" : "#fff", color: active ? "#fff" : "#344054", borderRadius: "999px", padding: ".4rem .9rem", fontSize: ".85rem", fontWeight: 600, cursor: "pointer" }}>
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Imágenes * (máx. {MAX_IMAGES})</label>
            <div className={styles.imageRow}>
              {existingUrls.map((url) => (
                <div key={url} className={styles.thumbBox}>
                  <img src={url} alt="" className={styles.thumbImg} />
                  <button type="button" className={styles.thumbRemove} onClick={() => imageDeleteMutation.mutate({ productId: editingId, url })} aria-label="Eliminar">×</button>
                </div>
              ))}
              {newFiles.map((file, idx) => (
                <div key={idx} className={styles.thumbBox}>
                  <img src={URL.createObjectURL(file)} alt="" className={styles.thumbImg} />
                  <button type="button" className={styles.thumbRemove} onClick={() => removeNewFile(idx)} aria-label="Quitar">×</button>
                </div>
              ))}
              {totalImages < MAX_IMAGES && (
                <label className={styles.uploadBox}>
                  <FaRegImage size={22} /><span>Agregar</span>
                  <input type="file" accept="image/*" multiple hidden onChange={onSelectFiles} />
                </label>
              )}
            </div>
            {errors.images && <span className={styles.err}>{errors.images}</span>}
          </div>

          <div className={styles.toggleRow}>
            <Toggle checked={form.show_quantity} onChange={(v) => setField("show_quantity", v)} label="Mostrar cantidad" />
            <Toggle checked={form.just_one} onChange={(v) => setField("just_one", v)} label="Solo uno" />
          </div>

          {/* ---- VARIANTES ---- */}
          <div className={styles.toggleRow}>
            <Toggle
              checked={form.is_customizable}
              onChange={(v) => { setField("is_customizable", v); if (!v) { setVariantForm(emptyVariant); setEditingVariantId(null); } }}
              label="Producto personalizable (colores / tallas)"
            />
          </div>

          {form.is_customizable && (
            <div className={styles.variantSection}>
              <h4 className={styles.variantTitle}>Variantes</h4>
              <div className={styles.variantForm}>
                <div className={styles.variantField}>
                  <label>Color *</label>
                  <input className="input" placeholder="Rojo, Azul…" value={variantForm.color} onChange={(e) => setVariantForm((f) => ({ ...f, color: e.target.value }))} />
                </div>
                <div className={styles.variantField}>
                  <label>Talla</label>
                  <input className="input" placeholder="S, M, L, XL…" value={variantForm.size} onChange={(e) => setVariantForm((f) => ({ ...f, size: e.target.value }))} />
                </div>
                <div className={styles.variantField}>
                  <label>Stock</label>
                  <input type="number" min="0" className="input" value={variantForm.quantity} onChange={(e) => setVariantForm((f) => ({ ...f, quantity: Number(e.target.value) }))} />
                </div>
                <div className={styles.variantField}>
                  <label>Precio extra {form.currency}</label>
                  <input type="number" min="0" step="0.01" className="input" placeholder="0" value={variantForm.extra_price} onChange={(e) => setVariantForm((f) => ({ ...f, extra_price: Number(e.target.value) }))} />
                </div>
                <div className={styles.variantBtns}>
                  <button type="button" className={styles.btnSmall} onClick={addOrUpdateVariant}>
                    <FaPlus size={11} /> {editingVariantId ? "Actualizar" : "Agregar"}
                  </button>
                  {editingVariantId && <button type="button" className={styles.btnOutline} onClick={cancelEditVariant}>Cancelar</button>}
                </div>
              </div>
              {errors.variants && <span className={styles.err}>{errors.variants}</span>}

              {(form.variants || []).length > 0 ? (
                <div className={styles.variantTableWrap}>
                  <table className={styles.variantTable}>
                    <thead><tr><th>Color</th><th>Talla</th><th>Stock</th><th>Precio extra</th><th></th></tr></thead>
                    <tbody>
                      {(form.variants || []).map((v) => (
                        <tr key={v.variant_id} className={editingVariantId === v.variant_id ? styles.variantEditing : ""}>
                          <td>{v.color}</td>
                          <td>{v.size || "—"}</td>
                          <td><span className={v.quantity > 0 ? styles.stockOk : styles.stockOut}>{v.quantity}</span></td>
                          <td>{v.extra_price ? `+ ${form.currency} ${formatted(v.extra_price)}` : "—"}</td>
                          <td className={styles.variantActions}>
                            <button type="button" className={styles.iconBtn} onClick={() => startEditVariant(v)}><FaPen size={12} /></button>
                            <button type="button" className={`${styles.iconBtn} ${styles.danger}`} onClick={() => removeVariant(v.variant_id)}><FaTrashCan size={12} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className={styles.variantSummary}>
                    {(form.variants || []).length} variante(s) · Stock total: <strong>{(form.variants || []).reduce((s, v) => s + (Number(v.quantity) || 0), 0)}</strong>
                  </p>
                </div>
              ) : (
                <p className={styles.variantEmpty}>Aún no has agregado variantes.</p>
              )}
            </div>
          )}
          {/* ---- FIN VARIANTES ---- */}

          <div className={styles.toggleRow}>
            <Toggle checked={form.min_age_allow} onChange={(v) => setField("min_age_allow", v)} label="Edad mínima" />
            {form.min_age_allow && (
              <select className="input" style={{ maxWidth: 160 }} value={form.min_age} onChange={(e) => setField("min_age", e.target.value)}>
                {getAges().map((a) => (<option key={a.code} value={a.code}>{a.name}</option>))}
              </select>
            )}
          </div>
          <div className={styles.toggleRow}>
            <Toggle checked={form.required_delivery_day} onChange={(v) => setField("required_delivery_day", v)} label="Requiere fecha de entrega" />
            {form.required_delivery_day && (
              <input type="date" className="input" style={{ maxWidth: 200 }} value={form.delivery_start_day} onChange={(e) => setField("delivery_start_day", e.target.value)} />
            )}
          </div>
          <div className={styles.formGroup}>
            <label>Términos y condiciones (opcional)</label>
            <textarea className="input" rows={4} value={form.terms} onChange={(e) => setField("terms", e.target.value)} placeholder="Términos y condiciones del producto" />
          </div>
          <div className={styles.formActions}>
            <PrimaryButton type="submit" disabled={busy}>{busy ? "Guardando..." : editingId ? "Actualizar producto" : "Crear producto"}</PrimaryButton>
            {editingId && <button type="button" className={styles.btnOutline} onClick={resetForm}>Cancelar edición</button>}
          </div>
        </form>
      </div>

      <div className={styles.listHeader}>
        <h2>Productos existentes</h2>
        <button className={styles.refreshBtn} onClick={() => refetch()}><FaArrowsRotate /> Actualizar</button>
      </div>

      {products.length === 0 ? (
        <div className={styles.empty}>Aún no tienes productos.</div>
      ) : (
        <div className={styles.grid}>
          {products.map((p) => {
            const img = p.imagesUrl?.[0]?.image || p.imagesUrl?.[0];
            return (
              <div key={p.product_id} className={styles.productCard}>
                <div className={styles.productThumb}>
                  {img ? <img src={img} alt={p.name} /> : <FaRegImage size={28} />}
                  {p.is_available !== "available" && <span className={styles.soldOut}>Agotado</span>}
                  {p.is_customizable && <span className={styles.customBadge}>Personalizable</span>}
                </div>
                <div className={styles.productBody}>
                  <h3>{p.name}</h3>
                  <span className={styles.productCat}>{categoryName(p.category_id)}</span>
                  <span className={styles.productPrice}>{p.currency}{formatted(p.price)}</span>
                  {p.is_customizable && p.variants?.length > 0 && (
                    <span className={styles.variantCount}>{p.variants.length} variante(s)</span>
                  )}
                </div>
                <div className={styles.productActions}>
                  <button className={styles.iconBtn} onClick={() => setViewing(p)}><FaEye /></button>
                  <button className={styles.iconBtn} onClick={() => handleEdit(p)}><FaPen /></button>
                  <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => setToDelete(p)}><FaTrashCan /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toDelete && (
        <div className={styles.modalOverlay} onClick={() => setToDelete(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar producto</h3>
            <p>¿Seguro que deseas eliminar <strong>{toDelete.name}</strong>?</p>
            <div className={styles.modalActions}>
              <button className={styles.btnOutline} onClick={() => setToDelete(null)}>Cancelar</button>
              <button className={styles.btnDanger} onClick={() => deleteMutation.mutate(toDelete.product_id)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className={styles.modalOverlay} onClick={() => setViewing(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{viewing.name}</h3>
            <div className={styles.detailGallery}>
              {(viewing.imagesUrl || []).map((i, idx) => <img key={idx} src={i.image || i} alt="" />)}
            </div>
            <ul className={styles.detailList}>
              <li><span>Precio base</span><strong>{viewing.currency}{formatted(viewing.price)}</strong></li>
              <li><span>Categoría</span><strong>{categoryName(viewing.category_id)}</strong></li>
              {!viewing.is_customizable && <li><span>Cantidad</span><strong>{viewing.quantity}</strong></li>}
              <li><span>Estado</span><strong>{viewing.is_available === "available" ? "Disponible" : "Agotado"}</strong></li>
              <li><span>Localidades</span><strong>{viewing.localities?.length ? viewing.localities.join(", ") : "Todas"}</strong></li>
              {viewing.min_age_allow && <li><span>Edad mínima</span><strong>{viewing.min_age} años</strong></li>}
              {viewing.terms && <li><span>Términos</span><strong>{viewing.terms}</strong></li>}
              {viewing.is_customizable && (viewing.variants || []).length > 0 && (
                <li style={{ flexDirection: "column", alignItems: "flex-start" }}>
                  <span>Variantes ({(viewing.variants || []).length})</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginTop: ".4rem" }}>
                    {(viewing.variants || []).map((v) => (
                      <span key={v.variant_id} style={{ background: "#f0f7ff", border: "1px solid #d0d5dd", borderRadius: "6px", padding: ".2rem .7rem", fontSize: ".82rem" }}>
                        {v.color}{v.size ? ` / ${v.size}` : ""} · {v.quantity} uds{v.extra_price ? ` (+${viewing.currency}${formatted(v.extra_price)})` : ""}
                      </span>
                    ))}
                  </div>
                </li>
              )}
            </ul>
            <div className={styles.modalActions}><button className={styles.btnOutline} onClick={() => setViewing(null)}>Cerrar</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;