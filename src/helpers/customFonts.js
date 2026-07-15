// Fuentes subidas por cada negocio (opción C: se suben tal cual, sin conversión).
// Se guardan en business.custom_fonts = [{ id, label, family, url, format, ext, size }]
// y se registran en runtime con la FontFace API.

export const ALLOWED_FONT_EXT = [".woff2", ".woff", ".ttf", ".otf"];
export const MAX_FONT_BYTES = 400 * 1024; // 400 KB
export const MAX_CUSTOM_FONTS = 4;

const EXT_MIME = {
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};
const EXT_FORMAT = {
  ".woff2": "woff2",
  ".woff": "woff",
  ".ttf": "truetype",
  ".otf": "opentype",
};

export const fontExt = (filename = "") => {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i).toLowerCase() : "";
};
export const fontMime = (ext) => EXT_MIME[ext] || "application/octet-stream";
export const fontFormat = (ext) => EXT_FORMAT[ext] || "";

// Familia CSS única (determinística) para un id de fuente custom
export const customFamily = (id) => `qatalo-font-${id}`;

// Esquema de key para el <Select> (distingue custom de las integradas)
export const CUSTOM_PREFIX = "custom:";
export const isCustomKey = (key) =>
  typeof key === "string" && key.startsWith(CUSTOM_PREFIX);
export const customIdFromKey = (key) =>
  isCustomKey(key) ? key.slice(CUSTOM_PREFIX.length) : "";
export const customKey = (id) => `${CUSTOM_PREFIX}${id}`;

// --- Registro como @font-face en un <style> del <head> ---
// Mismo mecanismo que una hoja de estilos normal: funciona en el catálogo
// público y, como el preview clona el <head>, también dentro de su iframe.
// (Antes se usaba document.fonts.add(), que NO crea nodo en el DOM y por eso
//  el iframe del preview no lo heredaba.)
const STYLE_ID = "qatalo-custom-fonts";
const _rules = new Map(); // family -> regla css

const _flush = () => {
  if (typeof document === "undefined") return;
  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = Array.from(_rules.values()).join("\n");
};

export const registerCustomFont = (font) => {
  if (!font || !font.id || !font.url) return;
  const family = customFamily(font.id);
  const fmt = font.format ? ` format("${font.format}")` : "";
  const rule = `@font-face{font-family:"${family}";src:url("${font.url}")${fmt};font-display:swap;}`;
  // Si cambió la URL (ej. blob local -> S3 al guardar) se reemplaza la regla.
  if (_rules.get(family) === rule) return;
  _rules.set(family, rule);
  _flush();
};

export const loadCustomFonts = (fonts = []) => {
  (fonts || []).forEach((f) => registerCustomFont(f));
};

// Resuelve la familia CSS a partir de la key guardada.
// getBuiltinFamily: (key) => family, para las integradas (ej. (k)=>getFont(k).family)
export const resolveFontFamily = (key, customFonts = [], getBuiltinFamily) => {
  if (isCustomKey(key)) {
    const id = customIdFromKey(key);
    const f = (customFonts || []).find((x) => x.id === id);
    return f ? customFamily(f.id) : "";
  }
  return getBuiltinFamily ? getBuiltinFamily(key) : "";
};

// Opciones para inyectar en el <Select> junto a las fuentes integradas.
// Usa el mismo shape { value, label, group } que FONT_OPTIONS para que queden agrupadas.
export const customFontOptions = (customFonts = []) =>
  (customFonts || []).map((f) => ({
    value: customKey(f.id),
    label: f.label,
    group: "Mis fuentes",
  }));