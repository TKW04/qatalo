import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TbLayoutDashboard, TbPalette, TbMapPin } from "react-icons/tb";
import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import Loading from "../../../components/UI/Loading";
import PrimaryButton from "../../../components/PrimaryButton";
import CatalogManager from "../../../components/CatalogTemplates/CatalogManager";
import adminStyles from "../AdminDashboard.module.css";
import styles from "./Business.module.css";
import { PREDEFINED_PALETTES, PREDEFINED_TEMPLATES, PALETTE_FIELDS } from "../../../constants/themePalettes";
import { fetchBusinessData, saveBusinessData, getPresignedUrl, uploadToS3 } from "../../../services/businessApi";

const Business = () => {
  const auth = getTokenInfo();
  const tenantId = auth?.sub;
  const { showError, showSuccess } = useNotification();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    business_id: "", name: "", slug: "", phone: "", description: "",
    logo_url: "", templateId: "default", themeType: "predefined",
    themePalette: PREDEFINED_PALETTES[0].colors, localities: [],
    ga_tracking_id: "",
    meta_pixel_id: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [localityInput, setLocalityInput] = useState("");
  const originalThemeRef = useRef(null);

  const { data: businessData, isLoading: isFetching } = useQuery({
    queryKey: ["business", tenantId],
    queryFn: fetchBusinessData,
    enabled: !!tenantId,
  });

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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setIsLoading(true);
      setLoadingMessage("Subiendo logo...");
      const extension = file.name.substring(file.name.lastIndexOf("."));
      const { uploadUrl, publicUrl } = await getPresignedUrl("logo", extension, file.type);
      await uploadToS3(uploadUrl, file);
      setFormData((prev) => ({ ...prev, logo_url: publicUrl }));
      showSuccess("Logo actualizado", "Imagen subida a S3");
    } catch {
      showError("Error", "Fallo al subir la imagen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) return showError("Error", "Campos obligatorios faltantes");
    mutation.mutate(formData);
  };

  if (isFetching) return <Loading message="Cargando configuración..." />;

  return (
    <div className={styles.businessContainer}>
      {isLoading && <Loading message={loadingMessage} />}

      <div className={adminStyles.adminHeader}>
        <h1>Configuración del Negocio</h1>
      </div>

      <form onSubmit={handleSubmit}>
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
            <label>Slug (URL de tu tienda)<span className={styles.required}>*</span></label>
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
              <input type="file" onChange={handleFileChange} accept="image/*" />
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
        {/* ── Marketing & Analytics ── */}
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

        <PrimaryButton type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
        </PrimaryButton>
      </form>

      <div className={styles.previewSection}>
        <h2 className={styles.sectionTitle}>Previsualización en tiempo real</h2>
        <div className={styles.previewContainer}>
          <CatalogManager businessData={formData} products={[]} isPreview />
        </div>
      </div>
    </div>
  );
};

export default Business;