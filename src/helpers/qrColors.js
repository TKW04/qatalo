// Colores del QR. Escaneabilidad primero: módulos oscuros sobre fondo claro,
// contraste >= 4.5:1 y nunca invertido (claro sobre oscuro).
import { luminance, FALLBACK_PALETTE } from "../components/CatalogTemplates/catalogTheme";

const WHITE = "#FFFFFF";
const MIN_CONTRAST = 4.5;
// Fondo de la paleta solo si es casi blanco (los lectores fallan con fondos medios)
const MIN_BG_LUMINANCE = 0.8;

export const CLASSIC_QR_COLORS = {
  dots: "#000000",
  cornersSquare: "#000000",
  cornersDot: "#000000",
  background: WHITE,
  adjusted: false,
};

const contrastRatio = (a, b) => {
  const la = luminance(a);
  const lb = luminance(b);
  if (la == null || lb == null) return 0;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const toHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase();

// Mezcla con negro (amount 0..1) para oscurecer conservando el tono
const darken = (hex, amount) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) * (1 - amount));
  return toHex(rgb);
};

const isHex = (c) => typeof c === "string" && luminance(c) != null;

/**
 * Primer color de `preferred` con contraste suficiente sobre `bg`; si ninguno
 * llega, el más oscuro de la paleta mezclado con negro hasta alcanzarlo.
 */
const pickDark = (preferred, bg) => {
  const valid = preferred.filter(isHex);
  const ok = valid.find((c) => contrastRatio(c, bg) >= MIN_CONTRAST);
  if (ok) return { color: ok, adjusted: false };
  const darkest = [...valid].sort((a, b) => luminance(a) - luminance(b))[0] || "#000000";
  for (let amount = 0.1; amount < 1; amount += 0.1) {
    const c = darken(darkest, amount);
    if (contrastRatio(c, bg) >= MIN_CONTRAST) return { color: c, adjusted: true };
  }
  return { color: "#000000", adjusted: true };
};

export const parsePalette = (raw) => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try { return JSON.parse(raw) || {}; } catch { return {}; }
  }
  return typeof raw === "object" ? raw : {};
};

/** Colores del QR derivados de la paleta del catálogo del negocio. */
export const brandQrColors = (rawPalette) => {
  const own = Object.fromEntries(Object.entries(parsePalette(rawPalette)).filter(([, v]) => isHex(v)));
  const p = { ...FALLBACK_PALETTE, ...own };

  const background = luminance(p.background) >= MIN_BG_LUMINANCE ? p.background : WHITE;
  const dots = pickDark([p.primary, p.secondary, p.accent], background);
  const cornersSquare = pickDark([p.accent, p.primary, p.secondary], background);

  return {
    dots: dots.color,
    cornersSquare: cornersSquare.color,
    cornersDot: dots.color,
    background,
    adjusted: dots.adjusted || cornersSquare.adjusted || background !== p.background,
  };
};
