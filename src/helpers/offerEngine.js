// Motor de ofertas compartido (v2): MISMA lógica para el carrito del cliente
// y para aplicar descuentos desde el panel admin. No dupliques estas reglas.
// La misma lógica existe en qatalo-api; ambos deben pasar los casos de
// src/helpers/__fixtures__/offerCases.json (node src/helpers/offerEngine.check.mjs).
//
// Los "items" son genéricos: cada uno necesita { product_id, category_id?, price, quantity }.
// En el carrito son líneas del carrito; en el admin son transacciones de una orden
// (enriquecidas con category_id desde el producto).
//
// Reglas v2:
// - min_order_amount se mide contra el subtotal de las líneas ELEGIBLES.
// - min_quantity (opcional): mínimo de unidades elegibles para que la oferta aplique.
// - fixed + fixed_mode 'order' (default): discount_value una vez, tope = subtotal elegible.
// - fixed + fixed_mode 'per_unit': discount_value × unidades, tope por línea = subtotal de la línea.
// - buy_x_get_y: agrupa por product_id (variantes juntas); se regalan las unidades más baratas.
// - Una sola oferta ganadora: prioridad alta > media > baja; empate → mayor descuento.

// Prioridad como número para comparar (mayor gana)
const PRIORITY_RANK = { alta: 3, media: 2, baja: 1 };
export const priorityRank = (offer) =>
  PRIORITY_RANK[(offer?.priority || "media").toLowerCase()] || 2;

const round2 = (n) => Math.round((Number(n) || 0) * 100 + Number.EPSILON * 100) / 100;
const qtyOf = (it) => Number(it.quantity) || 1;
const priceOf = (it) => Number(it.price) || 0;
const lineSubtotal = (it) => priceOf(it) * qtyOf(it);

export const fixedModeOf = (offer) => (offer?.fixed_mode === "per_unit" ? "per_unit" : "order");

const isItemEligible = (offer, it) => {
  const scope = offer.applies_to || "all";
  if (scope === "all") return true;
  if (scope === "products") return (offer.product_ids || []).includes(it.product_id);
  if (scope === "categories") return (offer.category_ids || []).includes(it.category_id || "");
  return false;
};

export const getApplicableItems = (offer, items) => {
  if (!offer) return [];
  return (items || []).filter((it) => isItemEligible(offer, it));
};

// `_subtotal` se mantiene por compatibilidad de firma; ya no se usa
// (el mínimo de compra cuenta solo las líneas elegibles).
// eslint-disable-next-line no-unused-vars
export const isOfferApplicable = (offer, items, _subtotal) => {
  if (!offer) return false;
  const applicable = getApplicableItems(offer, items);
  if (!applicable.length) return false;
  const minAmount = Number(offer.min_order_amount) || 0;
  if (minAmount > 0) {
    const eligibleSub = applicable.reduce((s, it) => s + lineSubtotal(it), 0);
    if (eligibleSub < minAmount) return false;
  }
  const minQty = Number(offer.min_quantity) || 0;
  if (minQty > 0) {
    const eligibleQty = applicable.reduce((s, it) => s + qtyOf(it), 0);
    if (eligibleQty < minQty) return false;
  }
  return true;
};

// Ajusta el residuo de redondeo para que la suma por línea = total.
// Se aplica en la línea elegible de mayor subtotal (sin pasar de su subtotal ni de 0).
const settleResidual = (lineDiscounts, items, eligibleIdx, total) => {
  const sum = round2(lineDiscounts.reduce((s, d) => s + d, 0));
  const diff = round2(total - sum);
  if (diff === 0 || !eligibleIdx.length) return lineDiscounts;
  let target = eligibleIdx[0];
  for (const i of eligibleIdx) if (lineSubtotal(items[i]) > lineSubtotal(items[target])) target = i;
  lineDiscounts[target] = round2(
    Math.min(round2(lineSubtotal(items[target])), Math.max(0, lineDiscounts[target] + diff))
  );
  return lineDiscounts;
};

// Núcleo: descuento por línea (alineado con `items`), ya redondeado a 2 decimales.
// Devuelve un arreglo de ceros si la oferta no aplica.
export const computeLineDiscounts = (offer, items) => {
  const list = items || [];
  const zeros = list.map(() => 0);
  if (!offer || !isOfferApplicable(offer, list)) return zeros;

  const eligibleIdx = [];
  list.forEach((it, i) => { if (isItemEligible(offer, it)) eligibleIdx.push(i); });

  if (offer.discount_type === "buy_x_get_y") {
    const X = Number(offer.buy_quantity) || 0;
    const Y = Number(offer.paid_quantity) || 0;
    if (X < 2 || Y < 1 || Y >= X) return zeros;
    const groups = new Map();
    for (const i of eligibleIdx) {
      const pid = list[i].product_id;
      if (!groups.has(pid)) groups.set(pid, []);
      groups.get(pid).push(i);
    }
    const out = [...zeros];
    for (const idxs of groups.values()) {
      const totalQty = idxs.reduce((s, i) => s + qtyOf(list[i]), 0);
      let free = Math.floor(totalQty / X) * (X - Y);
      // Más baratas primero; empate → orden original de las líneas
      const sorted = [...idxs].sort((a, b) => priceOf(list[a]) - priceOf(list[b]) || a - b);
      for (const i of sorted) {
        if (free <= 0) break;
        const take = Math.min(free, qtyOf(list[i]));
        out[i] = round2(out[i] + take * priceOf(list[i]));
        free -= take;
      }
    }
    return out;
  }

  const value = Number(offer.discount_value) || 0;
  if (value <= 0) return zeros;

  if (offer.discount_type === "percentage") {
    const pct = Math.min(value, 100) / 100;
    const eligibleSub = eligibleIdx.reduce((s, i) => s + lineSubtotal(list[i]), 0);
    const total = round2(eligibleSub * pct);
    const out = [...zeros];
    for (const i of eligibleIdx) out[i] = round2(lineSubtotal(list[i]) * pct);
    return settleResidual(out, list, eligibleIdx, total);
  }

  if (offer.discount_type === "fixed") {
    const out = [...zeros];
    if (fixedModeOf(offer) === "per_unit") {
      for (const i of eligibleIdx)
        out[i] = round2(Math.min(value * qtyOf(list[i]), lineSubtotal(list[i])));
      return out;
    }
    const eligibleSub = eligibleIdx.reduce((s, i) => s + lineSubtotal(list[i]), 0);
    const total = round2(Math.min(value, eligibleSub));
    if (eligibleSub <= 0) return zeros;
    for (const i of eligibleIdx) out[i] = round2((total * lineSubtotal(list[i])) / eligibleSub);
    return settleResidual(out, list, eligibleIdx, total);
  }

  return zeros;
};

export const calcDiscount = (offer, items) =>
  round2(computeLineDiscounts(offer, items).reduce((s, d) => s + d, 0));

// Elegir la oferta GANADORA entre una lista de candidatas.
// Regla: mayor prioridad gana; si empatan, mayor descuento para el cliente. No se suman.
// `_subtotal` se mantiene por compatibilidad de firma.
// eslint-disable-next-line no-unused-vars
export const pickWinningOffer = (candidates, items, _subtotal) => {
  let winner = null,
    winnerDiscount = 0;
  for (const o of candidates || []) {
    if (!isOfferApplicable(o, items)) continue;
    const d = calcDiscount(o, items);
    if (d <= 0) continue;
    if (!winner) {
      winner = o;
      winnerDiscount = d;
      continue;
    }
    const pr = priorityRank(o),
      pw = priorityRank(winner);
    if (pr > pw || (pr === pw && d > winnerDiscount)) {
      winner = o;
      winnerDiscount = d;
    }
  }
  return { winner, discount: winnerDiscount };
};

// Reparte el descuento por línea según el tipo de oferta.
// Devuelve cada item con { ...it, original_price, discount_amount, price (unitario desc.), offer_id }.
// `totalDiscount` <= 0 o sin oferta = sin descuento; si no, el reparto lo decide el motor
// (la suma por línea siempre es igual a calcDiscount(offer, items)).
export const distributeDiscount = (offer, items, totalDiscount) => {
  if (!offer || !(Number(totalDiscount) > 0))
    return (items || []).map((it) => ({ ...it, original_price: it.price, discount_amount: 0 }));
  const lines = computeLineDiscounts(offer, items);
  return items.map((it, i) => {
    const d = lines[i];
    if (!d) return { ...it, original_price: it.price, discount_amount: 0 };
    const price = priceOf(it);
    return {
      ...it,
      original_price: it.price,
      discount_amount: d,
      price: Math.max(0, price - d / qtyOf(it)),
      offer_id: offer.offer_id,
    };
  });
};
