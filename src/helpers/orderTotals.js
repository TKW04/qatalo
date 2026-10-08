// Totales de órdenes guardadas.
// El backend (motor de ofertas) guarda por línea:
//   price           = precio unitario YA descontado (lo que paga el cliente)
//   original_price  = precio unitario base (antes del descuento)
//   discount_amount = descuento total de la línea
// Órdenes antiguas pueden no traer original_price/discount_amount: entonces price es el base.

const num = (v) => Number(v) || 0;
const qtyOf = (t) => Number(t.quantity) || 1;

// Lo que paga el cliente por la línea (sin envío).
export const lineNet = (t) => num(t.price) * qtyOf(t);

export const lineDiscount = (t) => num(t.discount_amount);

// Importe de la línea antes del descuento.
export const lineGross = (t) =>
  num(t.original_price) > 0 ? num(t.original_price) * qtyOf(t) : lineNet(t) + lineDiscount(t);

// Total de una transacción: Σ price·qty + envío (el descuento ya está en price).
export const txTotal = (t) => lineNet(t) + num(t.delivery_price);

export const orderTotals = (items = []) => {
  const subtotal = items.reduce((s, t) => s + lineGross(t), 0);
  const discount = items.reduce((s, t) => s + lineDiscount(t), 0);
  const delivery = items.reduce((s, t) => s + num(t.delivery_price), 0);
  const total = items.reduce((s, t) => s + txTotal(t), 0);
  return { subtotal, discount, delivery, total };
};
