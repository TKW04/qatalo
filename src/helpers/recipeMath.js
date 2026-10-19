// Cálculos puros de recetas (solo control de costos; no toca inventario).
// Verificación ligera: node <scratchpad>/recipeMath.check.mjs
//   16 recetas, 'Coquitos' 0.5 lb a RD$499.31 por receta → 8 lb (128 oz), RD$7,988.96.
//   Empaque 1 pieza/ud a RD$5 con 0 unidades → subtotal empaque 0 y costo por unidad null.

export const OZ_PER_LB = 16;
export const STANDARD_UNITS = ["oz", "lb", "ud"];

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Redondeo para evitar artefactos de coma flotante (dinero a centavos, cantidades a milésimas)
export const roundMoney = (v) => Math.round((num(v) + Number.EPSILON) * 100) / 100;
export const roundQty = (v) => Math.round((num(v) + Number.EPSILON) * 1000) / 1000;

export const normalizeUnit = (unit) => String(unit ?? "").trim().toLowerCase();

// Divide protegiendo contra cero / valores inválidos → null si no hay base
const safeDiv = (a, b) => (num(b) > 0 ? num(a) / num(b) : null);

const fmtQty = (v) =>
  roundQty(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 3 });

/**
 * Texto de cantidad con conversión oz ↔ lb (16 oz = 1 lb).
 *   quantityLabel(8, "lb")   → "8 lb (128 oz)"
 *   quantityLabel(24, "oz")  → "24 oz (1.5 lb)"
 *   quantityLabel(3, "lata") → "3 lata"
 */
export const quantityLabel = (qty, unit) => {
  const u = normalizeUnit(unit);
  const q = num(qty);
  if (u === "lb") return `${fmtQty(q)} lb (${fmtQty(q * OZ_PER_LB)} oz)`;
  if (u === "oz") return `${fmtQty(q)} oz (${fmtQty(q / OZ_PER_LB)} lb)`;
  return `${fmtQty(q)} ${String(unit ?? "").trim()}`.trim();
};

/** Costo de una receta (una tanda) = suma de cost_per_recipe de los ingredientes. */
export const recipeCost = (ingredients = []) =>
  roundMoney((ingredients || []).reduce((s, it) => s + num(it?.cost_per_recipe), 0));

/** Costo de empaque por unidad terminada = Σ quantity_per_unit × unit_cost. */
export const packagingCostPerUnit = (packaging = []) =>
  roundMoney((packaging || []).reduce((s, p) => s + num(p?.quantity_per_unit) * num(p?.unit_cost), 0));

/**
 * Planificador: escala la receta a N tandas y (opcional) U unidades terminadas.
 * @param recipe  { yield_lb, ingredients[], packaging[] }
 * @param opts    { batches: N (≥1), units: U (≥0) }
 * @returns totales; costPerLb / costPerUnit son null cuando la base es 0.
 */
export const computeRecipePlan = (recipe, { batches = 1, units = 0 } = {}) => {
  const n = Math.max(0, Math.floor(num(batches)));
  const u = Math.max(0, Math.floor(num(units)));
  const totalLb = roundQty(num(recipe?.yield_lb) * n);

  const ingredients = (recipe?.ingredients || []).map((it) => {
    const quantity = roundQty(num(it?.quantity) * n);
    const unit = String(it?.unit ?? "").trim();
    const nu = normalizeUnit(unit);
    return {
      name: it?.name || "",
      unit,
      store: it?.store || "",
      quantity,
      quantityLabel: quantityLabel(quantity, unit),
      totalOz: nu === "lb" ? roundQty(quantity * OZ_PER_LB) : nu === "oz" ? quantity : null,
      totalLb: nu === "oz" ? roundQty(quantity / OZ_PER_LB) : nu === "lb" ? quantity : null,
      costPerRecipe: roundMoney(it?.cost_per_recipe),
      cost: roundMoney(num(it?.cost_per_recipe) * n),
    };
  });
  const ingredientsSubtotal = roundMoney(ingredients.reduce((s, it) => s + it.cost, 0));

  const packaging = (recipe?.packaging || []).map((p) => {
    const pieces = roundQty(num(p?.quantity_per_unit) * u);
    return {
      name: p?.name || "",
      store: p?.store || "",
      quantityPerUnit: num(p?.quantity_per_unit),
      unitCost: roundMoney(p?.unit_cost),
      pieces,
      cost: roundMoney(pieces * num(p?.unit_cost)),
    };
  });
  const packagingSubtotal = roundMoney(packaging.reduce((s, p) => s + p.cost, 0));

  const total = roundMoney(ingredientsSubtotal + packagingSubtotal);
  const perLb = safeDiv(total, totalLb);
  const perUnit = safeDiv(total, u);

  return {
    batches: n,
    units: u,
    totalLb,
    totalOz: roundQty(totalLb * OZ_PER_LB),
    ingredients,
    ingredientsSubtotal,
    packaging,
    packagingSubtotal,
    packagingPerUnit: packagingCostPerUnit(recipe?.packaging),
    total,
    costPerLb: perLb === null ? null : roundMoney(perLb),
    costPerUnit: perUnit === null ? null : roundMoney(perUnit),
  };
};
