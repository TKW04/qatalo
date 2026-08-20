// Cálculo del reporte de clientes.
// Entrada: array de customers (cada uno con create_date y transactions[]).
// Salida: filas con antigüedad, última venta, producto favorito, LTV por moneda y # de órdenes.

const PAID_STATUSES = new Set(["Aprobada", "Entregada"]);

const countOrders = (txs) => {
  const groups = new Set();
  txs.forEach((t) => groups.add(t.order_group || t.transaction_id));
  return groups.size;
};

// Devuelve { DOP: 1500, USD: 45 } — suma LTV por moneda
const ltvByCurrency = (paid) => {
  const map = {};
  for (const t of paid) {
    const cur = t.currency || (t.payment_method?.currency) || "";
    if (!cur) continue;
    const line = (Number(t.price) || 0) * (Number(t.quantity) || 1);
    const deliv = Number(t.delivery_price) || 0;
    const disc = Number(t.discount_amount) || 0;
    map[cur] = (map[cur] || 0) + line + deliv - disc;
  }
  return map;
};

export const buildCustomerReport = (customers = []) => {
  return customers.map((c) => {
    const txs = c.transactions || [];
    const paid = txs.filter((t) => PAID_STATUSES.has(t.status));

    // Última venta (solo pagadas)
    let lastSale = "";
    for (const t of paid) {
      const d = t.create_date || "";
      if (d > lastSale) lastSale = d;
    }

    // Producto favorito: por unidades totales, desempate por frecuencia
    const stats = {};
    for (const t of paid) {
      const name = t.product_name || "—";
      const qty = Number(t.quantity) || 0;
      if (!stats[name]) stats[name] = { units: 0, times: 0 };
      stats[name].units += qty;
      stats[name].times += 1;
    }
    let favorite = "—", favUnits = 0, favTimes = 0;
    for (const [name, s] of Object.entries(stats)) {
      if (s.units > favUnits || (s.units === favUnits && s.times > favTimes)) {
        favorite = name; favUnits = s.units; favTimes = s.times;
      }
    }

    const ltv = ltvByCurrency(paid);
    const currencies = Object.keys(ltv);

    const fullName =
      c.full_name || `${c.given_name || ""} ${c.family_name || ""}`.trim() || c.email || "—";

    return {
      customer_id: c.customer_id,
      name: fullName,
      email: c.email || "",
      phone: c.phone || "",
      created: c.create_date || "",
      last_sale: lastSale,
      favorite_product: favUnits > 0 ? favorite : "—",
      favorite_units: favUnits,
      orders_count: countOrders(paid),
      ltv,           // { DOP: X, USD: Y }
      currencies,    // ["DOP"] o ["DOP","USD"]
    };
  });
};

// Formatea fecha ISO a legible corto (es-DO). Devuelve "—" si vacío.
export const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
};

// "Hace X días/meses" a partir de una fecha ISO.
export const timeAgo = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} ${months === 1 ? "mes" : "meses"}`;
  const years = Math.floor(months / 12);
  return `hace ${years} ${years === 1 ? "año" : "años"}`;
};