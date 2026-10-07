// Contrato de color del catálogo público, derivado SOLO de la paleta del negocio.
// Nunca usa colores de marca Qatalo. Los tokens --cat-* se definen en
// catalogShared.module.css (.themeRoot) a partir de --theme-* y del esquema
// claro/oscuro calculado aquí; los "on-*" (texto sobre primario/acento) se
// calculan por luminancia para que el contraste no dependa de la paleta.

export const FALLBACK_PALETTE = {
  primary: "#0B3D62",
  secondary: "#2D3E50",
  accent: "#F4B400",
  background: "#F7FAFC",
};

const parseHex = (hex) => {
  if (typeof hex !== "string") return null;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split("").map((c) => c + c).join("");
  if (h.length === 8) h = h.slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

// Luminancia relativa WCAG (0 = negro, 1 = blanco)
export const luminance = (hex) => {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

const ON_DARK = "#FFFFFF";
const ON_LIGHT = "#141414";

// Devuelve el color de texto (claro u oscuro) con mejor contraste sobre `hex`.
export const onColor = (hex) => {
  const l = luminance(hex);
  if (l == null) return ON_DARK;
  return contrast(l, 1) >= contrast(l, luminance(ON_LIGHT)) ? ON_DARK : ON_LIGHT;
};

export const isDarkColor = (hex) => {
  const l = luminance(hex);
  return l != null && l < 0.2;
};

// Variables inline para el contenedor raíz del catálogo.
export const themeVars = (palette = {}) => {
  const p = { ...FALLBACK_PALETTE, ...Object.fromEntries(Object.entries(palette || {}).filter(([, v]) => v)) };
  return {
    scheme: isDarkColor(p.background) ? "dark" : "light",
    vars: {
      "--theme-on-primary": onColor(p.primary),
      "--theme-on-accent": onColor(p.accent),
    },
  };
};
