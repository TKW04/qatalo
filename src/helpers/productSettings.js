// Aplica la configuración general de productos al listado del catálogo.
// settings = { out_of_stock: "normal" | "end" | "hide" }
//  - normal: sin cambios
//  - end:    empuja los agotados al final (conserva el orden dentro de cada grupo)
//  - hide:   oculta los agotados
export const applyStockSetting = (products, settings) => {
  const mode = (settings && settings.out_of_stock) || "normal";
  if (mode === "normal" || !Array.isArray(products)) return products;

  const isOut = (p) => p.is_available !== "available";

  if (mode === "hide") {
    return products.filter((p) => !isOut(p));
  }

  if (mode === "end") {
    const inStock = products.filter((p) => !isOut(p));
    const outStock = products.filter((p) => isOut(p));
    return [...inStock, ...outStock];
  }

  return products;
};

export const OUT_OF_STOCK_OPTIONS = [
  { value: "normal", label: "Mostrar normal (mezclados según el orden)" },
  { value: "end", label: "Mostrar al final del catálogo" },
  { value: "hide", label: "Ocultar del catálogo" },
];