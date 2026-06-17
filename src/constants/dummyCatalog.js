// Productos de ejemplo para la previsualización del catálogo
// cuando el negocio todavía no tiene productos creados.
// Las imágenes son SVG embebidos (paleta Qatalo) para que rendericen
// siempre, sin depender de la red.

const demoImg = (c1, c2) => {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/>` +
    `</linearGradient></defs>` +
    `<rect width='400' height='400' fill='url(#g)'/>` +
    `<circle cx='200' cy='165' r='72' fill='rgba(255,255,255,0.22)'/>` +
    `<rect x='118' y='250' width='164' height='26' rx='13' fill='rgba(255,255,255,0.20)'/>` +
    `<rect x='150' y='292' width='100' height='18' rx='9' fill='rgba(255,255,255,0.14)'/>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const base = {
  currency: "RD$",
  show_quantity: false,
  category_id: "",
  is_customizable: false,
  variants: [],
  localities: [],
  locality_config: [],
  is_available: "available",
};

export const DEMO_PRODUCTS = [
  {
    ...base,
    product_id: "demo-1",
    name: "Producto destacado",
    description: "Un ejemplo de cómo se verá tu producto estrella en el catálogo.",
    price: 1250,
    quantity: 14,
    imagesUrl: [{ image: demoImg("#113F67", "#34699A") }],
  },
  {
    ...base,
    product_id: "demo-2",
    name: "Artículo popular",
    description: "Tus productos más vendidos lucirán así de bien.",
    price: 890,
    quantity: 30,
    imagesUrl: [{ image: demoImg("#34699A", "#58A0C8") }],
  },
  {
    ...base,
    product_id: "demo-3",
    name: "Edición especial",
    description: "Ideal para promociones y lanzamientos.",
    price: 1990,
    quantity: 6,
    imagesUrl: [{ image: demoImg("#58A0C8", "#113F67") }],
  },
  {
    ...base,
    product_id: "demo-4",
    name: "Favorito de la casa",
    description: "Así se mostrará la descripción de cada producto.",
    price: 650,
    quantity: 22,
    imagesUrl: [{ image: demoImg("#113F67", "#58A0C8") }],
  },
  {
    ...base,
    product_id: "demo-5",
    name: "Nuevo ingreso",
    description: "Tus productos recién agregados se ven aquí.",
    price: 1450,
    quantity: 10,
    imagesUrl: [{ image: demoImg("#34699A", "#113F67") }],
  },
  {
    ...base,
    product_id: "demo-6",
    name: "Oferta del día",
    description: "Perfecto para destacar descuentos y combos.",
    price: 499,
    quantity: 18,
    imagesUrl: [{ image: demoImg("#58A0C8", "#34699A") }],
  },
];