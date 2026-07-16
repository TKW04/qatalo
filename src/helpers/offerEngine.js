// Motor de ofertas compartido: MISMA lógica para el carrito del cliente
// y para aplicar descuentos desde el panel admin. No dupliques estas reglas.
//
// Los "items" son genéricos: cada uno necesita { product_id, category_id?, price, quantity }.
// En el carrito son líneas del carrito; en el admin son transacciones de una orden
// (enriquecidas con category_id desde el producto).

// Prioridad como número para comparar (mayor gana)
const PRIORITY_RANK = { alta: 3, media: 2, baja: 1 };
export const priorityRank = (offer) =>
  PRIORITY_RANK[(offer?.priority || "media").toLowerCase()] || 2;

export const getApplicableItems = (offer, items) => {
  if (!offer) return [];
  if (offer.applies_to === "all") return items;
  if (offer.applies_to === "products")
    return items.filter((it) => (offer.product_ids || []).includes(it.product_id));
  if (offer.applies_to === "categories")
    return items.filter((it) => (offer.category_ids || []).includes(it.category_id || ""));
  return [];
};

export const isOfferApplicable = (offer, items, subtotal) => {
  if (!offer) return false;
  if ((offer.min_order_amount || 0) > 0 && subtotal < offer.min_order_amount) return false;
  return getApplicableItems(offer, items).length > 0;
};

export const calcDiscount = (offer, items) => {
  if (!offer) return 0;
  const applicable = getApplicableItems(offer, items);
  if (!applicable.length) return 0;

  if (offer.discount_type === "buy_x_get_y") {
    const X = Number(offer.buy_quantity) || 0;
    const Y = Number(offer.paid_quantity) || 0;
    if (X < 2 || Y < 1 || Y >= X) return 0;

    let total = 0;
    for (const it of applicable) {
      const qty = Number(it.quantity) || 0;
      const price = Number(it.price) || 0;
      const bloques = Math.floor(qty / X);
      const gratisPorBloque = X - Y;
      const unidadesGratis = bloques * gratisPorBloque;
      total += unidadesGratis * price;
    }
    return total;
  }

  const sub = applicable.reduce(
    (s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1),
    0
  );
  return offer.discount_type === "percentage"
    ? sub * ((Number(offer.discount_value) || 0) / 100)
    : Math.min(Number(offer.discount_value) || 0, sub);
};

// Elegir la oferta GANADORA entre una lista de candidatas.
// Regla: mayor prioridad gana; si empatan, mayor descuento para el cliente. No se suman.
export const pickWinningOffer = (candidates, items, subtotal) => {
  let winner = null,
    winnerDiscount = 0;
  for (const o of candidates) {
    if (!isOfferApplicable(o, items, subtotal)) continue;
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

// Distribuye el descuento proporcionalmente por item aplicable.
// Devuelve cada item con { ...it, original_price, discount_amount, price(desc.) }.
export const distributeDiscount = (offer, items, totalDiscount) => {
  if (totalDiscount <= 0 || !offer)
    return items.map((it) => ({ ...it, original_price: it.price, discount_amount: 0 }));

  const applicable = getApplicableItems(offer, items);

  if (offer.discount_type === "buy_x_get_y") {
    const X = Number(offer.buy_quantity) || 0;
    const Y = Number(offer.paid_quantity) || 0;
    return items.map((it) => {
      const isApp = applicable.some((a) => a.product_id === it.product_id);
      if (!isApp || X < 2 || Y < 1) return { ...it, original_price: it.price, discount_amount: 0 };
      const qty = Number(it.quantity) || 0;
      const price = Number(it.price) || 0;
      const bloques = Math.floor(qty / X);
      const unidadesGratis = bloques * (X - Y);
      const lineDiscount = unidadesGratis * price;
      const dpUnit = qty > 0 ? lineDiscount / qty : 0;
      return {
        ...it,
        original_price: it.price,
        discount_amount: lineDiscount,
        price: Math.max(0, price - dpUnit),
      };
    });
  }

  const appSub = applicable.reduce(
    (s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1),
    0
  );
  return items.map((it) => {
    const isApp = applicable.some((a) => a.product_id === it.product_id);
    if (!isApp) return { ...it, original_price: it.price, discount_amount: 0 };
    const itemTotal = (Number(it.price) || 0) * (Number(it.quantity) || 1);
    const proportion = appSub > 0 ? itemTotal / appSub : 0;
    const itemTotalDiscount = totalDiscount * proportion;
    const dpUnit = itemTotalDiscount / (Number(it.quantity) || 1);
    return {
      ...it,
      original_price: it.price,
      discount_amount: itemTotalDiscount,
      price: Math.max(0, Number(it.price) - dpUnit),
    };
  });
};