import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { saveAs } from "file-saver";
import {
  Pencil, Trash2, Eye, RefreshCw, ImagePlus, Image as ImageIcon, Plus, FileSpreadsheet, UploadCloud, Search, X,
  Bike, Store, PenLine, Camera, AlertTriangle, Ruler, Palette, ArrowLeft, ArrowRight, Download, Package, SearchX,
} from "lucide-react";

import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import {
  PageHeader, Button, IconButton, Tabs, TabPanel, Modal, EmptyState, SkeletonList,
} from "../../../components/admin";
import { currencies, getAges, formatted } from "../../../helpers/utils";
import { fetchBusinessData } from "../../../services/businessApi";
import { fetchCategories } from "../../../services/categoryApi";
import {
  fetchProducts, createProduct, updateProduct, deleteProduct,
  deleteProductImage, uploadProductImages, importProducts
} from "../../../services/productsApi";
import DatePicker from "../../../components/DatePicker";
import styles from "./Products.module.css";
import ProductSettings from "./ProductSettings";
import CurrencySelect from "../../../components/CurrencySelect";
import Select from "../../../components/Select";

const MAX_IMAGES = 5;
const emptyVariant = { color: "", size: "", quantity: 0, extra_price: 0, size_name: "", price: 0 };
const emptyForm = {
  product_id: "", name: "", description: "", currency: "", price: "",
  category_id: "", is_available: "available", orden: 0, quantity: 0,
  show_quantity: false, just_one: false, featured: false, min_age_allow: false, min_age: 0,
  required_delivery_day: false, delivery_start_day: "", terms: "", imagesUrl: [],
  localities: [], is_customizable: false, variant_type: "clothing", variants: [],
  locality_config: [],
  low_stock_threshold: "",
  itbis_mode: "included",
  allow_comment: false, comment_required: false, comment_label: "",
  alt_prices: [],
  delivery_days_after_payment: "",
  customization_fields: [],
};

const emptyAltPrice = { currency: "", price: 0 };
const emptyCustomField = { type: "measurement", label: "", unit: "cm", required: false, options: [] };
const emptyColorOption = { name: "", hex: "#000000" };

// Convierte código de moneda (DOP) a símbolo (RD$). Si ya es símbolo o no se encuentra, lo deja igual.
const curSymbol = (code) => currencies.find((c) => c.code === code)?.symbol || code || "";

const Toggle = ({ checked, onChange, label, disabled = false }) => (
  <label className={`${styles.toggle} ${disabled ? styles.toggleDisabled : ""}`}>
    <input type="checkbox" role="switch" className={styles.toggleInput} checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
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

  // ---- Monedas alternas ----
  const [altPriceForm, setAltPriceForm] = useState(emptyAltPrice);

  // ---- Campos de personalización (medida / color) ----
  const [fieldForm, setFieldForm] = useState(emptyCustomField);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [colorOptionForm, setColorOptionForm] = useState(emptyColorOption);
  const [fieldOptions, setFieldOptions] = useState([]); // opciones de color separadas del fieldForm
  const [fieldStep, setFieldStep] = useState(1); // 1=definir campo, 2=agregar colores (solo color)
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
  const [tab, setTab] = useState("products");

  const editingId = form.product_id;
  const categoryName = useMemo(() => (id) => categories.find((c) => c.category_id === id)?.name || "Sin categoría", [categories]);

  const setField = (id, value) => setForm((p) => ({ ...p, [id]: value }));
  const resetForm = () => {
    setForm(emptyForm); setNewFiles([]); setToDeleteUrls([]); setErrors({});
    setVariantForm(emptyVariant); setEditingVariantId(null);
    setAltPriceForm(emptyAltPrice); setFieldForm(emptyCustomField); setEditingFieldId(null); setColorOptionForm(emptyColorOption); setFieldOptions([]); setFieldStep(1); setFieldOptions([]);
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
  const updateLocalityDeliveryPrice = (loc, currency, price) =>
    setForm((p) => {
      const cfg = p.locality_config || [];
      const idx = cfg.findIndex((c) => c.locality === loc);
      const base = idx >= 0 ? cfg[idx] : { locality: loc, delivery: false, takeout: true, delivery_price: 0, delivery_prices: {} };
      const updated = { ...base, delivery_prices: { ...(base.delivery_prices || {}), [currency]: price } };
      // Si es la moneda base del producto, actualizar también delivery_price para compatibilidad
      const next = idx >= 0 ? cfg.map((c, i) => i === idx ? updated : c) : [...cfg, updated];
      return { ...p, locality_config: next };
    });

  const getLocalityConfig = (loc) =>
    (form.locality_config || []).find((c) => c.locality === loc) ||
    { locality: loc, delivery: false, takeout: true, delivery_price: 0, delivery_prices: {} };

  const updateLocalityConfig = (loc, field, value) => {
    setForm((p) => {
      const cfg = p.locality_config || [];
      const idx = cfg.findIndex((c) => c.locality === loc);
      if (idx >= 0) return { ...p, locality_config: cfg.map((c, i) => i === idx ? { ...c, [field]: value } : c) };
      return { ...p, locality_config: [...cfg, { locality: loc, delivery: false, takeout: true, delivery_price: 0, delivery_prices: {}, [field]: value }] };
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
    if (form.variant_type === "size") {
      if (!variantForm.size_name.trim()) { showWarning("Aviso", "El nombre del tamaño es requerido"); return; }
      if (Number(variantForm.price) <= 0) { showWarning("Aviso", "El precio del tamaño es requerido"); return; }
    } else if (!variantForm.color.trim()) { showWarning("Aviso", "El color es requerido"); return; }
    if (editingVariantId) {
      setForm((p) => ({ ...p, variants: p.variants.map((v) => v.variant_id === editingVariantId ? { ...variantForm, variant_id: editingVariantId } : v) }));
    } else {
      setForm((p) => ({ ...p, variants: [...(p.variants || []), { ...variantForm, variant_id: crypto.randomUUID() }] }));
    }
    setVariantForm(emptyVariant); setEditingVariantId(null);
  };
  const removeVariant = (vid) => setForm((p) => ({ ...p, variants: p.variants.filter((v) => v.variant_id !== vid) }));
  const startEditVariant = (v) => { setVariantForm({ color: v.color || "", size: v.size || "", quantity: v.quantity, extra_price: v.extra_price || 0, size_name: v.size_name || "", price: v.price || 0 }); setEditingVariantId(v.variant_id); };
  const cancelEditVariant = () => { setVariantForm(emptyVariant); setEditingVariantId(null); };

  // ---- Monedas alternas: helpers ----
  const addAltPrice = () => {
    if (!altPriceForm.currency) { showWarning("Aviso", "Selecciona una moneda"); return; }
    if (altPriceForm.currency === form.currency) { showWarning("Aviso", "Esa es la moneda base del producto"); return; }
    if ((form.alt_prices || []).some((a) => a.currency === altPriceForm.currency)) {
      showWarning("Aviso", "Esa moneda ya fue agregada"); return;
    }
    if (Number(altPriceForm.price) <= 0) { showWarning("Aviso", "El precio debe ser mayor a 0"); return; }
    setForm((p) => ({ ...p, alt_prices: [...(p.alt_prices || []), { ...altPriceForm }] }));
    setAltPriceForm(emptyAltPrice);
  };
  const removeAltPrice = (currency) =>
    setForm((p) => ({ ...p, alt_prices: (p.alt_prices || []).filter((a) => a.currency !== currency) }));

  // ---- Campos de personalización: helpers ----
  const addColorOptionToField = () => {
    if (!colorOptionForm.name.trim()) { showWarning("Aviso", "El nombre del color es requerido"); return; }
    const hex = /^#[0-9a-fA-F]{6}$/.test(colorOptionForm.hex) ? colorOptionForm.hex : "#000000";
    const name = colorOptionForm.name.trim();
    // Validar duplicados: mismo nombre o mismo código hex
    const nameDup = fieldOptions.some((o) => o.name.toLowerCase() === name.toLowerCase());
    const hexDup = fieldOptions.some((o) => o.hex.toLowerCase() === hex.toLowerCase());
    if (nameDup) { showWarning("Aviso", `Ya existe un color con el nombre "${name}"`); return; }
    if (hexDup) { showWarning("Aviso", `Ya existe un color con el código ${hex}`); return; }
    setFieldOptions((prev) => [...prev, { name, hex }]);
    setColorOptionForm(emptyColorOption);
  };
  const removeColorOptionFromField = (idx) =>
    setFieldOptions((prev) => prev.filter((_, i) => i !== idx));

  const addOrUpdateField = () => {
    if (!fieldForm.label.trim()) { showWarning("Aviso", "La etiqueta del campo es requerida"); return; }
    if (fieldForm.type === "color" && fieldOptions.length === 0) {
      showWarning("Aviso", "Agrega al menos un color a la paleta de este campo"); return;
    }
    // Construye el campo final combinando el form con las options del estado separado.
    // fieldOptions siempre refleja el estado actual (no depende del closure de fieldForm).
    const fieldToSave = {
      field_id: editingFieldId || crypto.randomUUID(),
      type: fieldForm.type,
      label: fieldForm.label.trim(),
      unit: fieldForm.unit || "cm",
      required: fieldForm.required,
      options: fieldOptions,   // siempre desde el estado independiente
    };
    if (editingFieldId) {
      setForm((p) => ({
        ...p,
        customization_fields: p.customization_fields.map((cfld) =>
          cfld.field_id === editingFieldId ? fieldToSave : cfld
        ),
      }));
    } else {
      setForm((p) => ({
        ...p,
        customization_fields: [...(p.customization_fields || []), fieldToSave],
      }));
    }
    setFieldForm(emptyCustomField); setEditingFieldId(null);
    setColorOptionForm(emptyColorOption); setFieldOptions([]); setFieldStep(1);
  };
  const removeField = (fieldId) =>
    setForm((p) => ({ ...p, customization_fields: p.customization_fields.filter((cfld) => cfld.field_id !== fieldId) }));
  const startEditField = (cfld) => { setFieldForm({ ...cfld, options: [] }); setFieldOptions(cfld.options || []); setEditingFieldId(cfld.field_id); setFieldStep(cfld.type === "color" ? 2 : 1); };
  const cancelEditField = () => { setFieldForm(emptyCustomField); setEditingFieldId(null); setColorOptionForm(emptyColorOption); setFieldOptions([]); setFieldStep(1); };

  // ---- Validation ----
  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = "El nombre es requerido";
    if (form.price === "" || isNaN(Number(form.price)) || Number(form.price) < 0) err.price = "El precio debe ser ≥ 0";
    if (!form.category_id) err.category_id = "La categoría es requerida";
    if (!form.currency) err.currency = "La moneda es requerida";
    if (totalImages > MAX_IMAGES) err.images = `Máximo ${MAX_IMAGES} imágenes`;
    if (form.is_customizable && (!form.variants || form.variants.length === 0)) err.variants = "Agrega al menos una variante";
    for (const loc of (form.localities || [])) {
      const cfg = getLocalityConfig(loc);
      if (!cfg.delivery && !cfg.takeout) {
        err.locality_config = `"${loc}" debe tener al menos A domicilio o Recoger en tienda activado.`;
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
      // Para comida (tamaños), el precio base del producto = el tamaño más barato (para el "Desde $X")
      const effectivePrice =
        form.is_customizable && form.variant_type === "size" && (form.variants || []).length > 0
          ? Math.min(...form.variants.map((v) => Number(v.price) || 0))
          : Number(form.price) || 0;

      const payload = {
        product_id: form.product_id || undefined,
        business_id: business?.business_id,
        name: form.name.trim(), description: form.description, currency: form.currency,
        price: effectivePrice, category_id: form.category_id, is_available,
        orden: Number(form.orden) || 0, quantity, show_quantity: form.show_quantity,
        just_one: form.just_one, featured: form.featured, min_age_allow: form.min_age_allow, min_age: Number(form.min_age) || 0,
        required_delivery_day: form.required_delivery_day, delivery_start_day: form.delivery_start_day,
        terms: form.terms, imagesUrl: [...existingUrls, ...uploaded], localities: form.localities || [],
        is_customizable: form.is_customizable,
        variant_type: form.variant_type || "clothing",
        variants: form.is_customizable ? (form.variants || []) : [],
        locality_config: (form.localities || []).map((loc) => getLocalityConfig(loc)),
        low_stock_threshold: form.low_stock_threshold !== "" ? Number(form.low_stock_threshold) : null,
        itbis_mode: form.itbis_mode || "included",
        allow_comment: form.allow_comment,
        comment_required: form.allow_comment ? form.comment_required : false,
        comment_label: form.allow_comment ? (form.comment_label || "").trim() : "",
        alt_prices: form.alt_prices || [],
        delivery_days_after_payment: form.required_delivery_day ? 0 : (Number(form.delivery_days_after_payment) || 0),
        customization_fields: form.customization_fields || [],
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
        .map((row) => {
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
      show_quantity: !!p.show_quantity, just_one: !!p.just_one, featured: !!p.featured, min_age_allow: !!p.min_age_allow,
      min_age: p.min_age ?? 0, required_delivery_day: !!p.required_delivery_day,
      delivery_start_day: p.delivery_start_day || "", terms: p.terms || "", imagesUrl: p.imagesUrl || [],
      localities: p.localities || [], is_customizable: !!p.is_customizable, variant_type: p.variant_type || "clothing", variants: p.variants || [],
      locality_config: p.locality_config || [],
      low_stock_threshold: p.low_stock_threshold ?? "",
      itbis_mode: p.itbis_mode || "included",
      allow_comment: !!p.allow_comment,
      comment_required: !!p.comment_required,
      comment_label: p.comment_label || "",
      alt_prices: p.alt_prices || [],
      delivery_days_after_payment: p.delivery_days_after_payment || "",
      customization_fields: p.customization_fields || [],
    });
    setNewFiles([]); setToDeleteUrls([]); setErrors({}); setVariantForm(emptyVariant); setEditingVariantId(null);
    setAltPriceForm(emptyAltPrice); setFieldForm(emptyCustomField); setEditingFieldId(null); setColorOptionForm(emptyColorOption); setFieldOptions([]); setFieldStep(1);
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

  const busy = saveMutation.isPending;
  const focusProductForm = () => {
    const el = document.getElementById("product-name");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  };

  const header = <PageHeader title="Productos" description="Crea, edita y organiza los productos de tu catálogo" />;

  if (isLoading) {
    return (
      <div>
        {header}
        <SkeletonList rows={5} label="Cargando productos..." />
      </div>
    );
  }

  return (
    <div>
      {header}

      <Tabs
        idPrefix="products"
        label="Secciones de productos"
        items={[
          { id: "products", label: "Productos", icon: Package },
          { id: "settings", label: "Configuración" },
        ]}
        value={tab}
        onChange={setTab}
      />

      <TabPanel idPrefix="products" id="settings" value={tab}>
        <ProductSettings business={business} />
      </TabPanel>

      <TabPanel idPrefix="products" id="products" value={tab}>
      <section className={styles.card} aria-labelledby="product-form-title">
        <h2 id="product-form-title">{editingId ? "Editar producto" : "Nuevo producto"}</h2>
        <p className={styles.requiredNote}>
          Los campos marcados con <span className={styles.required}>*</span> son obligatorios.
        </p>
        <form onSubmit={handleSubmit} aria-busy={busy || undefined}>
        <fieldset className={styles.fieldset} disabled={busy}>
          <div className={styles.formGroup}>
            <label htmlFor="product-name">Nombre <span className={styles.required}>*</span></label>
            <input id="product-name" className="input" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Camisa de lino" />
            {errors.name && <span className={styles.err}>{errors.name}</span>}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="product-description">Descripción</label>
            <input id="product-description" className="input" value={form.description} onChange={(e) => setField("description", e.target.value)} />
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
              <label htmlFor="product-price">Precio base <span className={styles.required}>*</span> {curSymbol(form.currency)}</label>
              <input id="product-price" type="number" step="0.01" min="0" className="input" value={form.price} onChange={(e) => setField("price", e.target.value)} placeholder="1850.00" />
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
              <span className={styles.hint}>
                {form.itbis_mode === "included"
                  ? "El precio ya incluye el 18%. En la factura se mostrará desglosado."
                  : form.itbis_mode === "added"
                    ? "Se agregará el 18% al emitir factura con NCF."
                    : "Este producto no paga ITBIS (alimentos, medicinas, etc.)."}
              </span>
            </div>
          </div>

          {(
            <div className={styles.variantSection}>
              <h4 className={styles.variantTitle}>Otras monedas (opcional)</h4>
              <p className={styles.sectionHint}>
                Define un precio fijo en otra(s) moneda(s). El cliente podrá elegir en cuál pagar.
              </p>
              <div className={styles.variantForm}>
                <div className={styles.variantField}>
                  <label>Moneda</label>
                  <CurrencySelect
                    value={altPriceForm.currency}
                    onChange={(code) => setAltPriceForm((f) => ({ ...f, currency: code }))}
                  />
                </div>
                <div className={styles.variantField}>
                  <label htmlFor="product-alt-price">Precio {curSymbol(altPriceForm.currency)}</label>
                  <input id="product-alt-price" type="number" min="0" step="0.01" className="input" placeholder="0"
                    value={altPriceForm.price}
                    onChange={(e) => setAltPriceForm((f) => ({ ...f, price: Number(e.target.value) }))} />
                </div>
                <div className={styles.variantBtns}>
                  <Button size="sm" icon={Plus} onClick={addAltPrice}>Agregar</Button>
                </div>
              </div>
              {(form.alt_prices || []).length > 0 ? (
                <div className={styles.variantTableWrap}>
                  <table className={styles.variantTable}>
                    <thead><tr><th>Moneda</th><th>Precio</th><th></th></tr></thead>
                    <tbody>
                      {form.alt_prices.map((a) => (
                        <tr key={a.currency}>
                          <td>{a.currency}</td>
                          <td>{curSymbol(a.currency)} {formatted(a.price)}</td>
                          <td className={styles.variantActions}>
                            <IconButton icon={Trash2} variant="danger" size={16} label={`Quitar precio en ${a.currency}`} onClick={() => removeAltPrice(a.currency)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (<p className={styles.variantEmpty}>Sin monedas adicionales. El producto solo se venderá en {form.currency || "su moneda base"}.</p>)}
            </div>
          )}

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
              <label htmlFor="product-orden">Orden</label>
              <input id="product-orden" type="number" min="0" className="input" value={form.orden} onChange={(e) => setField("orden", e.target.value)} />
            </div>
            {!form.is_customizable && (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="product-quantity">Cantidad</label>
                  <input id="product-quantity" type="number" min="0" className="input" value={form.quantity} onChange={(e) => setField("quantity", e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="product-low-stock">Umbral de stock bajo</label>
                  <input
                    id="product-low-stock"
                    type="number"
                    min="0"
                    className="input"
                    value={form.low_stock_threshold}
                    onChange={e => setField("low_stock_threshold", e.target.value)}
                    placeholder="Usa el umbral global"
                  />
                  <span className={styles.hint}>
                    {form.low_stock_threshold === ""
                      ? "Vacío = usa el umbral configurado en tu negocio"
                      : form.low_stock_threshold === "0" || Number(form.low_stock_threshold) === 0
                        ? <span className={styles.hintWarn}><AlertTriangle size={14} aria-hidden="true" /> Alertas desactivadas para este producto</span>
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
                <span className={styles.groupLabel} id="product-localities-label">Localidades disponibles</span>
                <p className={styles.sectionHint}>Sin selección = disponible en todas.</p>
                <div className={styles.chips} role="group" aria-labelledby="product-localities-label">
                  {businessLocalities.map((loc) => {
                    const active = (form.localities || []).includes(loc);
                    return (
                      <button type="button" key={loc} onClick={() => toggleLocality(loc)} aria-pressed={active} className={styles.chip}>
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(form.localities || []).length > 0 && (
                <div className={styles.localityConfigSection}>
                  <span className={styles.localityConfigTitle}>Opciones de entrega por localidad</span>
                  <p className={styles.sectionHint}>
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
                              <Bike size={16} aria-hidden="true" /> A domicilio
                            </label>
                            {cfg.delivery && (
                              <>
                                {/* Moneda base */}
                                <div className={styles.deliveryPriceRow}>
                                  <label className={styles.deliveryPriceLabel} htmlFor={`delivery-${loc}-base`}>Precio {curSymbol(form.currency)} ({form.currency})</label>
                                  <input id={`delivery-${loc}-base`} type="number" min="0" step="0.01" className={`input ${styles.priceInput}`}
                                    placeholder="0"
                                    value={cfg.delivery_price}
                                    onChange={(e) => updateLocalityConfig(loc, "delivery_price", Number(e.target.value))} />
                                  {Number(cfg.delivery_price) === 0 && <span className={styles.freeTag}>Gratis</span>}
                                </div>
                                {/* Monedas alternas */}
                                {(form.alt_prices || []).map((ap) => {
                                  const altPrice = (cfg.delivery_prices || {})[ap.currency] ?? "";
                                  return (
                                    <div key={ap.currency} className={styles.deliveryPriceRow}>
                                      <label className={styles.deliveryPriceLabel} htmlFor={`delivery-${loc}-${ap.currency}`}>Precio {curSymbol(ap.currency)} ({ap.currency})</label>
                                      <input id={`delivery-${loc}-${ap.currency}`} type="number" min="0" step="0.01" className={`input ${styles.priceInput}`}
                                        placeholder="0"
                                        value={altPrice}
                                        onChange={(e) => updateLocalityDeliveryPrice(loc, ap.currency, Number(e.target.value))} />
                                      {Number(altPrice) === 0 && <span className={styles.freeTag}>Gratis</span>}
                                    </div>
                                  );
                                })}
                              </>
                            )}
                            <label className={styles.localityOption}>
                              <input type="checkbox" checked={!!cfg.takeout}
                                onChange={(e) => updateLocalityConfig(loc, "takeout", e.target.checked)} />
                              <Store size={16} aria-hidden="true" /> Recoger en tienda
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
            <span className={styles.groupLabel}>Imágenes (opcional, máx. {MAX_IMAGES})</span>
            <span className={styles.sectionHint}>
              Si no agregas imagen, en el catálogo se mostrará el logo de tu negocio.
            </span>
            <div className={styles.imageRow}>
              {existingUrls.map((url) => (
                <div key={url} className={styles.thumbBox}>
                  <img src={url} alt="" className={styles.thumbImg} />
                  <button type="button" className={styles.thumbRemove} onClick={() => markForDelete(url)} aria-label="Quitar imagen"><X size={14} aria-hidden="true" /></button>
                </div>
              ))}
              {newFiles.map((file, idx) => (
                <div key={idx} className={styles.thumbBox}>
                  <img src={URL.createObjectURL(file)} alt="" className={styles.thumbImg} />
                  <button type="button" className={styles.thumbRemove} onClick={() => removeNewFile(idx)} aria-label="Quitar imagen"><X size={14} aria-hidden="true" /></button>
                </div>
              ))}
              {totalImages < MAX_IMAGES && (
                <label className={styles.uploadBox}>
                  <ImagePlus size={22} aria-hidden="true" /><span>Agregar</span>
                  <input type="file" accept="image/*" multiple className={styles.visuallyHidden} onChange={onSelectFiles} />
                </label>
              )}
            </div>
            {errors.images && <span className={styles.err}>{errors.images}</span>}
            {toDeleteUrls.length > 0 && (
              <span className={styles.warnText}>
                {toDeleteUrls.length} imagen(es) se eliminarán al guardar. Si cancelas, se conservan.
              </span>
            )}
          </div>

          <div className={styles.toggleRow}>
            <Toggle checked={form.show_quantity} onChange={(v) => setField("show_quantity", v)} label="Mostrar cantidad" />
            <Toggle checked={form.just_one} onChange={(v) => setField("just_one", v)} label="Solo uno" />
            <Toggle checked={form.featured} onChange={(v) => setField("featured", v)} label="Destacado (página de inicio)" />
          </div>

          {/* Variantes */}
          <div className={styles.toggleRow}>
            <Toggle checked={form.is_customizable} onChange={(v) => { setField("is_customizable", v); if (!v) { setVariantForm(emptyVariant); setEditingVariantId(null); } }} label="Producto con variantes (colores/tallas o tamaños)" />
          </div>
          {form.is_customizable && (
            <div className={styles.variantSection}>
              {/* Tipo de variante */}
              <div className={`${styles.variantField} ${styles.variantTypeField}`}>
                <span className={styles.groupLabel}>Tipo de variante</span>
                <Select
                  value={form.variant_type}
                  onChange={(v) => { setField("variant_type", v); setVariantForm(emptyVariant); setEditingVariantId(null); }}
                  options={[
                    { value: "clothing", label: "Ropa (color / talla)" },
                    { value: "size", label: "Tamaño / presentación (comida, etc.)" },
                  ]}
                  searchable={false}
                />
              </div>

              <h4 className={styles.variantTitle}>{form.variant_type === "size" ? "Tamaños" : "Variantes"}</h4>

              {form.variant_type === "size" ? (
                <>
                  <div className={styles.variantForm}>
                    <div className={styles.variantField}><label htmlFor="variant-size-name">Tamaño <span className={styles.required}>*</span></label><input id="variant-size-name" className="input" placeholder="1 libra (16oz)…" value={variantForm.size_name} onChange={(e) => setVariantForm((f) => ({ ...f, size_name: e.target.value }))} /></div>
                    <div className={styles.variantField}><label htmlFor="variant-price">Precio {curSymbol(form.currency)} <span className={styles.required}>*</span></label><input id="variant-price" type="number" min="0" step="0.01" className="input" placeholder="0" value={variantForm.price} onChange={(e) => setVariantForm((f) => ({ ...f, price: Number(e.target.value) }))} /></div>
                    <div className={styles.variantField}><label htmlFor="variant-stock">Stock</label><input id="variant-stock" type="number" min="0" className="input" value={variantForm.quantity} onChange={(e) => setVariantForm((f) => ({ ...f, quantity: Number(e.target.value) }))} /></div>
                    <div className={styles.variantBtns}>
                      <Button size="sm" icon={Plus} onClick={addOrUpdateVariant}>{editingVariantId ? "Actualizar" : "Agregar"}</Button>
                      {editingVariantId && <Button size="sm" variant="secondary" onClick={cancelEditVariant}>Cancelar</Button>}
                    </div>
                  </div>
                  {errors.variants && <span className={styles.err}>{errors.variants}</span>}
                  {(form.variants || []).length > 0 ? (
                    <div className={styles.variantTableWrap}>
                      <table className={styles.variantTable}>
                        <thead><tr><th>Tamaño</th><th>Precio</th><th>Stock</th><th></th></tr></thead>
                        <tbody>
                          {(form.variants || []).map((v) => (
                            <tr key={v.variant_id} className={editingVariantId === v.variant_id ? styles.variantEditing : ""}>
                              <td>{v.size_name || "-"}</td>
                              <td>{curSymbol(form.currency)} {formatted(v.price || 0)}</td>
                              <td><span className={v.quantity > 0 ? styles.stockOk : styles.stockOut}>{v.quantity}</span></td>
                              <td className={styles.variantActions}>
                                <IconButton icon={Pencil} size={16} label="Editar variante" onClick={() => startEditVariant(v)} />
                                <IconButton icon={Trash2} variant="danger" size={16} label="Eliminar variante" onClick={() => removeVariant(v.variant_id)} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className={styles.variantSummary}>{(form.variants || []).length} tamaño(s) · Stock total: <strong>{(form.variants || []).reduce((s, v) => s + (Number(v.quantity) || 0), 0)}</strong> · El precio del producto será el del tamaño más barato.</p>
                    </div>
                  ) : (<p className={styles.variantEmpty}>Aún no has agregado tamaños.</p>)}
                </>
              ) : (
                <>
                  <div className={styles.variantForm}>
                    <div className={styles.variantField}><label htmlFor="variant-color">Color <span className={styles.required}>*</span></label><input id="variant-color" className="input" placeholder="Rojo…" value={variantForm.color} onChange={(e) => setVariantForm((f) => ({ ...f, color: e.target.value }))} /></div>
                    <div className={styles.variantField}><label htmlFor="variant-talla">Talla</label><input id="variant-talla" className="input" placeholder="S, M…" value={variantForm.size} onChange={(e) => setVariantForm((f) => ({ ...f, size: e.target.value }))} /></div>
                    <div className={styles.variantField}><label htmlFor="variant-stock">Stock</label><input id="variant-stock" type="number" min="0" className="input" value={variantForm.quantity} onChange={(e) => setVariantForm((f) => ({ ...f, quantity: Number(e.target.value) }))} /></div>
                    <div className={styles.variantField}><label htmlFor="variant-extra">Precio extra {curSymbol(form.currency)}</label><input id="variant-extra" type="number" min="0" step="0.01" className="input" placeholder="0" value={variantForm.extra_price} onChange={(e) => setVariantForm((f) => ({ ...f, extra_price: Number(e.target.value) }))} /></div>
                    <div className={styles.variantBtns}>
                      <Button size="sm" icon={Plus} onClick={addOrUpdateVariant}>{editingVariantId ? "Actualizar" : "Agregar"}</Button>
                      {editingVariantId && <Button size="sm" variant="secondary" onClick={cancelEditVariant}>Cancelar</Button>}
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
                              <td>{v.color}</td><td>{v.size || "-"}</td>
                              <td><span className={v.quantity > 0 ? styles.stockOk : styles.stockOut}>{v.quantity}</span></td>
                              <td>{v.extra_price ? `+ ${curSymbol(form.currency)} ${formatted(v.extra_price)}` : "-"}</td>
                              <td className={styles.variantActions}>
                                <IconButton icon={Pencil} size={16} label="Editar variante" onClick={() => startEditVariant(v)} />
                                <IconButton icon={Trash2} variant="danger" size={16} label="Eliminar variante" onClick={() => removeVariant(v.variant_id)} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className={styles.variantSummary}>{(form.variants || []).length} variante(s) · Stock total: <strong>{(form.variants || []).reduce((s, v) => s + (Number(v.quantity) || 0), 0)}</strong></p>
                    </div>
                  ) : (<p className={styles.variantEmpty}>Aún no has agregado variantes.</p>)}
                </>
              )}
            </div>
          )}

          {/* Campos de personalización avanzada (medidas / color de paleta) */}
          <div className={styles.variantSection}>
            <h4 className={styles.variantTitle}>Personalización avanzada (medidas / color)</h4>
            <p className={styles.sectionHint}>
              Define los datos que el cliente debe llenar al pedir (tallas, colores, etc.).
              Se guardan en la orden para que puedas producir a la medida exacta.
            </p>

            {/* Indicador de paso */}
            <ol className={styles.stepIndicator} aria-label="Pasos del campo">
              {[
                { n: 1, label: "Definir campo" },
                { n: 2, label: fieldForm.type === "color" ? "Agregar colores" : "Confirmar" },
              ].map(({ n, label }) => (
                <li
                  key={n}
                  className={`${styles.stepItem} ${fieldStep >= n ? styles.stepReached : ""} ${fieldStep === n ? styles.stepActive : ""}`}
                  aria-current={fieldStep === n ? "step" : undefined}
                >
                  <span className={styles.stepNum} aria-hidden="true">{n}</span>
                  <span className={styles.stepText}>{label}</span>
                </li>
              ))}
            </ol>

            {/* PASO 1: Definir tipo, etiqueta, unidad, obligatorio */}
            {fieldStep === 1 && (
              <>
                <div className={styles.variantForm}>
                  <div className={styles.variantField}>
                    <span className={styles.groupLabel}>Tipo de campo</span>
                    <Select
                      value={fieldForm.type}
                      onChange={(v) => { setFieldForm((f) => ({ ...f, type: v })); setFieldOptions([]); setFieldStep(1); }}
                      options={[{ value: "measurement", label: "Medida (cm / pulgadas)" }, { value: "color", label: "Color (de una paleta)" }]}
                      searchable={false}
                    />
                  </div>
                  <div className={styles.variantField}>
                    <label htmlFor="custom-field-label">Nombre del campo <span className={styles.required}>*</span></label>
                    <input id="custom-field-label" className="input" placeholder={fieldForm.type === "color" ? "Ej. Color del vestido…" : "Ej. Busto, Cadera, Espalda…"}
                      value={fieldForm.label} onChange={(e) => setFieldForm((f) => ({ ...f, label: e.target.value }))} />
                  </div>
                  {fieldForm.type === "measurement" && (
                    <div className={styles.variantField}>
                      <span className={styles.groupLabel}>Unidad</span>
                      <Select
                        value={fieldForm.unit}
                        onChange={(v) => setFieldForm((f) => ({ ...f, unit: v }))}
                        options={[{ value: "cm", label: "Centímetros (cm)" }, { value: "in", label: "Pulgadas (in)" }]}
                        searchable={false}
                      />
                    </div>
                  )}
                  <div className={`${styles.variantField} ${styles.variantFieldToggle}`}>
                    <Toggle checked={fieldForm.required} onChange={(v) => setFieldForm((f) => ({ ...f, required: v }))} label="Obligatorio" />
                  </div>
                </div>
                <div className={styles.variantBtns}>
                  {fieldForm.type === "measurement" ? (
                    <Button size="sm" icon={Plus} onClick={addOrUpdateField}>
                      {editingFieldId ? "Actualizar campo" : "Agregar campo"}
                    </Button>
                  ) : (
                    <Button size="sm"
                      onClick={() => { if (!fieldForm.label.trim()) { showWarning("Aviso", "Escribe el nombre del campo primero"); return; } setFieldStep(2); }}>
                      Continuar: agregar colores <ArrowRight size={16} aria-hidden="true" />
                    </Button>
                  )}
                  {editingFieldId && <Button size="sm" variant="secondary" onClick={cancelEditField}>Cancelar</Button>}
                </div>
              </>
            )}

            {/* PASO 2: Paleta de colores (solo tipo "color") */}
            {fieldStep === 2 && fieldForm.type === "color" && (
              <>
                <div className={styles.paletteBox}>
                  <div className={styles.paletteHeader}>
                    <span className={styles.paletteFieldName}>Campo: "{fieldForm.label}"</span>
                    <span className={styles.paletteMeta}>({fieldForm.required ? "Obligatorio" : "Opcional"})</span>
                    <Button size="sm" variant="ghost" icon={ArrowLeft} onClick={() => setFieldStep(1)} className={styles.paletteBack}>
                      Editar nombre
                    </Button>
                  </div>

                  <p className={styles.sectionHint}>
                    Agrega los colores que el cliente puede elegir. Usa el selector o escribe el código hex.
                  </p>

                  <div className={styles.colorRow}>
                    <input type="color"
                      className={styles.colorPicker}
                      aria-label="Selector de color"
                      value={/^#[0-9a-fA-F]{6}$/.test(colorOptionForm.hex) ? colorOptionForm.hex : "#000000"}
                      onChange={(e) => setColorOptionForm((c) => ({ ...c, hex: e.target.value }))}
                      title="Abre el selector de color" />
                    <input className={`input ${styles.hexInput}`}
                      aria-label="Código hex del color"
                      placeholder="#FFFFFF"
                      value={colorOptionForm.hex}
                      onChange={(e) => setColorOptionForm((c) => ({ ...c, hex: e.target.value.trim() }))}
                      onBlur={(e) => { if (!/^#[0-9a-fA-F]{6}$/.test(e.target.value.trim())) setColorOptionForm((c) => ({ ...c, hex: "#000000" })); }} />
                    <input className={`input ${styles.colorNameInput}`}
                      aria-label="Nombre del color"
                      placeholder="Nombre (ej. Rojo vino)"
                      value={colorOptionForm.name}
                      onChange={(e) => setColorOptionForm((c) => ({ ...c, name: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addColorOptionToField()} />
                    <Button size="sm" icon={Plus} onClick={addColorOptionToField}>
                      Agregar
                    </Button>
                  </div>

                  {fieldOptions.length > 0 ? (
                    <>
                      <p className={styles.paletteLabel}>
                        Colores en la paleta ({fieldOptions.length}):
                      </p>
                      <ul className={styles.colorChips}>
                        {fieldOptions.map((opt, idx) => (
                          <li key={idx} className={styles.colorChip}>
                            <span className={styles.swatch} style={{ background: opt.hex }} aria-hidden="true" />
                            <span className={styles.colorChipName}>{opt.name}</span>
                            <span className={styles.hexText}>{opt.hex}</span>
                            <button type="button" className={styles.chipRemove} onClick={() => removeColorOptionFromField(idx)} aria-label={`Quitar ${opt.name}`}>
                              <X size={14} aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className={styles.variantEmpty}>
                      Aún no has agregado colores. Agrega al menos uno para continuar.
                    </p>
                  )}
                </div>

                <div className={styles.variantBtns}>
                  <Button size="sm" variant="secondary" icon={ArrowLeft} onClick={() => setFieldStep(1)}>Volver</Button>
                  <Button size="sm" icon={Plus} onClick={addOrUpdateField} disabled={fieldOptions.length === 0}>
                    {editingFieldId ? "Actualizar campo" : "Agregar campo con esta paleta"}
                  </Button>
                  {editingFieldId && <Button size="sm" variant="secondary" onClick={cancelEditField}>Cancelar</Button>}
                </div>
              </>
            )}

            {(form.customization_fields || []).length > 0 ? (
              <div className={`${styles.variantTableWrap} ${styles.fieldsTable}`}>
                <table className={styles.variantTable}>
                  <thead><tr><th>Nombre</th><th>Tipo</th><th>Detalle</th><th>Oblig.</th><th></th></tr></thead>
                  <tbody>
                    {form.customization_fields.map((cfld) => (
                      <tr key={cfld.field_id} className={editingFieldId === cfld.field_id ? styles.variantEditing : ""}>
                        <td>{cfld.label}</td>
                        <td>
                          <span className={styles.iconText}>
                            {cfld.type === "measurement"
                              ? <><Ruler size={14} aria-hidden="true" /> Medida</>
                              : <><Palette size={14} aria-hidden="true" /> Color</>}
                          </span>
                        </td>
                        <td>
                          {cfld.type === "measurement"
                            ? (cfld.unit === "in" ? "Pulgadas" : "Centímetros")
                            : (cfld.options || []).length > 0
                              ? <div className={styles.swatchRow}>
                                  {cfld.options.map((o, i) => (
                                    <span key={i} title={`${o.name} ${o.hex}`} className={`${styles.swatch} ${styles.swatchSm}`} style={{ background: o.hex }} />
                                  ))}
                                </div>
                              : "Sin colores"}
                        </td>
                        <td>{cfld.required ? "Sí" : "No"}</td>
                        <td className={styles.variantActions}>
                          <IconButton icon={Pencil} size={16} label={`Editar campo ${cfld.label}`} onClick={() => startEditField(cfld)} />
                          <IconButton icon={Trash2} variant="danger" size={16} label={`Eliminar campo ${cfld.label}`} onClick={() => removeField(cfld.field_id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (<p className={styles.variantEmpty}>Aún no has agregado campos de personalización.</p>)}
          </div>

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
              <label htmlFor="product-comment-label">Texto guía para el cliente (opcional)</label>
              <input
                id="product-comment-label"
                className="input"
                value={form.comment_label}
                onChange={(e) => setField("comment_label", e.target.value)}
                placeholder="Ej. ¿Qué nombre quieres grabar?"
                maxLength={80}
              />
              <span className={styles.hint}>
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
            <Toggle
              checked={form.required_delivery_day}
              onChange={(v) => { setField("required_delivery_day", v); if (v) setField("delivery_days_after_payment", ""); }}
              label="Requiere fecha de entrega"
              disabled={!!form.delivery_days_after_payment}
            />
            {form.required_delivery_day && (<DatePicker aria-label="Fecha de entrega a partir de" className="input" wrapperClassName={styles.dateInput} value={form.delivery_start_day} onChange={(v) => setField("delivery_start_day", v)} />)}
          </div>
          <div className={styles.toggleRow}>
            <Toggle
              checked={!!form.delivery_days_after_payment}
              onChange={(v) => {
                if (v) { setField("delivery_days_after_payment", "5"); setField("required_delivery_day", false); }
                else setField("delivery_days_after_payment", "");
              }}
              label="Entrega X días después de confirmar el pago"
              disabled={form.required_delivery_day}
            />
            {!!form.delivery_days_after_payment && (
              <div className={styles.inlineRow}>
                <input
                  aria-label="Días después del pago"
                  type="number" min="1" max="90" className={`input ${styles.daysInput}`}
                  value={form.delivery_days_after_payment}
                  onChange={(e) => setField("delivery_days_after_payment", e.target.value)}
                />
                <span className={styles.unitText}>días</span>
              </div>
            )}
          </div>
          {(form.required_delivery_day || !!form.delivery_days_after_payment) && (
            <p className={`${styles.sectionHint} ${styles.exclusiveNote}`}>
              Estas dos opciones son excluyentes: usa una fecha fija <strong>o</strong> un plazo tras el pago, no ambas.
            </p>
          )}
          <div className={styles.formGroup}>
            <label htmlFor="product-terms">Términos y condiciones (opcional)</label>
            <textarea id="product-terms" className="input" rows={4} value={form.terms} onChange={(e) => setField("terms", e.target.value)} />
          </div>
          <div className={styles.formActions}>
            <Button type="submit" loading={busy}>{busy ? (editingId ? "Actualizando..." : "Creando...") : editingId ? "Actualizar producto" : "Crear producto"}</Button>
            {editingId && <Button variant="secondary" onClick={resetForm}>Cancelar edición</Button>}
          </div>
        </fieldset>
        </form>
      </section>

      <div className={styles.listHeader}>
        <h2>Productos existentes</h2>
        <div className={styles.listActions}>
          <Button size="sm" variant="secondary" icon={FileSpreadsheet} onClick={() => setImportOpen(true)}>
            Importar Excel
          </Button>
          <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => refetch()}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* ── Buscador + filtros ── */}
      {products.length > 0 && (
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar productos"
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
            />
            {search && (
              <button type="button" className={styles.searchClear} onClick={() => setSearch("")} aria-label="Limpiar búsqueda">
                <X size={16} aria-hidden="true" />
              </button>
            )}
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
            <Button size="sm" variant="ghost" onClick={clearFilters}>Limpiar filtros</Button>
          )}
        </div>
      )}

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aún no tienes productos"
          description="Agrega tu primer producto con el formulario de arriba o importa varios desde Excel."
          action={
            <div className={styles.emptyActions}>
              <Button icon={Plus} onClick={focusProductForm}>Crear producto</Button>
              <Button variant="secondary" icon={FileSpreadsheet} onClick={() => setImportOpen(true)}>Importar Excel</Button>
            </div>
          }
        />
      ) : visibleProducts.length === 0 ? (
        <EmptyState
          compact
          icon={SearchX}
          title="Sin resultados"
          description="No hay productos que coincidan con la búsqueda o los filtros."
          action={<Button variant="secondary" onClick={clearFilters}>Limpiar filtros</Button>}
        />
      ) : (
        <div className={styles.grid}>
          {visibleProducts.map((p) => {
            const img = p.imagesUrl?.[0]?.image || p.imagesUrl?.[0];
            return (
              <article key={p.product_id} className={styles.productCard}>
                <div className={styles.productThumb}>
                  {img ? <img src={img} alt={p.name} loading="lazy" decoding="async" /> : <ImageIcon size={28} aria-hidden="true" />}
                  {p.is_available !== "available" && <span className={styles.soldOut}>Agotado</span>}
                  {p.is_customizable && <span className={styles.customBadge}>Personalizable</span>}
                </div>
                <div className={styles.productBody}>
                  <h3>{p.name}</h3>
                  <span className={styles.productCat}>{categoryName(p.category_id)}</span>
                  <span className={styles.productPrice}>{curSymbol(p.currency)} {formatted(p.price)}</span>
                  {p.is_customizable && p.variants?.length > 0 && <span className={styles.variantCount}>{p.variants.length} variante(s)</span>}
                  {p.allow_comment && <span className={`${styles.variantCount} ${styles.iconText}`}><PenLine size={14} aria-hidden="true" /> Acepta personalización</span>}
                  {(p.locality_config || []).length > 0 && (
                    <span className={`${styles.deliveryBadge} ${styles.iconText}`}>
                      {p.locality_config.some(c => c.delivery) && <><Bike size={14} aria-hidden="true" /> A domicilio</>}
                      {p.locality_config.some(c => c.takeout) && <><Store size={14} aria-hidden="true" /> Recoger en tienda</>}
                    </span>
                  )}
                </div>
                <div className={styles.productActions}>
                  <IconButton icon={Eye} variant="outline" label={`Ver ${p.name}`} onClick={() => setViewing(p)} />
                  <IconButton icon={Pencil} variant="outline" label={`Editar ${p.name}`} onClick={() => handleEdit(p)} />
                  <IconButton icon={Trash2} variant="danger" label={`Eliminar ${p.name}`} onClick={() => setToDelete(p)} />
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Eliminar producto"
        size="sm"
        dismissible={!deleteMutation.isPending}
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)} disabled={deleteMutation.isPending}>Cancelar</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(toDelete.product_id)}>
              {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </>
        }
      >
        <p className={styles.modalText}>¿Seguro que deseas eliminar <strong>{toDelete?.name}</strong>?</p>
      </Modal>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.name}
        footer={<Button variant="secondary" onClick={() => setViewing(null)}>Cerrar</Button>}
      >
        {viewing && (<>
            <div className={styles.detailGallery}>{(viewing.imagesUrl || []).map((i, idx) => <img key={idx} src={i.image || i} alt="" />)}</div>
            <ul className={styles.detailList}>
              <li><span>Precio base</span><strong>{curSymbol(viewing.currency)} {formatted(viewing.price)}</strong></li>
              <li><span>Categoría</span><strong>{categoryName(viewing.category_id)}</strong></li>
              {!viewing.is_customizable && <li><span>Cantidad</span><strong>{viewing.quantity}</strong></li>}
              <li><span>Estado</span><strong>{viewing.is_available === "available" ? "Disponible" : "Agotado"}</strong></li>
              <li><span>Localidades</span><strong>{viewing.localities?.length ? viewing.localities.join(", ") : "Todas"}</strong></li>
              {(viewing.locality_config || []).length > 0 && (
                <li className={styles.detailStacked}>
                  <span>Entrega por localidad</span>
                  <div className={styles.detailLocalities}>
                    {viewing.locality_config.map((cfg) => (
                      <span key={cfg.locality} className={styles.detailLocality}>
                        <strong>{cfg.locality}:</strong>
                        {cfg.delivery && (
                          <span className={styles.iconText}>
                            <Bike size={14} aria-hidden="true" /> A domicilio{cfg.delivery_price > 0 ? ` (+${curSymbol(viewing.currency)}${formatted(cfg.delivery_price)})` : " (gratis)"}
                          </span>
                        )}
                        {cfg.takeout && (
                          <span className={styles.iconText}><Store size={14} aria-hidden="true" /> Recoger en tienda</span>
                        )}
                      </span>
                    ))}
                  </div>
                </li>
              )}
              {viewing.allow_comment && <li><span>Personalización</span><strong>{viewing.comment_required ? "Obligatoria" : "Opcional"}{viewing.comment_label ? `: "${viewing.comment_label}"` : ""}</strong></li>}
              {viewing.min_age_allow && <li><span>Edad mínima</span><strong>{viewing.min_age} años</strong></li>}
              {viewing.terms && <li><span>Términos</span><strong>{viewing.terms}</strong></li>}
            </ul>
        </>)}
      </Modal>
      <Modal
        open={importOpen}
        onClose={resetImport}
        size="lg"
        dismissible={importStep !== "importing"}
        title={
          importStep === "preview" ? `Vista previa: ${importRows.length} filas detectadas`
            : importStep === "importing" ? "Importando productos"
              : importStep === "done" ? "Importación completada"
                : "Importar productos desde Excel"
        }
      >

            {/* ── Step: upload ── */}
            {importStep === "upload" && (
              <>
                <p className={styles.importNote}>
                  Sube un archivo <strong>.xlsx</strong>, <strong>.xls</strong> o <strong>.csv</strong>.
                  Todos los productos se importarán como <strong>inactivos</strong> hasta que les agregues imágenes.
                </p>

                <label className={styles.dropZone}>
                  <UploadCloud size={32} className={styles.dropIcon} aria-hidden="true" />
                  <span className={styles.dropTitle}>Arrastra tu archivo aquí</span>
                  <span className={styles.dropSub}>o haz clic para seleccionar</span>
                  <input
                    type="file" className={styles.visuallyHidden}
                    accept=".xlsx,.xls,.csv"
                    onChange={e => handleImportFile(e.target.files?.[0])}
                  />
                </label>

                <div className={styles.importActions}>
                  <Button variant="secondary" onClick={resetImport}>Cancelar</Button>
                  <Button variant="secondary" icon={Download} onClick={downloadTemplate}>
                    Descargar plantilla
                  </Button>
                </div>
              </>
            )}

            {/* ── Step: preview ── */}
            {importStep === "preview" && (
              <>
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
                          { value: "", label: "Sin mapear" },
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
                  <Button variant="secondary" icon={ArrowLeft} onClick={() => setImportStep("upload")}>Volver</Button>
                  <Button
                    icon={FileSpreadsheet}
                    disabled={!importMapping.name}
                    onClick={() => importMutation.mutate()}
                  >
                    Importar {importRows.length} productos
                  </Button>
                </div>
              </>
            )}

            {/* ── Step: importing ── */}
            {importStep === "importing" && (
              <div className={styles.importingState} role="status">
                <div className={styles.importSpinner} aria-hidden="true" />
                <p>Importando productos...</p>
                <span className={styles.importNote}>No cierres esta ventana.</span>
              </div>
            )}

            {/* ── Step: done ── */}
            {importStep === "done" && importResult && (
              <>
                <div className={styles.importSummary}>
                  <div className={`${styles.summaryItem} ${styles.summarySuccess}`}>
                    <strong>{importResult.created}</strong>
                    <span>Importados</span>
                  </div>
                  <div className={`${styles.summaryItem} ${importResult.error_count > 0 ? styles.summaryError : styles.summaryNeutral}`}>
                    <strong>{importResult.error_count}</strong>
                    <span>Errores</span>
                  </div>
                </div>

                <div className={styles.importAlert}>
                  <Camera size={18} className={styles.importAlertIcon} aria-hidden="true" />
                  <p>
                    <strong>Todos los productos fueron importados como inactivos.</strong><br />
                    Ve a <strong>Productos</strong>, edita cada uno, agrega una foto y actívalo para que aparezca en tu catálogo.
                  </p>
                </div>

                {importResult.errors?.length > 0 && (
                  <div className={styles.errorList}>
                    <p className={styles.errorListTitle}>Filas con error:</p>
                    {importResult.errors.map((e, i) => (
                      <div key={i} className={styles.errorItem}>
                        <span>Fila {e.row}: {e.name}</span>
                        <span>{e.error}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.importActions}>
                  <Button onClick={resetImport}>Cerrar</Button>
                </div>
              </>
            )}
      </Modal>
      </TabPanel>
    </div>
  );
};

export default Products;