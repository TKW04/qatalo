import { useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { saveAs } from "file-saver";
import { currencies, formatted } from "../helpers/utils";
import styles from "./SellReport.module.css";

const PAID = ["Aprobada", "Entregada"];
const STATUS_COLORS = {
  "Pendiente de pago": "#F59E0B",
  "Pendiente de validación": "#3B82F6",
  Aprobada: "#10B981",
  Entregada: "#0E7490",
  Cancelada: "#EF4444",
};
const BAR_COLORS = ["#113F67", "#34699A", "#0E7490", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#6B7280"];

const flatten = (customers) => {
  const rows = [];
  customers.forEach((c) =>
    (c.transactions || []).forEach((t) =>
      rows.push({
        full_name: c.full_name || `${c.given_name} ${c.family_name}`,
        product_name: t.product_name || "—",
        quantity: Number(t.quantity) || 0,
        price: Number(t.price) || 0,
        total: (Number(t.price) || 0) * (Number(t.quantity) || 0),
        currency: t.payment_method?.currency || "",
        status: t.status,
        date: (t.create_date || "").slice(0, 10),
        delivery_day: t.delivery_day || "",
      })
    )
  );
  return rows;
};

const SellReport = ({ customers = [] }) => {
  const allRows = useMemo(() => flatten(customers), [customers]);
  const currencyCodes = useMemo(() => [...new Set(allRows.map((r) => r.currency).filter(Boolean))], [allRows]);

  const [currency, setCurrency] = useState(currencyCodes[0] || "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const symbol = currencies.find((c) => c.code === currency)?.symbol || currency || "";

  const rows = useMemo(
    () => allRows.filter((r) =>
      (!currency || r.currency === currency) &&
      (!from || r.date >= from) &&
      (!to || r.date <= to)
    ),
    [allRows, currency, from, to]
  );

  const stats = useMemo(() => {
    const paid = rows.filter((r) => PAID.includes(r.status));
    const revenue = paid.reduce((s, r) => s + r.total, 0);
    const delivered = rows.filter((r) => r.status === "Entregada").length;
    const cancelled = rows.filter((r) => r.status === "Cancelada").length;

    const byStatusMap = {};
    rows.forEach((r) => { byStatusMap[r.status] = (byStatusMap[r.status] || 0) + 1; });
    const byStatus = Object.entries(byStatusMap).map(([name, value]) => ({ name, value }));

    const byDayMap = {};
    paid.forEach((r) => { if (r.date) byDayMap[r.date] = (byDayMap[r.date] || 0) + r.total; });
    const byDay = Object.entries(byDayMap).sort((a, b) => a[0].localeCompare(b[0])).map(([date, total]) => ({ date, total }));

    const prodMap = {};
    paid.forEach((r) => {
      if (!prodMap[r.product_name]) prodMap[r.product_name] = { name: r.product_name, units: 0, revenue: 0 };
      prodMap[r.product_name].units += r.quantity;
      prodMap[r.product_name].revenue += r.total;
    });
    const topProducts = Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

    return {
      revenue, orders: rows.length, paidOrders: paid.length, delivered, cancelled,
      avgTicket: paid.length ? revenue / paid.length : 0,
      conversion: rows.length ? Math.round((delivered / rows.length) * 100) : 0,
      cancellation: rows.length ? Math.round((cancelled / rows.length) * 100) : 0,
      byStatus, byDay, topProducts,
    };
  }, [rows]);

  const exportToExcel = async () => {
    const XLSX = await import("xlsx-js-style");
    const header = ["Cliente", "Producto", "Cantidad", "Precio", "Total", "Estado", "Fecha"];
    const wsData = [header, ...rows.map((r) => [r.full_name, r.product_name, r.quantity, r.price, r.total, r.status, r.date])];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 13 }, alignment: { horizontal: "center" }, fill: { fgColor: { rgb: "113F67" } } };
    header.forEach((_, c) => { const cell = ws[XLSX.utils.encode_cell({ r: 0, c })]; if (cell) cell.s = headerStyle; });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer], { type: "application/octet-stream" }), "Ventas.xlsx");
  };

  return (
    <div>
      <div className={styles.filters}>
        {currencyCodes.length > 1 && (
          <label className={styles.filter}>Moneda
            <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {currencyCodes.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </label>
        )}
        <label className={styles.filter}>Desde<input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className={styles.filter}>Hasta<input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <button className={styles.exportBtn} onClick={exportToExcel}>Exportar a Excel</button>
      </div>

      <div className={styles.kpis}>
        <div className={styles.kpi}><span>Ingresos (cobrados)</span><strong>{symbol} {formatted(stats.revenue)}</strong></div>
        <div className={styles.kpi}><span>Órdenes</span><strong>{stats.orders}</strong></div>
        <div className={styles.kpi}><span>Ticket promedio</span><strong>{symbol} {formatted(stats.avgTicket)}</strong></div>
        <div className={styles.kpi}><span>Conversión (entregadas)</span><strong>{stats.conversion}%</strong></div>
        <div className={styles.kpi}><span>Cancelación</span><strong>{stats.cancellation}%</strong></div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Ingresos por día</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.byDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34699A" stopOpacity={0.6} /><stop offset="95%" stopColor="#34699A" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v) => `${symbol} ${formatted(v)}`} />
              <Area type="monotone" dataKey="total" stroke="#113F67" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3>Órdenes por estado</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stats.byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {stats.byStatus.map((s) => (<Cell key={s.name} fill={STATUS_COLORS[s.name] || "#6B7280"} />))}
              </Pie>
              <Tooltip />
              <Legend fontSize={11} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={`${styles.chartCard} ${styles.full}`}>
          <h3>Top productos (por ingreso)</h3>
          <ResponsiveContainer width="100%" height={Math.max(220, stats.topProducts.length * 42)}>
            <BarChart data={stats.topProducts} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
              <XAxis type="number" fontSize={11} />
              <YAxis type="category" dataKey="name" width={140} fontSize={11} />
              <Tooltip formatter={(v) => `${symbol} ${formatted(v)}`} />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                {stats.topProducts.map((_, i) => (<Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.tableCard}>
        <h3>Detalle de ventas</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Cliente</th><th>Producto</th><th>Cant</th><th>Precio</th><th>Total</th><th>Estado</th><th>Fecha</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.full_name}</td><td>{r.product_name}</td><td>{r.quantity}</td>
                  <td>{symbol} {formatted(r.price)}</td><td>{symbol} {formatted(r.total)}</td>
                  <td><span className={styles.badge} style={{ background: (STATUS_COLORS[r.status] || "#6B7280") + "22", color: STATUS_COLORS[r.status] || "#6B7280" }}>{r.status}</span></td>
                  <td>{r.date}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className={styles.tableEmpty}>Sin ventas en el rango seleccionado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellReport;