import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TbLayoutDashboard, TbPalette, TbMapPin, TbBuildingStore, TbBell, TbDeviceMobile, TbDeviceTablet, TbDeviceDesktop, TbFileInvoice } from "react-icons/tb";
import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import Loading from "../../../components/UI/Loading";
import PrimaryButton from "../../../components/PrimaryButton";
import CatalogManager from "../../../components/CatalogTemplates/CatalogManager";
import DevicePreviewFrame from "../../../components/UI/DevicePreviewFrame";
import adminStyles from "../AdminDashboard.module.css";
import styles from "./Business.module.css";
import { PREDEFINED_PALETTES, PREDEFINED_TEMPLATES, PALETTE_FIELDS } from "../../../constants/themePalettes";
import { fetchBusinessData, saveBusinessData, getPresignedUrl, uploadToS3 } from "../../../services/businessApi";
import { fetchProducts } from "../../../services/productsApi";
import { DEMO_PRODUCTS } from "../../../constants/dummyCatalog";

const TABS = [
  { id: "general", label: "General", icon: TbBuildingStore },
  { id: "appearance", label: "Apariencia", icon: TbPalette },
  { id: "billing", label: "Facturación", icon: TbFileInvoice },
  { id: "notifications", label: "Notificaciones", icon: TbBell },
];

const DEVICES = [
  { id: "mobile", label: "Móvil", icon: TbDeviceMobile, width: 390 },
  { id: "tablet", label: "Tablet", icon: TbDeviceTablet, width: 768 },
  { id: "desktop", label: "Desktop", icon: TbDeviceDesktop, width: "100%" },
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
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
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

  // Si el negocio tiene productos, el preview los usa; si no, muestra data demo.
  const hasOwnProducts = (myProducts || []).length > 0;
  const previewProducts = hasOwnProducts ? myProducts : DEMO_PRODUCTS;

  // Merge defensivo: si el backend no trae tema, conservamos los defaults
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
      }));
    }
  }, [businessData]);

  const mutation = useMutation({
    mutationFn: (data) => saveBusinessData(tenantId, data),
    onSuccess: () => {
      showSuccess("¡Éxito!", "Configuración guardada correctamente");
      queryClient.invalidateQueries(["business", tenantId]);
    },
    onError: () => showError("Error", "No se pudo guardar la configuración"),
  });

  // --- Helpers de tema ---
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

  // --- Helpers de localidades ---
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

  // --- Helpers de NCF ---
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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      return showError("Formato no válido", "El logo debe ser PNG o JPG. Convierte tu imagen antes de subirla.");
    }

    try {
      setIsLoading(true);
      setLoadingMessage("Subiendo logo...");
      const extension = file.name.substring(file.name.lastIndexOf("."));
      const { uploadUrl, publicUrl } = await getPresignedUrl("logo", extension, file.type);
      await uploadToS3(uploadUrl, file);
      setFormData((prev) => ({ ...prev, logo_url: publicUrl }));
      showSuccess("Logo actualizado", "Imagen subida correctamente");
    } catch {
      showError("Error", "Fallo al subir la imagen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      // Si falta algo obligatorio, lleva al usuario al tab donde está el campo
      setActiveTab("general");
      return showError("Error", "Campos obligatorios faltantes");
    }
    mutation.mutate(formData);
  };

  if (isFetching) return <Loading message="Cargando configuración..." />;

  return (
    <div className={styles.businessContainer}>
      {isLoading && <Loading message={loadingMessage} />}

      <div className={adminStyles.adminHeader}>
        <h1>Configuración del Negocio</h1>
      </div>

      {/* --- NAVEGACIÓN DE TABS --- */}
      <div className={styles.tabNav}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon /> {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        {/* ============================ TAB: GENERAL ============================ */}
        {activeTab === "general" && (
          <div className={styles.tabPanel}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Información General</h2>
              <p className={styles.requiredNote}>
                Los campos marcados con <span className={styles.required}>*</span> son obligatorios.
              </p>

              <div className={styles.formGroup}>
                <label>Nombre del Negocio<span className={styles.required}>*</span></label>
                <input className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej. Mi Tienda Increíble" />
              </div>

              <div className={styles.formGroup}>
                <label>Slug (https://qatalo.online/catalog/<span style={{ color: "red" }}>{formData.slug || '---'}</span>)<span className={styles.required}>*</span></label>
                <input className="input" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="mi-tienda" />
              </div>

              <div className={styles.formGroup}>
                <label>Teléfono de Contacto<span className={styles.required}>*</span></label>
                <input className="input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 234 567 8900" />
              </div>

              <div className={styles.formGroup}>
                <label>Descripción</label>
                <textarea className="input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Cuéntale a tus clientes de qué trata tu negocio..." rows="4"></textarea>
              </div>

              <div className={styles.formGroup}>
                <label>Logo del Negocio</label>
                <div className={styles.fileUploadWrapper}>
                  <input type="file" onChange={handleFileChange} accept="image/png,image/jpeg" />
                </div>
              </div>
            </div>

            {/* --- LOCALIDADES --- */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}><TbMapPin /> Localidades de disponibilidad</h2>
              <p style={{ color: "#667085", fontSize: ".9rem", marginTop: "-.5rem", marginBottom: "1rem" }}>
                Define las localidades donde entregas. Luego asignas a cada producto en cuáles está disponible
                (si un producto no tiene ninguna asignada, estará disponible en todas).
              </p>
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                <input
                  className="input"
                  style={{ flex: 1, minWidth: 200 }}
                  value={localityInput}
                  onChange={(e) => setLocalityInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLocality(); } }}
                  placeholder="Ej. Santo Domingo"
                />
                <button type="button" className={styles.resetBtn} onClick={addLocality}>Agregar</button>
              </div>
              {(formData.localities || []).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", marginTop: "1rem" }}>
                  {formData.localities.map((loc) => (
                    <span key={loc} style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", background: "#eef2f7", color: "#113f67", borderRadius: "999px", padding: ".35rem .75rem", fontSize: ".88rem", fontWeight: 600 }}>
                      {loc}
                      <button type="button" onClick={() => removeLocality(loc)} style={{ border: "none", background: "transparent", color: "#d92d20", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }} aria-label={`Quitar ${loc}`}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================ TAB: APARIENCIA ============================ */}
        {activeTab === "appearance" && (
          <div className={styles.tabPanel}>
            {/* --- ESTILO (TEMPLATE) --- */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}><TbLayoutDashboard /> Estilo</h2>
              <div className={styles.templateGrid}>
                {PREDEFINED_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    className={`${styles.templateCard} ${formData.templateId === tpl.id ? styles.selected : ""}`}
                    onClick={() => setFormData({ ...formData, templateId: tpl.id })}
                  >
                    {tpl.name}
                  </div>
                ))}
              </div>
            </div>

            {/* --- COLORES --- */}
            <div className={styles.section}>
              <div className={styles.sectionTitleRow}>
                <h2 className={styles.sectionTitle}><TbPalette /> Colores</h2>
                <button type="button" className={styles.resetBtn} onClick={resetPalette}>
                  Restaurar tema guardado
                </button>
              </div>

              <div className={styles.themeTypeToggle}>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${formData.themeType === "predefined" ? styles.toggleBtnActive : ""}`}
                  onClick={() => setFormData((p) => ({ ...p, themeType: "predefined" }))}
                >
                  Paleta predefinida
                </button>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${formData.themeType === "custom" ? styles.toggleBtnActive : ""}`}
                  onClick={() => setFormData((p) => ({ ...p, themeType: "custom" }))}
                >
                  Personalizado
                </button>
              </div>

              {formData.themeType === "predefined" ? (
                <div className={styles.paletteGrid}>
                  {PREDEFINED_PALETTES.map((palette) => (
                    <div
                      key={palette.id}
                      className={`${styles.paletteCard} ${isPaletteActive(palette) ? styles.paletteCardSelected : ""}`}
                      onClick={() => selectPalette(palette)}
                    >
                      <div className={styles.paletteSwatches}>
                        {Object.values(palette.colors).map((c, i) => (
                          <span key={i} className={styles.swatch} style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <span className={styles.paletteName}>{palette.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.customColors}>
                  {PALETTE_FIELDS.map(({ key, label }) => (
                    <div key={key} className={styles.colorRow}>
                      <span>{label}</span>
                      <div className={styles.colorInputs}>
                        <input
                          type="color"
                          value={formData.themePalette?.[key] || "#000000"}
                          onChange={(e) => updateColor(key, e.target.value)}
                        />
                        <input
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

            {/* --- PREVIEW EN VIVO --- */}
            <div className={styles.previewSection}>
              <div className={styles.previewHeader}>
                <h2 className={styles.sectionTitle}>Previsualización en tiempo real</h2>
                <div className={styles.deviceToggle}>
                  {DEVICES.map((d) => {
                    const Icon = d.icon;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        className={`${styles.deviceBtn} ${device === d.id ? styles.deviceBtnActive : ""}`}
                        onClick={() => setDevice(d.id)}
                        title={d.label}
                        aria-label={`Ver en ${d.label}`}
                      >
                        <Icon /> <span className={styles.deviceBtnLabel}>{d.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {!hasOwnProducts && (
                <p className={styles.demoNotice}>
                  🎨 Mostrando productos de ejemplo. Cuando agregues tus propios productos,
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
                    <CatalogManager businessData={formData} products={previewProducts} isPreview />
                  </DevicePreviewFrame>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================ TAB: FACTURACIÓN ============================ */}
        {activeTab === "billing" && (
          <div className={styles.tabPanel}>
            {/* --- DATOS FISCALES --- */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🧾 Datos fiscales</h3>
              <p className={styles.sectionDesc}>
                Estos datos aparecerán en las facturas y recibos que emitas a tus clientes.
              </p>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>RNC del negocio (opcional)</label>
                  <input
                    className="input"
                    value={formData.rnc}
                    onChange={(e) => setFormData({ ...formData, rnc: e.target.value.trim() })}
                    placeholder="1-31-XXXXX-X"
                  />
                  <span className={styles.hint}>Si lo configuras, aparecerá en el encabezado del comprobante.</span>
                </div>
                <div className={styles.formGroup} style={{ maxWidth: 200 }}>
                  <label>Tasa de ITBIS (%)</label>
                  <input
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

            {/* --- NCF --- */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>📄 Comprobantes Fiscales (NCF)</h3>
              <p className={styles.sectionDesc}>
                Activa los NCF para poder emitir <strong>facturas con valor fiscal</strong>. Si está desactivado,
                solo podrás emitir <strong>recibos de pago</strong> simples.
              </p>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={formData.ncf_enabled}
                  onChange={(e) => setFormData({ ...formData, ncf_enabled: e.target.checked })}
                />
                <span>Emitir facturas con NCF</span>
              </label>

              {formData.ncf_enabled && (
                <div className={styles.ncfSection}>
                  {/* Resumen del pool */}
                  <div className={styles.ncfStats}>
                    <div className={styles.ncfStat}>
                      <strong>{ncfAvailable}</strong>
                      <span>Disponibles</span>
                    </div>
                    <div className={styles.ncfStat} style={{ opacity: 0.7 }}>
                      <strong>{ncfUsed}</strong>
                      <span>Usados</span>
                    </div>
                  </div>
                  {ncfAvailable === 0 && (
                    <p className={styles.ncfWarning}>
                      ⚠️ No tienes NCF disponibles. Carga una secuencia para poder emitir facturas.
                    </p>
                  )}

                  {/* Cargar por rango */}
                  <div className={styles.ncfLoader}>
                    <span className={styles.ncfLoaderTitle}>Cargar secuencia por rango</span>
                    <div className={styles.ncfRangeRow}>
                      <div className={styles.ncfField}>
                        <label>Prefijo</label>
                        <input className="input" value={ncfPrefix} onChange={(e) => setNcfPrefix(e.target.value.toUpperCase())} placeholder="B01" />
                      </div>
                      <div className={styles.ncfField}>
                        <label>Desde</label>
                        <input type="number" min="1" className="input" value={ncfFrom} onChange={(e) => setNcfFrom(e.target.value)} placeholder="1" />
                      </div>
                      <div className={styles.ncfField}>
                        <label>Hasta</label>
                        <input type="number" min="1" className="input" value={ncfTo} onChange={(e) => setNcfTo(e.target.value)} placeholder="50" />
                      </div>
                      <button type="button" className={styles.resetBtn} onClick={addNcfRange}>Generar</button>
                    </div>
                    <span className={styles.hint}>
                      Ej: prefijo <strong>B01</strong>, desde <strong>1</strong> hasta <strong>50</strong> → genera B0100000001 … B0100000050.
                    </span>
                  </div>

                  {/* Cargar manual */}
                  <div className={styles.ncfLoader}>
                    <span className={styles.ncfLoaderTitle}>O pega una lista manual</span>
                    <textarea
                      className="input"
                      rows={3}
                      value={ncfManual}
                      onChange={(e) => setNcfManual(e.target.value)}
                      placeholder="Un NCF por línea o separados por coma&#10;B0100000001&#10;B0100000002"
                    />
                    <button type="button" className={styles.resetBtn} style={{ marginTop: ".5rem" }} onClick={addNcfManual}>
                      Agregar lista
                    </button>
                  </div>

                  {/* Lista del pool */}
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
                              <button type="button" onClick={() => removeNcf(n.ncf)} aria-label={`Quitar ${n.ncf}`}>×</button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================ TAB: NOTIFICACIONES ============================ */}
        {activeTab === "notifications" && (
          <div className={styles.tabPanel}>
            {/* --- ALERTAS DE INVENTARIO --- */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🔔 Alertas de inventario</h3>
              <p className={styles.sectionDesc}>
                Recibirás un correo de Qatalo cuando el stock de cualquier producto caiga por debajo de este número.
                Puedes ajustarlo individualmente por producto. Pon <strong>0</strong> para desactivar las alertas.
              </p>
              <div className={styles.formGroup} style={{ maxWidth: 260 }}>
                <label>Umbral global de stock bajo (unidades)</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={formData.low_stock_threshold}
                  onChange={e => setFormData({ ...formData, low_stock_threshold: e.target.value.trim() })}
                  placeholder="5"
                />
                <span className={styles.hint}>
                  {Number(formData.low_stock_threshold) === 0
                    ? "⚠️ Alertas desactivadas para todos los productos"
                    : `Recibirás alerta cuando queden ≤ ${formData.low_stock_threshold} unidades`}
                </span>
              </div>
            </div>

            {/* --- RECORDATORIO DE ENTREGAS --- */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🗓️ Recordatorio de entregas</h3>
              <p className={styles.sectionDesc}>
                Recibirás un correo cada mañana con el resumen de todas las órdenes
                aprobadas que tienen fecha de entrega ese día.
              </p>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={formData.delivery_reminder_enabled}
                  onChange={e => setFormData({ ...formData, delivery_reminder_enabled: e.target.checked })}
                />
                <span>Activar recordatorio diario de entregas</span>
              </label>
              {formData.delivery_reminder_enabled && (
                <p className={styles.hint}>
                  ✓ Te avisaremos cada día a las 8:00 AM si tienes entregas programadas.
                </p>
              )}
            </div>

            {/* --- MARKETING & ANALYTICS --- */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>📊 Marketing & Analytics</h3>
              <p className={styles.sectionDesc}>
                Conecta tu catálogo con tus herramientas de análisis para medir visitas,
                productos vistos y ventas. Las IDs son visibles públicamente en el código de tu catálogo.
              </p>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>
                    Google Analytics 4 (GA4)
                  </label>
                  <input
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
                  <label>
                    Meta Pixel (Facebook / Instagram)
                  </label>
                  <input
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
                <div className={styles.trackingActive}>
                  ✅ Tracking activo:
                  {formData.ga_tracking_id && <span>GA4 ({formData.ga_tracking_id})</span>}
                  {formData.meta_pixel_id && <span>Meta Pixel ({formData.meta_pixel_id})</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- BOTÓN GUARDAR (siempre visible, fuera de los tabs) --- */}
        <div className={styles.saveBar}>
          <PrimaryButton type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
};

export default Business;
