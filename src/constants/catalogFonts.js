// Fuentes disponibles para el catálogo (Google Fonts, licencia abierta).
// "default" = no fuerza ninguna fuente → el template usa su tipografía actual.
//
// Cada fuente:
//   id         → se guarda en businessData (fontHeading / fontBody)
//   name       → lo que ve el dueño
//   family     → valor CSS completo con fallback
//   googleName → nombre para armar la URL de Google Fonts (null en "default")
//   weights    → pesos a cargar
//   category   → para agrupar en el selector

export const CATALOG_FONTS = [
  {
    id: "default",
    name: "Predeterminada del tema",
    family: "",
    googleName: null,
    weights: "",
    category: "Predeterminada",
  },

  // ── Sans-serif (modernas y legibles) ──
  { id: "poppins",   name: "Poppins",   family: "'Poppins', sans-serif",   googleName: "Poppins",   weights: "400;500;600;700", category: "Sans-serif" },
  { id: "inter",     name: "Inter",     family: "'Inter', sans-serif",     googleName: "Inter",     weights: "400;500;600;700", category: "Sans-serif" },
  { id: "montserrat",name: "Montserrat",family: "'Montserrat', sans-serif",googleName: "Montserrat",weights: "400;500;600;700", category: "Sans-serif" },
  { id: "nunito",    name: "Nunito",    family: "'Nunito', sans-serif",    googleName: "Nunito",    weights: "400;600;700;800", category: "Sans-serif" },
  { id: "dm-sans",   name: "DM Sans",   family: "'DM Sans', sans-serif",   googleName: "DM Sans",   weights: "400;500;700",     category: "Sans-serif" },
  { id: "work-sans", name: "Work Sans", family: "'Work Sans', sans-serif", googleName: "Work Sans", weights: "400;500;600;700", category: "Sans-serif" },

  // ── Serif (elegantes) ──
  { id: "playfair",  name: "Playfair Display", family: "'Playfair Display', serif", googleName: "Playfair Display", weights: "400;500;600;700", category: "Serif" },
  { id: "lora",      name: "Lora",             family: "'Lora', serif",             googleName: "Lora",             weights: "400;500;600;700", category: "Serif" },
  { id: "merriweather", name: "Merriweather",  family: "'Merriweather', serif",     googleName: "Merriweather",     weights: "400;700",         category: "Serif" },
  { id: "cormorant", name: "Cormorant Garamond", family: "'Cormorant Garamond', serif", googleName: "Cormorant Garamond", weights: "400;500;600;700", category: "Serif" },

  // ── Display / con personalidad ──
  { id: "fredoka",   name: "Fredoka",   family: "'Fredoka', sans-serif",   googleName: "Fredoka",   weights: "400;500;600;700", category: "Con personalidad" },
  { id: "baloo2",    name: "Baloo 2",   family: "'Baloo 2', cursive",      googleName: "Baloo 2",   weights: "400;500;600;700;800", category: "Con personalidad" },
  { id: "bebas",     name: "Bebas Neue",family: "'Bebas Neue', sans-serif",googleName: "Bebas Neue",weights: "400",             category: "Con personalidad" },

  // ── Manuscritas (para acentos / boutiques) ──
  { id: "pacifico",  name: "Pacifico",       family: "'Pacifico', cursive",       googleName: "Pacifico",       weights: "400",             category: "Manuscritas" },
  { id: "dancing",   name: "Dancing Script", family: "'Dancing Script', cursive", googleName: "Dancing Script", weights: "400;500;600;700", category: "Manuscritas" },
];

// Escala global de tamaño de fuente (multiplicador)
export const FONT_SCALES = [
  { id: "small",  name: "Pequeña",      value: 0.92 },
  { id: "medium", name: "Mediana",      value: 1.0 },
  { id: "large",  name: "Grande",       value: 1.12 },
  { id: "xlarge", name: "Extra grande", value: 1.28 },
];

// Helpers de búsqueda
export const getFont = (id) =>
  CATALOG_FONTS.find((f) => f.id === id) || CATALOG_FONTS[0];

export const getScaleValue = (id) =>
  (FONT_SCALES.find((s) => s.id === id) || FONT_SCALES[1]).value;

// Opciones listas para el componente Select (agrupadas por categoría)
export const FONT_OPTIONS = CATALOG_FONTS.map((f) => ({
  value: f.id,
  label: f.name,
  group: f.category,
}));

export const SCALE_OPTIONS = FONT_SCALES.map((s) => ({
  value: s.id,
  label: s.name,
}));

// Escala del logo (multiplica el alto base que trae cada template)
export const LOGO_SCALES = [
  { id: "small",  name: "Pequeño", value: 0.75 },
  { id: "medium", name: "Mediano", value: 1.0 },
  { id: "large",  name: "Grande",  value: 1.35 },
];

export const getLogoScaleValue = (id) =>
  (LOGO_SCALES.find((s) => s.id === id) || LOGO_SCALES[1]).value;

export const LOGO_SCALE_OPTIONS = LOGO_SCALES.map((s) => ({
  value: s.id,
  label: s.name,
}));

// ── Tamaño de texto independiente (buscador / descripción del modal) ──
// "theme" = no forzar nada (hereda el tamaño actual del template).
// small/medium/large = tamaños fijos en px. custom = el que indique el dueño.
export const TEXT_SIZE_PRESETS_PX = { small: 14, medium: 16, large: 19 };

export const TEXT_SIZE_MODE_OPTIONS = [
  { value: "theme", label: "Igual que el tema (por defecto)" },
  { value: "small", label: "Pequeño (14px)" },
  { value: "medium", label: "Mediano (16px)" },
  { value: "large", label: "Grande (19px)" },
  { value: "custom", label: "Personalizado (px)" },
];

// Devuelve el tamaño en px a aplicar, o "" si debe heredar el del tema (sin forzar nada).
export const resolveTextSizePx = (mode, customPx) => {
  if (!mode || mode === "theme") return "";
  if (mode === "custom") {
    const n = Number(customPx);
    return n > 0 ? `${n}px` : "";
  }
  const preset = TEXT_SIZE_PRESETS_PX[mode];
  return preset ? `${preset}px` : "";
};