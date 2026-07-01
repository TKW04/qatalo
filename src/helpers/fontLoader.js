import { getFont } from "../constants/catalogFonts";

// Carga (o actualiza) las Google Fonts necesarias inyectando un <link> en el <head>.
// Se le pasan los IDs de fuente seleccionados (heading y body). Ignora "default".
//
// Uso:
//   loadCatalogFonts([businessData.fontHeading, businessData.fontBody]);
//
// Reutiliza un único <link id="qatalo-catalog-fonts"> y lo actualiza cuando cambian
// las fuentes, para no acumular <link> repetidos.

const LINK_ID = "qatalo-catalog-fonts";

export const buildFontsUrl = (fontIds = []) => {
  const families = [];
  const seen = new Set();

  for (const id of fontIds) {
    const font = getFont(id);
    if (!font || !font.googleName || seen.has(font.id)) continue;
    seen.add(font.id);
    const name = font.googleName.replace(/ /g, "+");
    families.push(font.weights ? `family=${name}:wght@${font.weights}` : `family=${name}`);
  }

  if (!families.length) return "";
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
};

export const loadCatalogFonts = (fontIds = []) => {
  if (typeof document === "undefined") return;
  const url = buildFontsUrl(fontIds);
  if (!url) return;

  let link = document.getElementById(LINK_ID);
  if (!link) {
    link = document.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.href !== url) link.href = url;
};