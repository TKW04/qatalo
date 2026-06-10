import { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { saveAs } from "file-saver";
import { currencies, formatted } from "../helpers/utils";
import styles from "./SellReport.module.css"; // misma paleta visual

const PAID = ["Aprobada", "Entregada"];
const STATUS_COLORS = {
  "Pendiente de pago": "#F59E0B",
  "Pendiente de validación": "#3B82F6",
  Aprobada: "#10B981",
  Entregada: "#0E7490",
  Cancelada: "#EF4444",
};
const BAR_COLORS = ["#113F67","#34699A","#0E7490","#10B981","#F59E0B","#8B5CF6","#EF4444","#6B7280"];
const NO_LOC = "Sin especificar";
const NO_VAR = "Sin variante";

const flattenWithVariants = (customers) => {
  const rows = [];
  customers.forEach((c) =>
    (c.transactions || []).forEach((t) => {
      rows.push({
        product_id: t.product_id,
        full_name: c.full_name || `${c.given_name || ""} ${c.family_name || ""}`.trim(),
        product_name: t.product_name.trim() || "—",
        // listo para variantes: cuando el backend envíe t.variant, aparecen solas
        variant_label: t.variant
          ? [t.variant.color, t.variant.size].filter(Boolean).join(" / ")
          : "",
        quantity: Number(t.quantity) || 0,
        price: Number(t.price) || 0,
        total: (Number(t.price) || 0) * (Number(t.quantity) || 0),
        currency: t.payment_method?.currency || "",
        status: t.status || "",
        date: (t.create_date || "").slice(0, 10),
        locality: t.locality || "",
      });
    })
  );
  return rows;
};

const ProductReport = ({ customers = [] }) => {
  const allRows = useMemo(() => flattenWithVariants(customers), [customers]);

  const productNames = useMemo(
    () => [...new Set(allRows.map((r) => r.product_name.trim()))].filter((n) => n !== "—").sort(),
    [allRows]
  );
  const currencyCodes = useMemo(
    () => [...new Set(allRows.map((r) => r.currency).filter(Boolean))],
    [allRows]
  );
  const localityCodes = useMemo(
    () => [...new Set(allRows.map((r) => r.locality).filter(Boolean))],
    [allRows]
  );

  const [selectedProduct, setSelectedProduct] = useState("all");
  const [currency, setCurrency] = useState(currencyCodes[0] || "");
  const [locality, setLocality] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const symbol = currencies.find((c) => c.code === currency)?.symbol || currency || "";
  const hasLocalities = localityCodes.length > 0;

  const rows = useMemo(
    () =>
      allRows.filter(
        (r) =>
          (selectedProduct === "all" || r.product_name.trim() === selectedProduct.trim()) &&
          (!currency || r.currency === currency) &&
          (locality === "all" || (r.locality || NO_LOC) === locality) &&
          (!from || r.date >= from) &&
          (!to || r.date <= to)
      ),
    [allRows, selectedProduct, currency, locality, from, to]
  );

  const paidRows = useMemo(() => rows.filter((r) => PAID.includes(r.status)), [rows]);
  const hasVariants = useMemo(() => paidRows.some((r) => r.variant_label), [paidRows]);

  // KPIs
  const stats = useMemo(() => {
    const revenue = paidRows.reduce((s, r) => s + r.total, 0);
    const units = paidRows.reduce((s, r) => s + r.quantity, 0);
    const distinctProducts = new Set(paidRows.map((r) => r.product_name.trim())).size;
    return {
      revenue, units, orders: rows.length, paidOrders: paidRows.length,
      distinctProducts, avgPrice: units ? revenue / units : 0,
    };
  }, [rows, paidRows]);

  // Tabla agrupada por producto + variante
  const grouped = useMemo(() => {
    const map = {};
    paidRows.forEach((r) => {
      const vk = r.variant_label || NO_VAR;
      const key = `${r.product_name.trim()}||${vk}`;
      if (!map[key]) map[key] = { product_name: r.product_name.trim(), variant: vk, units: 0, revenue: 0 };
      map[key].units += r.quantity;
      map[key].revenue += r.total;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [paidRows]);

  // Datos del gráfico según selección
  const { chartData, chartTitle, chartKey } = useMemo(() => {
    if (selectedProduct !== "all" && hasVariants) {
      const map = {};
      paidRows.forEach((r) => {
        const k = r.variant_label || NO_VAR;
        if (!map[k]) map[k] = { name: k, units: 0, revenue: 0 };
        map[k].units += r.quantity;
        map[k].revenue += r.total;
      });
      return { chartData: Object.values(map).sort((a, b) => b.units - a.units), chartTitle: "Unidades por variante", chartKey: "units" };
    }
    if (selectedProduct !== "all") {
      const map = {};
      paidRows.forEach((r) => {
        if (!r.date) return;
        if (!map[r.date]) map[r.date] = { name: r.date, units: 0, revenue: 0 };
        map[r.date].units += r.quantity;
        map[r.date].revenue += r.total;
      });
      return { chartData: Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v), chartTitle: "Unidades por fecha", chartKey: "units" };
    }
    const map = {};
    paidRows.forEach((r) => {
      if (!map[r.product_id]) map[r.product_id] = { name: r.product_name.trim(), units: 0, revenue: 0 };
      map[r.product_id].units += r.quantity;
      map[r.product_id].revenue += r.total;
    });
    return { chartData: Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10), chartTitle: "Ingresos por producto", chartKey: "revenue" };
  }, [paidRows, selectedProduct, hasVariants]);

  const exportToExcel = async () => {
    const XLSX = await import("xlsx-js-style");
    const hStyle = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 }, fill: { fgColor: { rgb: "113F67" } }, alignment: { horizontal: "center" } };
    const applyHeader = (ws, headers) => headers.forEach((_, c) => { const cell = ws[XLSX.utils.encode_cell({ r: 0, c })]; if (cell) cell.s = hStyle; });

    // Hoja 1: Resumen por producto (+ variante si hay)
    const sumH = ["Producto", ...(hasVariants ? ["Variante"] : []), "Unidades", "Precio prom.", "Ingresos"];
    const sumRows = grouped.map((g) => [g.product_name.trim(), ...(hasVariants ? [g.variant] : []), g.units, g.units ? g.revenue / g.units : 0, g.revenue]);
    const wsSummary = XLSX.utils.aoa_to_sheet([sumH, ...sumRows]);
    applyHeader(wsSummary, sumH);

    // Hoja 2: Detalle completo
    const detH = ["Producto", ...(hasVariants ? ["Variante"] : []), "Cant.", "Precio", "Total", "Estado", ...(hasLocalities ? ["Localidad"] : []), "Fecha"];
    const detRows = rows.map((r) => [r.product_name.trim(), ...(hasVariants ? [r.variant_label || NO_VAR] : []), r.quantity, r.price, r.total, r.status, ...(hasLocalities ? [r.locality || NO_LOC] : []), r.date]);
    const wsDetail = XLSX.utils.aoa_to_sheet([detH, ...detRows]);
    applyHeader(wsDetail, detH);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen por producto");
    XLSX.utils.book_append_sheet(wb, wsDetail, "Detalle");
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }), "Reporte_Productos.xlsx");
  };

  const grandTotal = grouped.reduce((s, g) => s + g.revenue, 0);
  const grandUnits = grouped.reduce((s, g) => s + g.units, 0);

  return (
    <div>
      {/* Filtros */}
      <div className={styles.filters}>
        <label className={styles.filter}>
          Producto
          <select className="input" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
            <option value="all">Todos los productos</option>
            {productNames.map((n) => (<option key={n} value={n}>{n}</option>))}
          </select>
        </label>
        {currencyCodes.length > 1 && (
          <label className={styles.filter}>
            Moneda
            <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {currencyCodes.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </label>
        )}
        {hasLocalities && (
          <label className={styles.filter}>
            Localidad
            <select className="input" value={locality} onChange={(e) => setLocality(e.target.value)}>
              <option value="all">Todas</option>
              {localityCodes.map((l) => (<option key={l} value={l}>{l}</option>))}
              <option value={NO_LOC}>Sin especificar</option>
            </select>
          </label>
        )}
        <label className={styles.filter}>Desde<input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className={styles.filter}>Hasta<input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <button className={styles.exportBtn} onClick={exportToExcel}>Exportar a Excel</button>
      </div>

      {/* KPIs */}
      <div className={styles.kpis}>
        <div className={styles.kpi}><span>Ingresos cobrados</span><strong>{symbol} {formatted(stats.revenue)}</strong></div>
        <div className={styles.kpi}><span>Unidades vendidas</span><strong>{stats.units}</strong></div>
        <div className={styles.kpi}><span>Órdenes totales</span><strong>{stats.orders}</strong></div>
        {selectedProduct === "all" && <div className={styles.kpi}><span>Productos distintos</span><strong>{stats.distinctProducts}</strong></div>}
        <div className={styles.kpi}><span>Precio promedio</span><strong>{symbol} {formatted(stats.avgPrice)}</strong></div>
      </div>

      {/* Gráfico */}
      {chartData.length > 0 && (
        <div className={styles.chartsGrid} style={{ gridTemplateColumns: "1fr" }}>
          <div className={styles.chartCard}>
            <h3>{chartTitle}</h3>
            <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 44)}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                <XAxis type="number" fontSize={11} tickFormatter={(v) => chartKey === "revenue" ? `${symbol} ${formatted(v)}` : String(v)} />
                <YAxis type="category" dataKey="name" width={160} fontSize={11} />
                <Tooltip formatter={(v) => chartKey === "revenue" ? `${symbol} ${formatted(v)}` : `${v} uds.`} />
                <Bar dataKey={chartKey} radius={[0, 6, 6, 0]}>
                  {chartData.map((_, i) => (<Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabla resumen agrupada */}
      <div className={styles.tableCard}>
        <h3>Resumen por producto{hasVariants ? " y variante" : ""} (órdenes cobradas)</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                {hasVariants && <th>Variante</th>}
                <th>Unidades</th>
                <th>Precio prom.</th>
                <th>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((g, i) => (
                <tr key={i}>
                  <td>{g.product_name.trim()}</td>
                  {hasVariants && <td>{g.variant.trim()}</td>}
                  <td>{g.units}</td>
                  <td>{symbol} {formatted(g.units ? g.revenue / g.units : 0)}</td>
                  <td><strong>{symbol} {formatted(g.revenue)}</strong></td>
                </tr>
              ))}
              {grouped.length === 0 && (
                <tr><td colSpan={hasVariants ? 5 : 4} className={styles.tableEmpty}>Sin órdenes cobradas en el rango seleccionado.</td></tr>
              )}
              {grouped.length > 0 && (
                <tr style={{ background: "#f0f7ff", fontWeight: 700 }}>
                  <td colSpan={hasVariants ? 2 : 1}>Total</td>
                  <td>{grandUnits}</td>
                  <td></td>
                  <td>{symbol} {formatted(grandTotal)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla detalle completo */}
      <div className={styles.tableCard} style={{ marginTop: "1.25rem" }}>
        <h3>Detalle de todas las órdenes</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                {hasVariants && <th>Variante</th>}
                <th>Cant.</th><th>Precio</th><th>Total</th><th>Estado</th>
                {hasLocalities && <th>Localidad</th>}
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.product_name.trim()}</td>
                  {hasVariants && <td>{r.variant_label.trim()}</td>}
                  <td>{r.quantity}</td>
                  <td>{symbol} {formatted(r.price)}</td>
                  <td>{symbol} {formatted(r.total)}</td>
                  <td>
                    <span className={styles.badge} style={{ background: (STATUS_COLORS[r.status] || "#6B7280") + "22", color: STATUS_COLORS[r.status] || "#6B7280" }}>
                      {r.status}
                    </span>
                  </td>
                  {hasLocalities && <td>{r.locality || NO_LOC}</td>}
                  <td>{r.date}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={10} className={styles.tableEmpty}>Sin órdenes en el rango seleccionado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductReport;