import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { saveAs } from "file-saver";
import { FaPen, FaTrashCan, FaEye, FaArrowsRotate, FaRegImage, FaPlus, FaFileExcel, FaCloudArrowUp, FaMagnifyingGlass } from "react-icons/fa6";

import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import Loading from "../../../components/UI/Loading";
import PrimaryButton from "../../../components/PrimaryButton";
import { currencies, getAges, formatted } from "../../../helpers/utils";
import { fetchBusinessData } from "../../../services/businessApi";
import { fetchCategories } from "../../../services/categoryApi";
import {
  fetchProducts, createProduct, updateProduct, deleteProduct,
  deleteProductImage, uploadProductImages, importProducts
} from "../../../services/productsApi";
import adminStyles from "../AdminDashboard.module.css";
import styles from "./Products.module.css";
import CurrencySelect from "../../../components/CurrencySelect";
import Select from "../../../components/Select";

const MAX_IMAGES = 5;
const emptyVariant = { color: "", size: "", quantity: 0, extra_price: 0 };
const emptyForm = {
  product_id: "", name: "", description: "", currency: "", price: "",
  category_id: "", is_available: "available", orden: 0, quantity: 0,
  show_quantity: false, just_one: false, min_age_allow: false, min_age: 0,
  required_delivery_day: false, delivery_start_day: "", terms: "", imagesUrl: [],
  localities: [], is_customizable: false, variants: [],
  locality_config: [],
  low_stock_threshold: "",
  itbis_mode: "included",
  allow_comment: false, comment_required: false, comment_label: "",

};

// Convierte código de moneda (DOP) a símbolo (RD$). Si ya es símbolo o no se encuentra, lo deja igual.
const curSymbol = (code) => currencies.find((c) => c.code === code)?.symbol || code || "";

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
  const [toDeleteUrls, setToDeleteUrls] = useState([]);   // imágenes existentes marcadas para borrar al guardar
  const [errors, setErrors] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [variantForm, setVariantForm] = useState(emptyVariant);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState("upload");   // upload | preview | importing | done
  const [importRows, setImportRows] = useState([]);
  const [importHeaders, setImportHeaders] = useState([]);
  const [importMapping, setImportMapping] = useState({});
  const [importResult, setImportResult] = useState(null);
  const [defCurrency, setDefCurrency] = useState("");

  // ── Búsqueda y filtros de la lista ──
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSort, setFilterSort] = useState("orden");

  const editingId = form.product_id;
  const categoryName = useMemo(() => (id) => categories.find((c) => c.category_id === id)?.name || "Sin categoría", [categories]);

  const setField = (id, value) => setForm((p) => ({ ...p, [id]: value }));
  const resetForm = () => {
    setForm(emptyForm); setNewFiles([]); setToDeleteUrls([]); setErrors({});
    setVariantForm(emptyVariant); setEditingVariantId(null);
  };
  const resetImport = () => {
    setImportOpen(false);
    setImportStep("upload");
    setImportRows([]);
    setImportHeaders([]);
    setImportMapping({});
    setImportResult(null);
  };

  // ---- Locality config helpers ----
  const getLocalityConfig = (loc) =>
    (form.locality_config || []).find((c) => c.locality === loc) ||
    { locality: loc, delivery: false, takeout: true, delivery_price: 0 };

  const updateLocalityConfig = (loc, field, value) => {
    setForm((p) => {
      const cfg = p.locality_config || [];
      const idx = cfg.findIndex((c) => c.locality === loc);
      if (idx >= 0) return { ...p, locality_config: cfg.map((c, i) => i === idx ? { ...c, [field]: value } : c) };
      return { ...p, locality_config: [...cfg, { locality: loc, delivery: false, takeout: true, delivery_price: 0, [field]: value }] };
    });
  };

  const toggleLocality = (loc) =>
    setForm((p) => {
      const list = p.localities || [];
      const included = list.includes(loc);
      return {
        ...p,
        localities: included ? list.filter((l) => l !== loc) : [...list, loc],
        locality_config: included ? (p.locality_config || []).filter((c) => c.locality !== loc) : p.locality_config || [],
      };
    });

  const existingUrls = (form.imagesUrl || [])
    .map((i) => (typeof i === "string" ? i : i.image))
    .filter((u) => !toDeleteUrls.includes(u));
  const totalImages = existingUrls.length + newFiles.length;

  const onSelectFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (totalImages + files.length > MAX_IMAGES) { showWarning("Demasiadas imágenes", `Máximo ${MAX_IMAGES}`); e.target.value = ""; return; }
    setNewFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };
  const removeNewFile = (idx) => setNewFiles((prev) => prev.filter((_, i) => i !== idx));

  // Marca una imagen existente para borrarla del S3 SOLO al guardar.
  // Mientras tanto solo desaparece de la vista; si cancelas, no se tocó nada.
  const markForDelete = (url) =>
    setToDeleteUrls((prev) => (prev.includes(url) ? prev : [...prev, url]));

  // ---- Variant helpers ----
  const addOrUpdateVariant = () => {
    if (!variantForm.color.trim()) { showWarning("Aviso", "El color es requerido"); return; }
    if (editingVariantId) {
      setForm((p) => ({ ...p, variants: p.variants.map((v) => v.variant_id === editingVariantId ? { ...variantForm, variant_id: editingVariantId } : v) }));
    } else {
      setForm((p) => ({ ...p, variants: [...(p.variants || []), { ...variantForm, variant_id: crypto.randomUUID() }] }));
    }
    setVariantForm(emptyVariant); setEditingVariantId(null);
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
    for (const loc of (form.localities || [])) {
      const cfg = getLocalityConfig(loc);
      if (!cfg.delivery && !cfg.takeout) {
        err.locality_config = `"${loc}" debe tener al menos Delivery o Take out activado.`;
        break;
      }
    }
    return err;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Borrar del S3 SOLO ahora (al guardar) las imágenes que el usuario quitó.
      // Se hace antes del update: el registro aún las contiene, así el endpoint puede removerlas.
      if (form.product_id && toDeleteUrls.length) {
        for (const url of toDeleteUrls) {
          try { await deleteProductImage(form.product_id, url); }
          catch (err) { console.error("No se pudo eliminar imagen del S3:", err); }
        }
      }
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
        locality_config: (form.localities || []).map((loc) => getLocalityConfig(loc)),
        low_stock_threshold: form.low_stock_threshold !== "" ? Number(form.low_stock_threshold) : null,
        itbis_mode: form.itbis_mode || "included",
        allow_comment: form.allow_comment,
        comment_required: form.allow_comment ? form.comment_required : false,
        comment_label: form.allow_comment ? (form.comment_label || "").trim() : "",
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

  const importMutation = useMutation({
    mutationFn: async () => {
      setImportStep("importing");
      const mapped = importRows
        .map((row, i) => {
          const catName = importMapping.category ? String(row[importMapping.category] || "").trim() : "";
          const cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
          return {
            name: String(row[importMapping.name] || "").trim(),
            description: String(row[importMapping.description] || "").trim(),
            price: Number(row[importMapping.price]) || 0,
            currency: String(row[importMapping.currency] || defCurrency).trim(),
            quantity: Number(row[importMapping.quantity]) || 0,
            category_id: cat?.category_id || "",
          };
        })
        .filter(r => r.name); // ignorar filas sin nombre

      return importProducts({ business_id: business?.business_id, products: mapped });
    },
    onSuccess: (result) => {
      setImportResult(result);
      setImportStep("done");
      queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
    },
    onError: (e) => { showError("Error", e.message); setImportStep("preview"); },
  });

  const handleSubmit = (e) => { e.preventDefault(); const err = validate(); setErrors(err); if (Object.keys(err).length) return; saveMutation.mutate(); };

  const handleEdit = (p) => {

    const currency = currencies.filter((c) => c.symbol === p.currency)[0]?.code || p.currency || "";

    setForm({
      product_id: p.product_id, name: p.name || "", description: p.description || "",
      currency: currency || "", price: p.price ?? "", category_id: p.category_id || "",
      is_available: p.is_available || "available", orden: p.orden ?? 0, quantity: p.quantity ?? 0,
      show_quantity: !!p.show_quantity, just_one: !!p.just_one, min_age_allow: !!p.min_age_allow,
      min_age: p.min_age ?? 0, required_delivery_day: !!p.required_delivery_day,
      delivery_start_day: p.delivery_start_day || "", terms: p.terms || "", imagesUrl: p.imagesUrl || [],
      localities: p.localities || [], is_customizable: !!p.is_customizable, variants: p.variants || [],
      locality_config: p.locality_config || [],
      low_stock_threshold: p.low_stock_threshold ?? "",
      itbis_mode: p.itbis_mode || "included",
      allow_comment: !!p.allow_comment,
      comment_required: !!p.comment_required,
      comment_label: p.comment_label || "",
    });
    setNewFiles([]); setToDeleteUrls([]); setErrors({}); setVariantForm(emptyVariant); setEditingVariantId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImportFile = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      showWarning("Formato inválido", "Solo se aceptan .xlsx, .xls y .csv");
      return;
    }
    try {
      const XLSX = await import("xlsx-js-style");;
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (!rows.length) { showWarning("Aviso", "El archivo está vacío"); return; }

      const headers = Object.keys(rows[0]);
      setImportHeaders(headers);
      setImportRows(rows);

      // Auto-detectar columnas
      const find = (keys) => headers.find(h => keys.includes(h.toLowerCase().trim())) || "";
      setImportMapping({
        name: find(["nombre", "name", "producto", "product"]),
        description: find(["descripcion", "description", "descripción", "desc", "detalle"]),
        price: find(["precio", "price", "valor", "costo", "monto"]),
        currency: find(["moneda", "currency", "divisa"]),
        quantity: find(["cantidad", "quantity", "stock", "existencias"]),
        category: find(["categoria", "category", "categoría", "tipo"]),
      });
      setImportStep("preview");
    } catch {
      showError("Error", "No se pudo leer el archivo. Verifica que sea un Excel válido.");
    }
  };

  const downloadTemplate = async () => {
    const XLSX = await import("xlsx-js-style");
    const ws = XLSX.utils.aoa_to_sheet([
      ["nombre", "descripcion", "precio", "moneda", "cantidad", "categoria"],
      ["Camiseta azul", "100% algodón", 1500, "DOP", 20, "Ropa"],
      ["Zapatos cuero", "Talla 38-44", 3500, "DOP", 10, "Calzado"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }),
      "plantilla_qatalo.xlsx"
    );
  };

  // ── Lista filtrada + ordenada ──
  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = products.filter((p) => {
      const matchSearch = !term ||
        (p.name || "").toLowerCase().includes(term) ||
        (p.description || "").toLowerCase().includes(term);
      const matchCat = filterCategory === "all" || p.category_id === filterCategory;
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "available" && p.is_available === "available") ||
        (filterStatus === "unavailable" && p.is_available !== "available");
      return matchSearch && matchCat && matchStatus;
    });

    const sorted = [...list];
    if (filterSort === "orden") sorted.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    else if (filterSort === "name") sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (filterSort === "price_asc") sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    else if (filterSort === "price_desc") sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    else if (filterSort === "stock_asc") sorted.sort((a, b) => (Number(a.quantity) || 0) - (Number(b.quantity) || 0));
    return sorted;
  }, [products, search, filterCategory, filterStatus, filterSort]);

  const hasActiveFilters = search || filterCategory !== "all" || filterStatus !== "all";
  const clearFilters = () => { setSearch(""); setFilterCategory("all"); setFilterStatus("all"); setFilterSort("orden"); };

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
        <p className={styles.requiredNote}>
          Los campos marcados con <span className={styles.required}>*</span> son obligatorios.
        </p>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Nombre <span className={styles.required}>*</span></label>
            <input className="input" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Camisa de lino" />
            {errors.name && <span className={styles.err}>{errors.name}</span>}
          </div>
          <div className={styles.formGroup}>
            <label>Descripción</label>
            <input className="input" value={form.description} onChange={(e) => setField("description", e.target.value)} />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Moneda <span className={styles.required}>*</span></label>
              <CurrencySelect
                value={form.currency}
                onChange={(code) => setField("currency", code)}
              />
              {errors.currency && <span className={styles.err}>{errors.currency}</span>}
            </div>
            <div className={styles.formGroup}>
              <label>Precio base <span className={styles.required}>*</span> {curSymbol(form.currency)}</label>
              <input type="number" step="0.01" min="0" className="input" value={form.price} onChange={(e) => setField("price", e.target.value)} placeholder="1850.00" />
              {errors.price && <span className={styles.err}>{errors.price}</span>}
            </div>
            <div className={styles.formGroup}>
              <label>ITBIS del precio</label>
              <Select
                value={form.itbis_mode}
                onChange={(v) => setField("itbis_mode", v)}
                options={[{ value: "included", label: "Precio incluye ITBIS (se desglosa)" }, { value: "added", label: "ITBIS se suma aparte" }, { value: "exempt", label: "Exento de ITBIS" }]}
                placeholder="Seleccionar"
              />
              <span style={{ fontSize: ".75rem", color: "#667085", marginTop: ".2rem", display: "block" }}>
                {form.itbis_mode === "included"
                  ? "El precio ya incluye el 18%. En la factura se mostrará desglosado."
                  : form.itbis_mode === "added"
                    ? "Se agregará el 18% al emitir factura con NCF."
                    : "Este producto no paga ITBIS (alimentos, medicinas, etc.)."}
              </span>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Categoría <span className={styles.required}>*</span></label>
              <Select
                value={form.category_id}
                onChange={(v) => setField("category_id", v)}
                options={categories.map(c => ({ value: c.category_id, label: c.name }))}
                placeholder="Seleccionar categoría"
              />
              {errors.category_id && <span className={styles.err}>{errors.category_id}</span>}
            </div>
            {!form.is_customizable && (
              <div className={styles.formGroup}>
                <label>Estado</label>
                <Select
                  value={form.is_available}
                  onChange={(v) => setField("is_available", v)}
                  options={[{ value: "available", label: "Disponible" }, { value: "unavailable", label: "Agotado" }]}
                  placeholder="Seleccionar estado"
                />
              </div>
            )}
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Orden</label>
              <input type="number" min="0" className="input" value={form.orden} onChange={(e) => setField("orden", e.target.value)} />
            </div>
            {!form.is_customizable && (
              <>
                <div className={styles.formGroup}>
                  <label>Cantidad</label>
                  <input type="number" min="0" className="input" value={form.quantity} onChange={(e) => setField("quantity", e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Umbral de stock bajo</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={form.low_stock_threshold}
                    onChange={e => setField("low_stock_threshold", e.target.value)}
                    placeholder="Usa el umbral global"
                  />
                  <span style={{ fontSize: ".75rem", color: "#667085", marginTop: ".2rem", display: "block" }}>
                    {form.low_stock_threshold === ""
                      ? "Vacío = usa el umbral configurado en tu negocio"
                      : form.low_stock_threshold === "0" || Number(form.low_stock_threshold) === 0
                        ? "⚠️ Alertas desactivadas para este producto"
                        : `Alerta cuando queden ≤ ${form.low_stock_threshold} unidades`}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Localidades + config de entrega */}
          {businessLocalities.length > 0 && (
            <>
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

              {(form.localities || []).length > 0 && (
                <div className={styles.localityConfigSection}>
                  <label className={styles.localityConfigTitle}>Opciones de entrega por localidad</label>
                  <p style={{ color: "#667085", fontSize: ".82rem", margin: "-.2rem 0 .75rem" }}>
                    Configura si cada localidad tiene delivery y/o take out. El precio de delivery puede ser 0 (gratis).
                  </p>
                  {errors.locality_config && <span className={styles.err}>{errors.locality_config}</span>}
                  <div className={styles.localityConfigGrid}>
                    {(form.localities || []).map((loc) => {
                      const cfg = getLocalityConfig(loc);
                      return (
                        <div key={loc} className={styles.localityConfigCard}>
                          <div className={styles.localityConfigName}>{loc}</div>
                          <div className={styles.localityConfigOptions}>
                            <label className={styles.localityOption}>
                              <input type="checkbox" checked={!!cfg.delivery}
                                onChange={(e) => updateLocalityConfig(loc, "delivery", e.target.checked)} />
                              🛵 Delivery
                            </label>
                            {cfg.delivery && (
                              <div className={styles.deliveryPriceRow}>
                                <span className={styles.deliveryPriceLabel}>Precio {curSymbol(form.currency)}</span>
                                <input type="number" min="0" step="0.01" className="input"
                                  style={{ width: "110px" }} placeholder="0"
                                  value={cfg.delivery_price}
                                  onChange={(e) => updateLocalityConfig(loc, "delivery_price", Number(e.target.value))} />
                                {Number(cfg.delivery_price) === 0 && <span className={styles.freeTag}>Gratis</span>}
                              </div>
                            )}
                            <label className={styles.localityOption}>
                              <input type="checkbox" checked={!!cfg.takeout}
                                onChange={(e) => updateLocalityConfig(loc, "takeout", e.target.checked)} />
                              🏪 Take out
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          <div className={styles.formGroup}>
            <label>Imágenes <span className={styles.required}>*</span> (máx. {MAX_IMAGES})</label>
            <div className={styles.imageRow}>
              {existingUrls.map((url) => (
                <div key={url} className={styles.thumbBox}>
                  <img src={url} alt="" className={styles.thumbImg} />
                  <button type="button" className={styles.thumbRemove} onClick={() => markForDelete(url)}>×</button>
                </div>
              ))}
              {newFiles.map((file, idx) => (
                <div key={idx} className={styles.thumbBox}>
                  <img src={URL.createObjectURL(file)} alt="" className={styles.thumbImg} />
                  <button type="button" className={styles.thumbRemove} onClick={() => removeNewFile(idx)}>×</button>
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
            {toDeleteUrls.length > 0 && (
              <span style={{ fontSize: ".78rem", color: "#b42318", marginTop: ".3rem", display: "block" }}>
                {toDeleteUrls.length} imagen(es) se eliminarán al guardar. Si cancelas, se conservan.
              </span>
            )}
          </div>

          <div className={styles.toggleRow}>
            <Toggle checked={form.show_quantity} onChange={(v) => setField("show_quantity", v)} label="Mostrar cantidad" />
            <Toggle checked={form.just_one} onChange={(v) => setField("just_one", v)} label="Solo uno" />
          </div>

          {/* Variantes */}
          <div className={styles.toggleRow}>
            <Toggle checked={form.is_customizable} onChange={(v) => { setField("is_customizable", v); if (!v) { setVariantForm(emptyVariant); setEditingVariantId(null); } }} label="Producto personalizable (colores / tallas)" />
          </div>
          {form.is_customizable && (
            <div className={styles.variantSection}>
              <h4 className={styles.variantTitle}>Variantes</h4>
              <div className={styles.variantForm}>
                <div className={styles.variantField}><label>Color <span className={styles.required}>*</span></label><input className="input" placeholder="Rojo…" value={variantForm.color} onChange={(e) => setVariantForm((f) => ({ ...f, color: e.target.value }))} /></div>
                <div className={styles.variantField}><label>Talla</label><input className="input" placeholder="S, M…" value={variantForm.size} onChange={(e) => setVariantForm((f) => ({ ...f, size: e.target.value }))} /></div>
                <div className={styles.variantField}><label>Stock</label><input type="number" min="0" className="input" value={variantForm.quantity} onChange={(e) => setVariantForm((f) => ({ ...f, quantity: Number(e.target.value) }))} /></div>
                <div className={styles.variantField}><label>Precio extra {curSymbol(form.currency)}</label><input type="number" min="0" step="0.01" className="input" placeholder="0" value={variantForm.extra_price} onChange={(e) => setVariantForm((f) => ({ ...f, extra_price: Number(e.target.value) }))} /></div>
                <div className={styles.variantBtns}>
                  <button type="button" className={styles.btnSmall} onClick={addOrUpdateVariant}><FaPlus size={11} /> {editingVariantId ? "Actualizar" : "Agregar"}</button>
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
                          <td>{v.color}</td><td>{v.size || "—"}</td>
                          <td><span className={v.quantity > 0 ? styles.stockOk : styles.stockOut}>{v.quantity}</span></td>
                          <td>{v.extra_price ? `+ ${curSymbol(form.currency)} ${formatted(v.extra_price)}` : "—"}</td>
                          <td className={styles.variantActions}>
                            <button type="button" className={styles.iconBtn} onClick={() => startEditVariant(v)}><FaPen size={12} /></button>
                            <button type="button" className={`${styles.iconBtn} ${styles.danger}`} onClick={() => removeVariant(v.variant_id)}><FaTrashCan size={12} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className={styles.variantSummary}>{(form.variants || []).length} variante(s) · Stock total: <strong>{(form.variants || []).reduce((s, v) => s + (Number(v.quantity) || 0), 0)}</strong></p>
                </div>
              ) : (<p className={styles.variantEmpty}>Aún no has agregado variantes.</p>)}
            </div>
          )}

          {/* Comentario / personalización del cliente */}
          <div className={styles.toggleRow}>
            <Toggle
              checked={form.allow_comment}
              onChange={(v) => {
                setField("allow_comment", v);
                if (!v) { setField("comment_required", false); setField("comment_label", ""); }
              }}
              label="Permitir comentario / personalización del cliente"
            />
            {form.allow_comment && (
              <Toggle checked={form.comment_required} onChange={(v) => setField("comment_required", v)} label="Obligatorio" />
            )}
          </div>
          {form.allow_comment && (
            <div className={styles.formGroup}>
              <label>Texto guía para el cliente (opcional)</label>
              <input
                className="input"
                value={form.comment_label}
                onChange={(e) => setField("comment_label", e.target.value)}
                placeholder="Ej. ¿Qué nombre quieres grabar?"
                maxLength={80}
              />
              <span style={{ fontSize: ".75rem", color: "#667085", marginTop: ".2rem", display: "block" }}>
                Este texto le indica al cliente qué escribir al pedir. Si lo dejas vacío, se mostrará "Personalización".
              </span>
            </div>
          )}

          <div className={styles.toggleRow}>
            <Toggle checked={form.min_age_allow} onChange={(v) => setField("min_age_allow", v)} label="Edad mínima" />
            {form.min_age_allow && (
              <Select
                value={form.min_age}
                onChange={(value) => setField("min_age", value)}
                options={[
                  { value: "", label: "Seleccionar edad mínima" },
                  ...getAges().map((a) => ({ value: a.code, label: a.name })),
                ]}
              />
            )}
          </div>
          <div className={styles.toggleRow}>
            <Toggle checked={form.required_delivery_day} onChange={(v) => setField("required_delivery_day", v)} label="Requiere fecha de entrega" />
            {form.required_delivery_day && (<input type="date" className="input" style={{ maxWidth: 200 }} value={form.delivery_start_day} onChange={(e) => setField("delivery_start_day", e.target.value)} />)}
          </div>
          <div className={styles.formGroup}>
            <label>Términos y condiciones (opcional)</label>
            <textarea className="input" rows={4} value={form.terms} onChange={(e) => setField("terms", e.target.value)} />
          </div>
          <div className={styles.formActions}>
            <PrimaryButton type="submit" disabled={busy}>{busy ? "Guardando..." : editingId ? "Actualizar producto" : "Crear producto"}</PrimaryButton>
            {editingId && <button type="button" className={styles.btnOutline} onClick={resetForm}>Cancelar edición</button>}
          </div>
        </form>
      </div>

      <div className={styles.listHeader}>
        <h2>Productos existentes</h2>
        <div style={{ display: "flex", gap: ".6rem" }}>
          <button className={styles.importBtn} onClick={() => setImportOpen(true)}>
            <FaFileExcel /> Importar Excel
          </button>
          <button className={styles.refreshBtn} onClick={() => refetch()}>
            <FaArrowsRotate /> Actualizar
          </button>
        </div>
      </div>

      {/* ── Buscador + filtros ── */}
      {products.length > 0 && (
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <FaMagnifyingGlass color="#667085" />
            <input
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
            />
            {search && <button className={styles.searchClear} onClick={() => setSearch("")}>×</button>}
          </div>

          <div className={styles.filterControls}>
            <div className={styles.filterField}>
              <Select
                value={filterCategory}
                onChange={setFilterCategory}
                options={[
                  { value: "all", label: "Todas las categorías" },
                  ...categories.map((c) => ({ value: c.category_id, label: c.name })),
                ]}
                searchable={false}
              />
            </div>
            <div className={styles.filterField}>
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { value: "all", label: "Todos los estados" },
                  { value: "available", label: "Disponibles" },
                  { value: "unavailable", label: "Agotados" },
                ]}
                searchable={false}
              />
            </div>
            <div className={styles.filterField}>
              <Select
                value={filterSort}
                onChange={setFilterSort}
                options={[
                  { value: "orden", label: "Orden personalizado" },
                  { value: "name", label: "Nombre (A-Z)" },
                  { value: "price_asc", label: "Precio (menor a mayor)" },
                  { value: "price_desc", label: "Precio (mayor a menor)" },
                  { value: "stock_asc", label: "Stock (menor a mayor)" },
                ]}
                searchable={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Contador de resultados */}
      {products.length > 0 && (
        <div className={styles.resultsRow}>
          <span className={styles.resultsCount}>
            {visibleProducts.length === products.length
              ? `${products.length} producto(s)`
              : `${visibleProducts.length} de ${products.length} producto(s)`}
          </span>
          {hasActiveFilters && (
            <button className={styles.clearFilters} onClick={clearFilters}>Limpiar filtros</button>
          )}
        </div>
      )}

      {products.length === 0 ? (
        <div className={styles.empty}>Aún no tienes productos.</div>
      ) : visibleProducts.length === 0 ? (
        <div className={styles.empty}>No hay productos que coincidan con la búsqueda o filtros.</div>
      ) : (
        <div className={styles.grid}>
          {visibleProducts.map((p) => {
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
                  <span className={styles.productPrice}>{curSymbol(p.currency)} {formatted(p.price)}</span>
                  {p.is_customizable && p.variants?.length > 0 && <span className={styles.variantCount}>{p.variants.length} variante(s)</span>}
                  {p.allow_comment && <span className={styles.variantCount}>✏️ Acepta personalización</span>}
                  {(p.locality_config || []).length > 0 && (
                    <span className={styles.deliveryBadge}>
                      {p.locality_config.some(c => c.delivery) ? "🛵" : ""}{p.locality_config.some(c => c.takeout) ? " 🏪" : ""}
                    </span>
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
              <button className={styles.btnDanger} onClick={() => deleteMutation.mutate(toDelete.product_id)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}</button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className={styles.modalOverlay} onClick={() => setViewing(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{viewing.name}</h3>
            <div className={styles.detailGallery}>{(viewing.imagesUrl || []).map((i, idx) => <img key={idx} src={i.image || i} alt="" />)}</div>
            <ul className={styles.detailList}>
              <li><span>Precio base</span><strong>{curSymbol(viewing.currency)} {formatted(viewing.price)}</strong></li>
              <li><span>Categoría</span><strong>{categoryName(viewing.category_id)}</strong></li>
              {!viewing.is_customizable && <li><span>Cantidad</span><strong>{viewing.quantity}</strong></li>}
              <li><span>Estado</span><strong>{viewing.is_available === "available" ? "Disponible" : "Agotado"}</strong></li>
              <li><span>Localidades</span><strong>{viewing.localities?.length ? viewing.localities.join(", ") : "Todas"}</strong></li>
              {(viewing.locality_config || []).length > 0 && (
                <li style={{ flexDirection: "column", alignItems: "flex-start" }}>
                  <span>Entrega por localidad</span>
                  <div style={{ marginTop: ".4rem", display: "flex", flexDirection: "column", gap: ".3rem" }}>
                    {viewing.locality_config.map((cfg) => (
                      <span key={cfg.locality} style={{ fontSize: ".85rem", color: "#344054" }}>
                        <strong>{cfg.locality}:</strong>{" "}
                        {[
                          cfg.delivery ? `🛵 Delivery${cfg.delivery_price > 0 ? ` (+${curSymbol(viewing.currency)}${formatted(cfg.delivery_price)})` : " (gratis)"}` : null,
                          cfg.takeout ? "🏪 Take out" : null,
                        ].filter(Boolean).join(" · ")}
                      </span>
                    ))}
                  </div>
                </li>
              )}
              {viewing.allow_comment && <li><span>Personalización</span><strong>{viewing.comment_required ? "Obligatoria" : "Opcional"}{viewing.comment_label ? ` — "${viewing.comment_label}"` : ""}</strong></li>}
              {viewing.min_age_allow && <li><span>Edad mínima</span><strong>{viewing.min_age} años</strong></li>}
              {viewing.terms && <li><span>Términos</span><strong>{viewing.terms}</strong></li>}
            </ul>
            <div className={styles.modalActions}><button className={styles.btnOutline} onClick={() => setViewing(null)}>Cerrar</button></div>
          </div>
        </div>
      )}
      {importOpen && (
        <div className={styles.modalOverlay} onClick={importStep !== "importing" ? resetImport : undefined}>
          <div className={`${styles.modal} ${styles.modalWide}`} onClick={e => e.stopPropagation()}>

            {/* ── Step: upload ── */}
            {importStep === "upload" && (
              <>
                <h3>Importar productos desde Excel</h3>
                <p className={styles.importNote}>
                  Sube un archivo <strong>.xlsx</strong>, <strong>.xls</strong> o <strong>.csv</strong>.
                  Todos los productos se importarán como <strong>inactivos</strong> hasta que les agregues imágenes.
                </p>

                <label className={styles.dropZone}>
                  <FaCloudArrowUp size={32} color="#113f67" />
                  <span className={styles.dropTitle}>Arrastra tu archivo aquí</span>
                  <span className={styles.dropSub}>o haz clic para seleccionar</span>
                  <input
                    type="file" hidden
                    accept=".xlsx,.xls,.csv"
                    onChange={e => handleImportFile(e.target.files?.[0])}
                  />
                </label>

                <div className={styles.importActions}>
                  <button className={styles.btnOutline} onClick={resetImport}>Cancelar</button>
                  <button className={styles.templateBtn} onClick={downloadTemplate}>
                    <FaFileExcel /> Descargar plantilla
                  </button>
                </div>
              </>
            )}

            {/* ── Step: preview ── */}
            {importStep === "preview" && (
              <>
                <h3>Vista previa — {importRows.length} filas detectadas</h3>

                {/* Mapeo de columnas */}
                <div className={styles.mappingGrid}>
                  {[
                    { key: "name", label: "Nombre *" },
                    { key: "price", label: "Precio *" },
                    { key: "currency", label: "Moneda" },
                    { key: "quantity", label: "Cantidad" },
                    { key: "description", label: "Descripción" },
                    { key: "category", label: "Categoría" },
                  ].map(({ key, label }) => (
                    <div key={key} className={styles.mappingRow}>
                      <span className={styles.mappingLabel}>{label}</span>

                      <Select
                        value={importMapping[key] || ""}
                        onChange={(value) => setImportMapping(m => ({ ...m, [key]: value }))}
                        options={[
                          { value: "", label: "— sin mapear —" },
                          ...importHeaders.map(h => ({ value: h, label: h })),
                        ]}
                      />
                    </div>
                  ))}
                  <div className={styles.mappingRow}>
                    <span className={styles.mappingLabel}>Moneda por defecto</span>
                    <CurrencySelect
                      value={defCurrency}
                      onChange={setDefCurrency}
                    />
                  </div>
                </div>

                {/* Preview tabla */}
                <div className={styles.previewWrap}>
                  <table className={styles.previewTable}>
                    <thead>
                      <tr>
                        <th>#</th>
                        {importHeaders.map(h => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.slice(0, 8).map((row, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          {importHeaders.map(h => <td key={h}>{String(row[h] ?? "")}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importRows.length > 8 && (
                    <p className={styles.previewMore}>... y {importRows.length - 8} filas más</p>
                  )}
                </div>

                <div className={styles.importActions}>
                  <button className={styles.btnOutline} onClick={() => setImportStep("upload")}>Volver</button>
                  <button
                    className={styles.btnImport}
                    disabled={!importMapping.name}
                    onClick={() => importMutation.mutate()}
                  >
                    <FaFileExcel /> Importar {importRows.length} productos
                  </button>
                </div>
              </>
            )}

            {/* ── Step: importing ── */}
            {importStep === "importing" && (
              <div className={styles.importingState}>
                <div className={styles.importSpinner} />
                <p>Importando productos...</p>
                <span className={styles.importNote}>No cierres esta ventana.</span>
              </div>
            )}

            {/* ── Step: done ── */}
            {importStep === "done" && importResult && (
              <>
                <h3>Importación completada</h3>

                <div className={styles.importSummary}>
                  <div className={styles.summaryItem} style={{ color: "#065f46", background: "#d1fae5" }}>
                    <strong>{importResult.created}</strong>
                    <span>Importados</span>
                  </div>
                  <div className={styles.summaryItem} style={{ color: importResult.error_count > 0 ? "#b42318" : "#667085", background: importResult.error_count > 0 ? "#fee2e2" : "#f4f6f8" }}>
                    <strong>{importResult.error_count}</strong>
                    <span>Errores</span>
                  </div>
                </div>

                <div className={styles.importAlert}>
                  📷 <strong>Todos los productos fueron importados como inactivos.</strong><br />
                  Ve a <strong>Productos</strong>, edita cada uno, agrega una foto y actívalo para que aparezca en tu catálogo.
                </div>

                {importResult.errors?.length > 0 && (
                  <div className={styles.errorList}>
                    <p className={styles.errorListTitle}>Filas con error:</p>
                    {importResult.errors.map((e, i) => (
                      <div key={i} className={styles.errorItem}>
                        <span>Fila {e.row} — {e.name}</span>
                        <span>{e.error}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.importActions}>
                  <button className={styles.btnPrimary} onClick={resetImport}>Cerrar</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default Products;