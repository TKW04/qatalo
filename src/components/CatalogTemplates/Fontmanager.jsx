import { useRef } from "react";
import { TbUpload, TbTrash, TbTypography } from "react-icons/tb";
import { useNotification } from "../UI/NotificationProvider";
import {
  ALLOWED_FONT_EXT, MAX_FONT_BYTES, MAX_CUSTOM_FONTS,
  fontExt, fontFormat, customFamily, registerCustomFont,
} from "../../helpers/customFonts";

const genId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const baseName = (name = "") => {
  const i = name.lastIndexOf(".");
  return (i >= 0 ? name.slice(0, i) : name).slice(0, 40);
};

const prettySize = (bytes) => `${Math.round((bytes || 0) / 1024)} KB`;

const FontManager = ({ customFonts = [], onChange }) => {
  const { showError, showWarning, showSuccess } = useNotification();
  const inputRef = useRef(null);

  const atMax = (customFonts || []).length >= MAX_CUSTOM_FONTS;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    if (atMax)
      return showWarning("Límite alcanzado", `Puedes subir hasta ${MAX_CUSTOM_FONTS} fuentes.`);

    const ext = fontExt(file.name);
    if (!ALLOWED_FONT_EXT.includes(ext))
      return showError(
        "Formato no válido",
        `Usa ${ALLOWED_FONT_EXT.join(", ")}. El más liviano es .woff2.`
      );
    if (file.size > MAX_FONT_BYTES)
      return showError(
        "Archivo muy grande",
        `Máximo ${Math.round(MAX_FONT_BYTES / 1024)} KB. Esta fuente pesa ${prettySize(file.size)}.`
      );

    // Staging: NO se sube al S3 hasta que se guarde la configuración.
    // Usamos un blob URL local para previsualizar de una vez.
    const id = genId();
    const localUrl = URL.createObjectURL(file);
    const font = {
      id,
      label: baseName(file.name),
      family: customFamily(id),
      url: localUrl,
      format: fontFormat(ext),
      ext,
      size: file.size,
      _pending: true,   // se subirá al guardar
      _file: file,      // archivo real (se sube en handleSubmit)
    };
    registerCustomFont(font); // disponible al instante para el preview
    onChange?.([...(customFonts || []), font]);
    showSuccess("Fuente agregada", "Se subirá cuando guardes los cambios.");
  };

  const rename = (id, label) =>
    onChange?.((customFonts || []).map((f) => (f.id === id ? { ...f, label } : f)));

  const remove = (id) => {
    const target = (customFonts || []).find((f) => f.id === id);
    if (target?._pending && target.url && target.url.startsWith("blob:")) {
      URL.revokeObjectURL(target.url);
    }
    onChange?.((customFonts || []).filter((f) => f.id !== id));
  };

  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <span style={S.headTitle}><TbTypography /> Fuentes propias</span>
        <span style={S.count}>{(customFonts || []).length}/{MAX_CUSTOM_FONTS}</span>
      </div>
      <p style={S.desc}>
        Sube tus fuentes y aparecerán en los selectores de arriba. Formatos: {ALLOWED_FONT_EXT.join(", ")}
        {" "}· máx. {Math.round(MAX_FONT_BYTES / 1024)} KB c/u · hasta {MAX_CUSTOM_FONTS}. Para menor peso, usa .woff2.
      </p>

      {(customFonts || []).length > 0 && (
        <div style={S.list}>
          {customFonts.map((f) => (
            <div key={f.id} style={S.row}>
              <div style={{ ...S.sample, fontFamily: customFamily(f.id) }} title="Vista previa">
                Aa
              </div>
              <div style={S.rowMain}>
                <input
                  style={S.labelInput}
                  value={f.label}
                  onChange={(e) => rename(f.id, e.target.value.slice(0, 40))}
                  placeholder="Nombre de la fuente"
                />
                <span style={S.meta}>
                  {(f.ext || "").replace(".", "").toUpperCase()} · {prettySize(f.size)}
                  {f._pending && <span style={S.pending}> · sin guardar</span>}
                </span>
              </div>
              <button type="button" style={S.del} onClick={() => remove(f.id)} aria-label="Eliminar fuente">
                <TbTrash />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_FONT_EXT.join(",")}
        onChange={handleFile}
        style={{ display: "none" }}
      />
      <button
        type="button"
        style={{ ...S.uploadBtn, ...(atMax ? S.uploadBtnDisabled : {}) }}
        onClick={() => inputRef.current?.click()}
        disabled={atMax}
      >
        <TbUpload /> {atMax ? "Límite alcanzado" : "Agregar fuente"}
      </button>
    </div>
  );
};

const S = {
  wrap: { border: "1px solid #eef0f3", borderRadius: 12, padding: "1rem 1.15rem", marginTop: "1rem", background: "#fafbfc" },
  head: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  headTitle: { display: "inline-flex", alignItems: "center", gap: ".4rem", fontWeight: 700, color: "#113f67" },
  count: { fontSize: ".8rem", color: "#667085", fontWeight: 600 },
  desc: { fontSize: ".82rem", color: "#667085", margin: ".4rem 0 .9rem", lineHeight: 1.5 },
  list: { display: "flex", flexDirection: "column", gap: ".5rem", marginBottom: ".9rem" },
  row: { display: "flex", alignItems: "center", gap: ".75rem", background: "#fff", border: "1px solid #eef0f3", borderRadius: 9, padding: ".5rem .65rem" },
  sample: { width: 42, height: 42, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.35rem", background: "#f2f4f7", borderRadius: 7, color: "#113f67" },
  rowMain: { flex: 1, display: "flex", flexDirection: "column", gap: ".2rem", minWidth: 0 },
  labelInput: { border: "1px solid #d0d5dd", borderRadius: 6, padding: ".35rem .5rem", fontSize: ".88rem", color: "#1d2939", width: "100%", boxSizing: "border-box" },
  meta: { fontSize: ".74rem", color: "#98a2b3" },
  pending: { color: "#b54708", fontWeight: 700 },
  del: { border: "none", background: "transparent", color: "#d92d20", cursor: "pointer", fontSize: "1.05rem", padding: ".3rem" },
  uploadBtn: { display: "inline-flex", alignItems: "center", gap: ".45rem", background: "#113f67", color: "#fdf5aa", border: "none", borderRadius: 9, padding: ".6rem 1.1rem", fontWeight: 700, fontSize: ".9rem", cursor: "pointer" },
  uploadBtnDisabled: { opacity: .5, cursor: "not-allowed" },
};

export default FontManager;