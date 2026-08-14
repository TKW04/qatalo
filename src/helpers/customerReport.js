// Cálculo del reporte de clientes.
// Entrada: array de customers (cada uno con create_date y transactions[]).
// Salida: filas con antigüedad, última venta, producto favorito, LTV y # de órdenes.

const PAID_STATUSES = new Set(["Aprobada", "Entregada"]);

// Une transacciones por order_group para contar "órdenes" (no líneas sueltas).
const countOrders = (txs) => {
  const groups = new Set();
  txs.forEach((t) => groups.add(t.order_group || t.transaction_id));
  return groups.size;
};

export const buildCustomerReport = (customers = []) => {
  return customers.map((c) => {
    const txs = c.transactions || [];
    const paid = txs.filter((t) => PAID_STATUSES.has(t.status));

    // Última venta (solo pagadas): fecha más reciente
    let lastSale = "";
    for (const t of paid) {
      const d = t.create_date || "";
      if (d > lastSale) lastSale = d;
    }

    // Producto favorito: por unidades totales, desempate por frecuencia (nº de veces)
    const stats = {}; // product_name -> { units, times }
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

    // LTV: total gastado en órdenes pagadas (precio*cantidad + delivery - descuento)
    const ltv = paid.reduce((sum, t) => {
      const line = (Number(t.price) || 0) * (Number(t.quantity) || 1);
      const deliv = Number(t.delivery_price) || 0;
      const disc = Number(t.discount_amount) || 0;
      return sum + line + deliv - disc;
    }, 0);

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
      ltv,
      currency: paid[0]?.payment_method?.currency || txs[0]?.payment_method?.currency || "",
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