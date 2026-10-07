import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutTemplate, Palette, MapPin, Store, Bell, Smartphone, Tablet, Monitor, FileText, Type, Image as ImageIcon, Clock, Receipt, AlertTriangle, CalendarClock, BarChart3, Check, CheckCircle2, X } from "lucide-react";
import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import CatalogManager from "../../../components/CatalogTemplates/CatalogManager";
import DevicePreviewFrame from "../../../components/UI/DevicePreviewFrame";
import Select from "../../../components/Select";
import { PageHeader, Button, Tabs, TabPanel, SkeletonForm } from "../../../components/admin";
import styles from "./Business.module.css";
import { PREDEFINED_PALETTES, PREDEFINED_TEMPLATES, PALETTE_FIELDS } from "../../../constants/themePalettes";
import { FONT_OPTIONS, SCALE_OPTIONS, LOGO_SCALE_OPTIONS, getFont, TEXT_SIZE_MODE_OPTIONS } from "../../../constants/catalogFonts";
import { loadCatalogFonts } from "../../../helpers/fontLoader";
import FontManager from "../../../components/CatalogTemplates/FontManager";
import { customFontOptions, resolveFontFamily, loadCustomFonts, isCustomKey, customIdFromKey, fontMime } from "../../../helpers/customFonts";
import BusinessHoursSettings from "../../../components/BusinessHours/BusinessHoursSetting";
import { defaultBusinessHours } from "../../../helpers/businessHours";
import { fetchBusinessData, saveBusinessData, getPresignedUrl, uploadToS3 } from "../../../services/businessApi";
import { fetchProducts } from "../../../services/productsApi";
import { DEMO_PRODUCTS } from "../../../constants/dummyCatalog";
import { fetchCategories } from "../../../services/categoryApi";

const TABS = [
  { id: "general", label: "General", icon: Store },
  { id: "appearance", label: "Apariencia", icon: Palette },
  { id: "billing", label: "Facturación", icon: FileText },
  { id: "hours", label: "Horario", icon: Clock },
  { id: "notifications", label: "Notificaciones", icon: Bell },
];

const DEVICES = [
  { id: "mobile", label: "Móvil", icon: Smartphone, width: 390 },
  { id: "tablet", label: "Tablet", icon: Tablet, width: 768 },
  { id: "desktop", label: "Escritorio", icon: Monitor, width: "100%" },
];
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/jpg"];

const Business = () => {
  const auth = getTokenInfo();
  const tenantId = auth?.sub;
  const { showError, showSuccess } = useNotification();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("general");
  const [device, setDevice] = useState("desktop");

  const [formData, setFormData] = useState({
    business_id: "", name: "", slug: "", phone: "", description: "",
    logo_url: "", templateId: "default", themeType: "predefined",
    themePalette: PREDEFINED_PALETTES[0].colors, localities: [],
    ga_tracking_id: "",
    meta_pixel_id: "",
    low_stock_threshold: 5,
    delivery_reminder_enabled: false,
    rnc: "",
    ncf_enabled: false,
    itbis_rate: 18,
    ncf_pool: [],
    fontHeading: "default",
    fontBody: "default",
    fontScale: "medium",
    logoScale: "medium",
    custom_fonts: [],
    custom_style: {
      search_color: "", search_size_mode: "theme", search_size_px: "",
      modal_desc_color: "", modal_desc_size_mode: "theme", modal_desc_size_px: "",
    },
    // Horario de atención
    business_hours_enabled: false,
    hours_mode: "inform",
    business_hours: defaultBusinessHours(),
    locality_hours: {},
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [localityInput, setLocalityInput] = useState("");
  const [ncfPrefix, setNcfPrefix] = useState("B01");
  const [ncfFrom, setNcfFrom] = useState("");
  const [ncfTo, setNcfTo] = useState("");
  const [ncfManual, setNcfManual] = useState("");
  const originalThemeRef = useRef(null);


  const { data: businessData, isLoading: isFetching } = useQuery({
    queryKey: ["business", tenantId],
    queryFn: fetchBusinessData,
    enabled: !!tenantId,
  });

  const { data: myProducts = [] } = useQuery({
    queryKey: ["products", tenantId],
    queryFn: fetchProducts,
    enabled: !!tenantId,
    retry: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", tenantId],
    queryFn: fetchCategories,
    enabled: !!tenantId,
    retry: false,
  });

  const hasOwnProducts = (myProducts || []).length > 0;
  const previewProducts = hasOwnProducts ? myProducts : DEMO_PRODUCTS;

  const parsePalette = (p) => {
    if (!p) return null;
    if (typeof p === "string") {
      try { return JSON.parse(p); } catch { return null; }
    }
    return p;
  };

  useEffect(() => {
    if (businessData) {
      const palette = parsePalette(businessData.themePalette) || PREDEFINED_PALETTES[0].colors;
      const themeType = businessData.themeType || "predefined";

      originalThemeRef.current = { themePalette: palette, themeType };

      setFormData((prev) => ({
        ...prev,
        ...businessData,
        templateId: businessData.templateId || prev.templateId,
        themeType,
        themePalette: palette,
        localities: businessData.localities || [],
        fontHeading: businessData.fontHeading || "default",
        fontBody: businessData.fontBody || "default",
        fontScale: businessData.fontScale || "medium",
        logoScale: businessData.logoScale || "medium",
        custom_fonts: businessData.custom_fonts || [],
        custom_style: {
          search_color: "", search_size_mode: "theme", search_size_px: "",
          modal_desc_color: "", modal_desc_size_mode: "theme", modal_desc_size_px: "",
          ...(businessData.custom_style || {}),
        },
        business_hours_enabled: businessData.business_hours_enabled ?? false,
        hours_mode: businessData.hours_mode || "inform",
        business_hours: businessData.business_hours || defaultBusinessHours(),
        locality_hours: businessData.locality_hours || {},
      }));
    }
  }, [businessData]);

  useEffect(() => {
    loadCatalogFonts([formData.fontHeading, formData.fontBody].filter((k) => !isCustomKey(k)));
    loadCustomFonts(formData.custom_fonts);
  }, [formData.fontHeading, formData.fontBody, formData.custom_fonts]);

  const mutation = useMutation({
    mutationFn: (data) => saveBusinessData(tenantId, data),
    onSuccess: () => {
      showSuccess("¡Éxito!", "Configuración guardada correctamente");
      queryClient.invalidateQueries(["business", tenantId]);
      setLogoFile(null);
      setLogoPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return ""; });
    },
    onError: () => showError("Error", "No se pudo guardar la configuración"),
  });

  const selectPalette = (palette) =>
    setFormData((prev) => ({ ...prev, themeType: "predefined", themePalette: palette.colors }));

  const updateColor = (key, value) =>
    setFormData((prev) => ({
      ...prev,
      themeType: "custom",
      themePalette: { ...prev.themePalette, [key]: value },
    }));

  const resetPalette = () => {
    const orig = originalThemeRef.current || {
      themePalette: PREDEFINED_PALETTES[0].colors,
      themeType: "predefined",
    };
    setFormData((prev) => ({ ...prev, ...orig }));
  };

  const isPaletteActive = (palette) =>
    formData.themeType === "predefined" &&
    JSON.stringify(palette.colors) === JSON.stringify(formData.themePalette);

  // Fuentes propias: si se elimina una fuente seleccionada, volvemos a "default".
  const handleCustomFontsChange = (next) => {
    setFormData((p) => {
      const ids = new Set((next || []).map((f) => f.id));
      const stillValid = (key) => !isCustomKey(key) || ids.has(customIdFromKey(key));
      return {
        ...p,
        custom_fonts: next,
        fontHeading: stillValid(p.fontHeading) ? p.fontHeading : "default",
        fontBody: stillValid(p.fontBody) ? p.fontBody : "default",
      };
    });
  };

  const updateCustomStyle = (key, value) =>
    setFormData((p) => ({ ...p, custom_style: { ...p.custom_style, [key]: value } }));

  const addLocality = () => {
    const v = localityInput.trim();
    if (!v) return;
    setFormData((p) => {
      const exists = (p.localities || []).some((l) => l.toLowerCase() === v.toLowerCase());
      return exists ? p : { ...p, localities: [...(p.localities || []), v] };
    });
    setLocalityInput("");
  };
  const removeLocality = (loc) =>
    setFormData((p) => ({ ...p, localities: (p.localities || []).filter((l) => l !== loc) }));

  const ncfPool = formData.ncf_pool || [];
  const ncfAvailable = ncfPool.filter((n) => !n.used).length;
  const ncfUsed = ncfPool.filter((n) => n.used).length;

  const addNcfEntries = (codes) => {
    setFormData((p) => {
      const pool = p.ncf_pool || [];
      const existing = new Set(pool.map((n) => n.ncf));
      const fresh = codes
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c && !existing.has(c))
        .map((ncf) => ({ ncf, used: false, used_in: "", used_date: "" }));
      return { ...p, ncf_pool: [...pool, ...fresh] };
    });
  };

  const addNcfRange = () => {
    const from = parseInt(ncfFrom, 10);
    const to = parseInt(ncfTo, 10);
    const prefix = (ncfPrefix || "").trim().toUpperCase();
    if (!prefix) return showError("Error", "El prefijo del NCF es requerido");
    if (isNaN(from) || isNaN(to) || from > to) return showError("Error", "Rango inválido");
    if (to - from > 1000) return showError("Error", "El rango no puede exceder 1000 NCF a la vez");
    const codes = [];
    for (let i = from; i <= to; i++) codes.push(`${prefix}${String(i).padStart(8, "0")}`);
    addNcfEntries(codes);
    setNcfFrom(""); setNcfTo("");
  };

  const addNcfManual = () => {
    if (!ncfManual.trim()) return;
    const codes = ncfManual.split(/[\n,;]+/);
    addNcfEntries(codes);
    setNcfManual("");
  };

  const removeNcf = (ncf) =>
    setFormData((p) => ({ ...p, ncf_pool: (p.ncf_pool || []).filter((n) => n.ncf !== ncf || n.used) }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      e.target.value = "";
      return showError("Formato no válido", "El logo debe ser PNG o JPG. Convierte tu imagen antes de subirla.");
    }

    setLogoPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
    setLogoFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      setActiveTab("general");
      return showError("Error", "Campos obligatorios faltantes");
    }

    let dataToSave = formData;

    if (logoFile) {
      try {
        setIsLoading(true);
        setLoadingMessage("Subiendo logo...");
        const extension = logoFile.name.substring(logoFile.name.lastIndexOf("."));
        const { uploadUrl, publicUrl } = await getPresignedUrl("logo", extension, logoFile.type);
        await uploadToS3(uploadUrl, logoFile);
        dataToSave = { ...formData, logo_url: publicUrl };
        setFormData(dataToSave);
      } catch {
        setIsLoading(false);
        return showError("Error", "Fallo al subir la imagen");
      } finally {
        setIsLoading(false);
      }
    }

    // Subir fuentes en staging al S3 SOLO ahora (al guardar).
    const hasPendingFonts = (formData.custom_fonts || []).some((f) => f._pending);
    if (hasPendingFonts) {
      try {
        setIsLoading(true);
        setLoadingMessage("Subiendo fuentes...");
        const uploaded = [];
        for (const f of (dataToSave.custom_fonts || [])) {
          if (f._pending && f._file) {
            const mime = fontMime(f.ext);
            // Forzamos el type para que el Content-Type calce con el presign
            const typed = new File([f._file], `font${f.ext}`, { type: mime });
            const { uploadUrl, publicUrl } = await getPresignedUrl(`font_${f.id}`, f.ext, mime);
            await uploadToS3(uploadUrl, typed);
            if (f.url && f.url.startsWith("blob:")) URL.revokeObjectURL(f.url);
            const { _pending, _file, _localUrl, ...clean } = f; // eslint-disable-line no-unused-vars
            uploaded.push({ ...clean, url: publicUrl });
          } else {
            const { _pending, _file, _localUrl, ...clean } = f; // eslint-disable-line no-unused-vars
            uploaded.push(clean);
          }
        }
        dataToSave = { ...dataToSave, custom_fonts: uploaded };
        setFormData(dataToSave);
      } catch {
        setIsLoading(false);
        return showError("Error", "Fallo al subir las fuentes");
      } finally {
        setIsLoading(false);
      }
    }

    mutation.mutate(dataToSave);
  };

  if (isFetching) {
    return (
      <div className={styles.businessContainer}>
        <PageHeader title="Configuración" />
        <Tabs idPrefix="business" label="Secciones de configuración" items={TABS} value={activeTab} onChange={setActiveTab} />
        <SkeletonForm fields={5} label="Cargando configuración..." />
      </div>
    );
  }

  const saving = isLoading || mutation.isPending;

  // Familias CSS resueltas (integradas o subidas) para el mini-preview
  const builtinFamily = (key) => getFont(key).family;
  const headingFamily = resolveFontFamily(formData.fontHeading, formData.custom_fonts, builtinFamily);
  const bodyFamily = resolveFontFamily(formData.fontBody, formData.custom_fonts, builtinFamily);

  // Opciones de los selectores = integradas + fuentes propias del negocio
  const fontSelectOptions = [...FONT_OPTIONS, ...customFontOptions(formData.custom_fonts)];

  return (
    <div className={styles.businessContainer}>
      <PageHeader title="Configuración" description="Datos de tu negocio, apariencia del catálogo, facturación, horario y avisos." />

      <Tabs idPrefix="business" label="Secciones de configuración" items={TABS} value={activeTab} onChange={setActiveTab} />

      <form onSubmit={handleSubmit}>
        <TabPanel idPrefix="business" id="general" value={activeTab} className={styles.tabPanel}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Información General</h2>
              <p className={styles.requiredNote}>
                Los campos marcados con <span className={styles.required}>*</span> son obligatorios.
              </p>

              <div className={styles.formGroup}>
                <label htmlFor="biz-name">Nombre del negocio<span className={styles.required}>*</span></label>
                <input id="biz-name" className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej. Mi Tienda Increíble" />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="biz-slug">Enlace del catálogo (https://qatalo.online/catalog/<span className={styles.slugPart}>{formData.slug || '---'}</span>)<span className={styles.required}>*</span></label>
                <input id="biz-slug" className="input" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="mi-tienda" />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="biz-phone">Teléfono de contacto<span className={styles.required}>*</span></label>
                <input id="biz-phone" className="input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 234 567 8900" />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="biz-description">Descripción</label>
                <textarea id="biz-description" className="input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Cuéntale a tus clientes de qué trata tu negocio..." rows="4"></textarea>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="biz-logo">Logo del negocio</label>
                <div className={styles.fileUploadWrapper}>
                  <input id="biz-logo" type="file" onChange={handleFileChange} accept="image/png,image/jpeg" />
                </div>
                {(logoPreview || formData.logo_url) && (
                  <div className={styles.logoPreviewRow}>
                    <img
                      src={logoPreview || formData.logo_url}
                      alt="Logo actual"
                      className={styles.logoPreview}
                    />
                    {logoFile && (
                      <span className={styles.pendingNote}>
                        Nuevo logo. Se subirá al guardar.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}><MapPin size={20} aria-hidden="true" /> Localidades de disponibilidad</h2>
              <p className={styles.sectionDesc}>
                Define las localidades donde entregas. Luego asignas a cada producto en cuáles está disponible
                (si un producto no tiene ninguna asignada, estará disponible en todas).
              </p>
              <div className={styles.inlineAdd}>
                <label htmlFor="biz-locality" className={styles.srOnly}>Nueva localidad</label>
                <input
                  id="biz-locality"
                  className={`input ${styles.inlineAddInput}`}
                  value={localityInput}
                  onChange={(e) => setLocalityInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLocality(); } }}
                  placeholder="Ej. Santo Domingo"
                />
                <Button variant="secondary" onClick={addLocality}>Agregar</Button>
              </div>
              {(formData.localities || []).length > 0 && (
                <div className={styles.chipList}>
                  {formData.localities.map((loc) => (
                    <span key={loc} className={styles.chip}>
                      {loc}
                      <button type="button" className={styles.chipRemove} onClick={() => removeLocality(loc)} aria-label={`Quitar ${loc}`} title={`Quitar ${loc}`}><X size={16} aria-hidden="true" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
        </TabPanel>

        <TabPanel idPrefix="business" id="appearance" value={activeTab} className={styles.tabPanel}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle} id="biz-template-label"><LayoutTemplate size={20} aria-hidden="true" /> Estilo</h2>
              <div className={styles.templateGrid} role="group" aria-labelledby="biz-template-label">
                {PREDEFINED_TEMPLATES.map((tpl) => (
                  <button
                    type="button"
                    key={tpl.id}
                    aria-pressed={formData.templateId === tpl.id}
                    className={`${styles.templateCard} ${formData.templateId === tpl.id ? styles.selected : ""}`}
                    onClick={() => setFormData({ ...formData, templateId: tpl.id })}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitleRow}>
                <h2 className={styles.sectionTitle}><Palette size={20} aria-hidden="true" /> Colores</h2>
                <Button variant="ghost" size="sm" onClick={resetPalette}>
                  Restaurar tema guardado
                </Button>
              </div>

              <div className={styles.themeTypeToggle} role="group" aria-label="Tipo de paleta">
                <button
                  type="button"
                  aria-pressed={formData.themeType === "predefined"}
                  className={`${styles.toggleBtn} ${formData.themeType === "predefined" ? styles.toggleBtnActive : ""}`}
                  onClick={() => setFormData((p) => ({ ...p, themeType: "predefined" }))}
                >
                  Paleta predefinida
                </button>
                <button
                  type="button"
                  aria-pressed={formData.themeType === "custom"}
                  className={`${styles.toggleBtn} ${formData.themeType === "custom" ? styles.toggleBtnActive : ""}`}
                  onClick={() => setFormData((p) => ({ ...p, themeType: "custom" }))}
                >
                  Personalizado
                </button>
              </div>

              {formData.themeType === "predefined" ? (
                <div className={styles.paletteGrid}>
                  {PREDEFINED_PALETTES.map((palette) => (
                    <button
                      type="button"
                      key={palette.id}
                      aria-pressed={isPaletteActive(palette)}
                      className={`${styles.paletteCard} ${isPaletteActive(palette) ? styles.paletteCardSelected : ""}`}
                      onClick={() => selectPalette(palette)}
                    >
                      <span className={styles.paletteSwatches} aria-hidden="true">
                        {Object.values(palette.colors).map((c, i) => (
                          <span key={i} className={styles.swatch} style={{ backgroundColor: c }} />
                        ))}
                      </span>
                      <span className={styles.paletteName}>{palette.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.customColors}>
                  {PALETTE_FIELDS.map(({ key, label }) => (
                    <div key={key} className={styles.colorRow}>
                      <label htmlFor={`biz-color-${key}`}>{label}</label>
                      <div className={styles.colorInputs}>
                        <input
                          type="color"
                          aria-label={`${label}: selector de color`}
                          value={formData.themePalette?.[key] || "#000000"}
                          onChange={(e) => updateColor(key, e.target.value)}
                        />
                        <input
                          id={`biz-color-${key}`}
                          className="input"
                          value={formData.themePalette?.[key] || ""}
                          onChange={(e) => updateColor(key, e.target.value)}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}><Type size={20} aria-hidden="true" /> Tipografía</h2>
              <p className={styles.sectionDesc}>
                Elige las fuentes de tu catálogo. Deja "Predeterminada del tema" para usar la tipografía
                que trae la plantilla.
              </p>

              <div className={styles.formRow}>
                <div className={styles.formGroup} role="group" aria-labelledby="biz-font-heading">
                  <span id="biz-font-heading" className={styles.label}>Fuente de títulos</span>
                  <Select
                    value={formData.fontHeading}
                    onChange={(v) => setFormData((p) => ({ ...p, fontHeading: v }))}
                    options={fontSelectOptions}
                    placeholder="Seleccionar fuente"
                  />
                </div>
                <div className={styles.formGroup} role="group" aria-labelledby="biz-font-body">
                  <span id="biz-font-body" className={styles.label}>Fuente del texto</span>
                  <Select
                    value={formData.fontBody}
                    onChange={(v) => setFormData({ ...formData, fontBody: v })}
                    options={fontSelectOptions}
                    placeholder="Seleccionar fuente"
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.narrow}`} role="group" aria-labelledby="biz-font-scale">
                  <span id="biz-font-scale" className={styles.label}>Tamaño de fuente</span>
                  <Select
                    value={formData.fontScale}
                    onChange={(v) => setFormData((p) => ({ ...p, fontScale: v }))}
                    options={SCALE_OPTIONS}
                    placeholder="Tamaño"
                    searchable={false}
                  />
                </div>
              </div>

              <div className={styles.fontPreviewCard}>
                <div className={styles.fontPreviewHeading} style={{ fontFamily: headingFamily || "inherit" }}>
                  Nombre de tu producto
                </div>
                <div className={styles.fontPreviewBody} style={{ fontFamily: bodyFamily || "inherit" }}>
                  Así se verá la descripción de tus productos y el texto del catálogo. Una buena
                  combinación de fuentes le da personalidad a tu tienda.
                </div>
              </div>

              <FontManager
                customFonts={formData.custom_fonts}
                onChange={handleCustomFontsChange}
              />
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}><ImageIcon size={20} aria-hidden="true" /> Logo</h2>
              <p className={styles.sectionDesc}>
                Ajusta el tamaño con el que se muestra tu logo en el catálogo. Puedes ver el
                resultado en la previsualización de abajo.
              </p>
              <div className={`${styles.formGroup} ${styles.narrow}`} role="group" aria-labelledby="biz-logo-scale">
                <span id="biz-logo-scale" className={styles.label}>Tamaño del logo</span>
                <Select
                  value={formData.logoScale}
                  onChange={(v) => setFormData((p) => ({ ...p, logoScale: v }))}
                  options={LOGO_SCALE_OPTIONS}
                  placeholder="Tamaño"
                  searchable={false}
                />
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}><Type size={20} aria-hidden="true" /> Buscador y descripción del producto</h2>
              <p className={styles.sectionDesc}>
                Personaliza el color y tamaño del texto del buscador y de la descripción que se muestra
                al abrir un producto. Si no configuras nada, se usa el estilo normal del tema.
              </p>

              {[
                { prefix: "search", title: "Texto del buscador" },
                { prefix: "modal_desc", title: "Descripción dentro del modal de producto" },
              ].map(({ prefix, title }) => {
                const colorKey = `${prefix}_color`;
                const modeKey = `${prefix}_size_mode`;
                const pxKey = `${prefix}_size_px`;
                const cs = formData.custom_style || {};
                return (
                  <div key={prefix} className={styles.subBlock}>
                    <h3 className={styles.subTitle}>{title}</h3>
                    <div className={styles.formRow}>
                      <div className={`${styles.formGroup} ${styles.narrowWide}`}>
                        <label htmlFor={`biz-${prefix}-color`}>Color (opcional)</label>
                        <div className={styles.colorInputs}>
                          <input
                            type="color"
                            aria-label={`${title}: selector de color`}
                            value={cs[colorKey] || "#000000"}
                            onChange={(e) => updateCustomStyle(colorKey, e.target.value)}
                          />
                          <input
                            id={`biz-${prefix}-color`}
                            className="input"
                            value={cs[colorKey] || ""}
                            onChange={(e) => updateCustomStyle(colorKey, e.target.value)}
                            placeholder="Igual que el tema"
                          />
                          {cs[colorKey] && (
                            <Button variant="ghost" size="sm" onClick={() => updateCustomStyle(colorKey, "")}>
                              Quitar
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className={`${styles.formGroup} ${styles.narrow}`} role="group" aria-labelledby={`biz-${prefix}-size`}>
                        <span id={`biz-${prefix}-size`} className={styles.label}>Tamaño</span>
                        <Select
                          value={cs[modeKey] || "theme"}
                          onChange={(v) => updateCustomStyle(modeKey, v)}
                          options={TEXT_SIZE_MODE_OPTIONS}
                          searchable={false}
                        />
                      </div>
                      {cs[modeKey] === "custom" && (
                        <div className={`${styles.formGroup} ${styles.narrowSm}`}>
                          <label htmlFor={`biz-${prefix}-px`}>Tamaño en px</label>
                          <input
                            id={`biz-${prefix}-px`}
                            type="number"
                            min="10"
                            max="40"
                            className="input"
                            value={cs[pxKey] || ""}
                            onChange={(e) => updateCustomStyle(pxKey, e.target.value)}
                            placeholder="16"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.previewSection}>
              <div className={styles.previewHeader}>
                <h2 className={styles.sectionTitle}>Previsualización en tiempo real</h2>
                <div className={styles.deviceToggle} role="group" aria-label="Dispositivo de la previsualización">
                  {DEVICES.map((d) => {
                    const Icon = d.icon;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        className={`${styles.deviceBtn} ${device === d.id ? styles.deviceBtnActive : ""}`}
                        onClick={() => setDevice(d.id)}
                        title={`Ver en ${d.label}`}
                        aria-pressed={device === d.id}
                      >
                        <Icon size={18} aria-hidden="true" /> <span className={styles.deviceBtnLabel}>{d.label}</span>
                        <span className={styles.srOnly}>{` (ver en ${d.label})`}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {!hasOwnProducts && (
                <p className={styles.demoNotice}>
                  <Palette size={16} aria-hidden="true" /> Mostrando productos de ejemplo. Cuando agregues tus propios productos,
                  aparecerán aquí automáticamente.
                </p>
              )}

              <div className={`${styles.previewStage} ${device !== "desktop" ? styles.previewStageDevice : ""}`}>
                <div
                  className={device !== "desktop" ? styles.deviceFrame : undefined}
                  style={device !== "desktop" ? { width: DEVICES.find((d) => d.id === device).width } : { width: "100%" }}
                >
                  <DevicePreviewFrame
                    width={DEVICES.find((d) => d.id === device).width}
                    height={device === "mobile" ? 700 : device === "tablet" ? 760 : 720}
                  >
                    <CatalogManager businessData={{ ...formData, logo_url: logoPreview || formData.logo_url }} products={previewProducts} isPreview categories={categories} />
                  </DevicePreviewFrame>
                </div>
              </div>
            </div>
        </TabPanel>

        <TabPanel idPrefix="business" id="hours" value={activeTab} className={styles.tabPanel}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}><Clock size={20} aria-hidden="true" /> Horario de atención</h2>
              <p className={styles.sectionDesc}>
                Define cuándo tu negocio recibe pedidos. Se calcula con la hora de República Dominicana.
              </p>
              <BusinessHoursSettings
                business={formData}
                localities={formData.localities}
                onChange={(patch) => setFormData((p) => ({ ...p, ...patch }))}
              />
            </div>
        </TabPanel>

        <TabPanel idPrefix="business" id="billing" value={activeTab} className={styles.tabPanel}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}><Receipt size={20} aria-hidden="true" /> Datos fiscales</h2>
              <p className={styles.sectionDesc}>
                Estos datos aparecerán en las facturas y recibos que emitas a tus clientes.
              </p>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="biz-rnc">RNC del negocio (opcional)</label>
                  <input
                    id="biz-rnc"
                    className="input"
                    value={formData.rnc}
                    onChange={(e) => setFormData({ ...formData, rnc: e.target.value.trim() })}
                    placeholder="1-31-XXXXX-X"
                  />
                  <span className={styles.hint}>Si lo configuras, aparecerá en el encabezado del comprobante.</span>
                </div>
                <div className={`${styles.formGroup} ${styles.narrow}`}>
                  <label htmlFor="biz-itbis">Tasa de ITBIS (%)</label>
                  <input
                    id="biz-itbis"
                    type="number"
                    min="0"
                    max="100"
                    className="input"
                    value={formData.itbis_rate}
                    onChange={(e) => setFormData({ ...formData, itbis_rate: e.target.value })}
                    placeholder="18"
                  />
                  <span className={styles.hint}>En RD el estándar es 18%.</span>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}><FileText size={20} aria-hidden="true" /> Comprobantes fiscales (NCF)</h2>
              <p className={styles.sectionDesc}>
                Activa los NCF para poder emitir <strong>facturas con valor fiscal</strong>. Si está desactivado,
                solo podrás emitir <strong>recibos de pago</strong> simples.
              </p>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  role="switch"
                  checked={formData.ncf_enabled}
                  onChange={(e) => setFormData({ ...formData, ncf_enabled: e.target.checked })}
                />
                <span>Emitir facturas con NCF</span>
              </label>

              {formData.ncf_enabled && (
                <div className={styles.ncfSection}>
                  <div className={styles.ncfStats}>
                    <div className={styles.ncfStat}>
                      <strong>{ncfAvailable}</strong>
                      <span>Disponibles</span>
                    </div>
                    <div className={`${styles.ncfStat} ${styles.ncfStatMuted}`}>
                      <strong>{ncfUsed}</strong>
                      <span>Usados</span>
                    </div>
                  </div>
                  {ncfAvailable === 0 && (
                    <p className={styles.ncfWarning} role="status">
                      <AlertTriangle size={16} aria-hidden="true" /> No tienes NCF disponibles. Carga una secuencia para poder emitir facturas.
                    </p>
                  )}

                  <div className={styles.ncfLoader}>
                    <span className={styles.ncfLoaderTitle}>Cargar secuencia por rango</span>
                    <div className={styles.ncfRangeRow}>
                      <div className={styles.ncfField}>
                        <label htmlFor="biz-ncf-prefix">Prefijo</label>
                        <input id="biz-ncf-prefix" className="input" value={ncfPrefix} onChange={(e) => setNcfPrefix(e.target.value.toUpperCase())} placeholder="B01" />
                      </div>
                      <div className={styles.ncfField}>
                        <label htmlFor="biz-ncf-from">Desde</label>
                        <input id="biz-ncf-from" type="number" min="1" className="input" value={ncfFrom} onChange={(e) => setNcfFrom(e.target.value)} placeholder="1" />
                      </div>
                      <div className={styles.ncfField}>
                        <label htmlFor="biz-ncf-to">Hasta</label>
                        <input id="biz-ncf-to" type="number" min="1" className="input" value={ncfTo} onChange={(e) => setNcfTo(e.target.value)} placeholder="50" />
                      </div>
                      <Button variant="secondary" onClick={addNcfRange}>Generar</Button>
                    </div>
                    <span className={styles.hint}>
                      Ej: prefijo <strong>B01</strong>, desde <strong>1</strong> hasta <strong>50</strong> → genera B0100000001 … B0100000050.
                    </span>
                  </div>

                  <div className={styles.ncfLoader}>
                    <label htmlFor="biz-ncf-manual" className={styles.ncfLoaderTitle}>O pega una lista manual</label>
                    <textarea
                      id="biz-ncf-manual"
                      className="input"
                      rows={3}
                      value={ncfManual}
                      onChange={(e) => setNcfManual(e.target.value)}
                      placeholder="Un NCF por línea o separados por coma&#10;B0100000001&#10;B0100000002"
                    />
                    <div className={styles.ncfManualActions}>
                      <Button variant="secondary" onClick={addNcfManual}>
                        Agregar lista
                      </Button>
                    </div>
                  </div>

                  {ncfPool.length > 0 && (
                    <div className={styles.ncfList}>
                      <span className={styles.ncfLoaderTitle}>NCF cargados ({ncfPool.length})</span>
                      <div className={styles.ncfChips}>
                        {ncfPool.map((n) => (
                          <span key={n.ncf} className={`${styles.ncfChip} ${n.used ? styles.ncfChipUsed : ""}`}>
                            {n.ncf}
                            {n.used ? (
                              <span className={styles.ncfUsedTag}>usado</span>
                            ) : (
                              <button type="button" className={styles.chipRemove} onClick={() => removeNcf(n.ncf)} aria-label={`Quitar ${n.ncf}`} title={`Quitar ${n.ncf}`}><X size={14} aria-hidden="true" /></button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
        </TabPanel>

        <TabPanel idPrefix="business" id="notifications" value={activeTab} className={styles.tabPanel}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}><Bell size={20} aria-hidden="true" /> Alertas de inventario</h2>
              <p className={styles.sectionDesc}>
                Recibirás un correo de Qatalo cuando el stock de cualquier producto caiga por debajo de este número.
                Puedes ajustarlo individualmente por producto. Pon <strong>0</strong> para desactivar las alertas.
              </p>
              <div className={`${styles.formGroup} ${styles.narrowWide}`}>
                <label htmlFor="biz-low-stock">Umbral global de stock bajo (unidades)</label>
                <input
                  id="biz-low-stock"
                  type="number"
                  min="0"
                  className="input"
                  value={formData.low_stock_threshold}
                  onChange={e => setFormData({ ...formData, low_stock_threshold: e.target.value.trim() })}
                  placeholder="5"
                />
                <span className={styles.hint}>
                  {Number(formData.low_stock_threshold) === 0
                    ? "Alertas desactivadas para todos los productos"
                    : `Recibirás alerta cuando queden ≤ ${formData.low_stock_threshold} unidades`}
                </span>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}><CalendarClock size={20} aria-hidden="true" /> Recordatorio de entregas</h2>
              <p className={styles.sectionDesc}>
                Recibirás un correo cada mañana con el resumen de todas las órdenes
                aprobadas que tienen fecha de entrega ese día.
              </p>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  role="switch"
                  checked={formData.delivery_reminder_enabled}
                  onChange={e => setFormData({ ...formData, delivery_reminder_enabled: e.target.checked })}
                />
                <span>Activar recordatorio diario de entregas</span>
              </label>
              {formData.delivery_reminder_enabled && (
                <p className={`${styles.hint} ${styles.hintOk}`}>
                  <Check size={14} aria-hidden="true" /> Te avisaremos cada día a las 8:00 AM si tienes entregas programadas.
                </p>
              )}
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}><BarChart3 size={20} aria-hidden="true" /> Marketing y analítica</h2>
              <p className={styles.sectionDesc}>
                Conecta tu catálogo con tus herramientas de análisis para medir visitas,
                productos vistos y ventas. Las IDs son visibles públicamente en el código de tu catálogo.
              </p>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="biz-ga">
                    Google Analytics 4 (GA4)
                  </label>
                  <input
                    id="biz-ga"
                    className="input"
                    value={formData.ga_tracking_id}
                    onChange={(e) => setFormData({ ...formData, ga_tracking_id: e.target.value.trim() })}
                    placeholder="G-XXXXXXXXXX"
                    maxLength={20}
                  />
                  <span className={styles.hint}>
                    Encuéntrala en{" "}
                    <a href="https://analytics.google.com" target="_blank" rel="noreferrer">
                      analytics.google.com
                    </a>{" "}
                    → Administrar → Flujos de datos
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="biz-meta">
                    Meta Pixel (Facebook / Instagram)
                  </label>
                  <input
                    id="biz-meta"
                    className="input"
                    value={formData.meta_pixel_id}
                    onChange={(e) => setFormData({ ...formData, meta_pixel_id: e.target.value.trim() })}
                    placeholder="123456789012345"
                    maxLength={20}
                  />
                  <span className={styles.hint}>
                    Encuéntrala en{" "}
                    <a href="https://business.facebook.com/events_manager" target="_blank" rel="noreferrer">
                      Meta Events Manager
                    </a>{" "}
                    → Fuentes de datos
                  </span>
                </div>
              </div>

              {(formData.ga_tracking_id || formData.meta_pixel_id) && (
                <div className={styles.trackingActive} role="status">
                  <CheckCircle2 size={16} aria-hidden="true" /> Seguimiento activo:
                  {formData.ga_tracking_id && <span>GA4 ({formData.ga_tracking_id})</span>}
                  {formData.meta_pixel_id && <span>Meta Pixel ({formData.meta_pixel_id})</span>}
                </div>
              )}
            </div>
        </TabPanel>

        <div className={styles.saveBar}>
          <Button type="submit" loading={saving}>
            {isLoading ? loadingMessage : mutation.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Business;