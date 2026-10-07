import { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { saveAs } from "file-saver";
import { currencies, formatted } from "../helpers/utils";
import Select from "./Select";
import DatePicker from "./DatePicker";
import styles from "./SellReport.module.css"; // misma paleta visual
import { Download } from "lucide-react";
import { Button, StatusBadge, useChartAnimation, SortableHeader, useSortableData } from "./admin";

const PAID = ["Aprobada", "Entregada"];
// Un solo color de marca para barras; estados con tokens --state-* (StatusBadge).
const BAR_COLOR = "var(--color-interactive)";
const GRID_COLOR = "var(--color-line)";
const AXIS_TICK = { fill: "var(--color-ink-soft)", fontSize: 11 };
const NO_LOC = "Sin especificar";
const NO_VAR = "Sin variante";

// Columnas ordenables: valores crudos (montos/cantidades como número, sin convertir monedas).
const noDash = (v) => (v === "—" ? "" : v);
const SUMMARY_SORT = {
  product_name: { type: "text", value: (g) => noDash(g.product_name.trim()) },
  variant: { type: "text", value: (g) => (g.variant === NO_VAR ? "" : g.variant.trim()) },
  currency: { type: "text", value: (g) => noDash(g.currency) },
  units: { type: "number" },
  avg: { type: "number", value: (g) => (g.units ? g.revenue / g.units : 0) },
  revenue: { type: "number" },
  totalDiscount: { type: "number" },
};
const DETAIL_SORT = {
  product_name: { type: "text", value: (r) => noDash(r.product_name.trim()) },
  variant: { type: "text", value: (r) => r.variant_label.trim() },
  quantity: { type: "number" },
  price: { type: "number" },
  total: { type: "number" },
  status: { type: "text" },
  locality: { type: "text" },
  date: { type: "date" },
};

const flattenWithVariants = (customers) => {
  const rows = [];
  customers.forEach((c) =>
    (c.transactions || []).forEach((t) => {
      rows.push({
        product_id: t.product_id,
        full_name: c.full_name || `${c.given_name || ""} ${c.family_name || ""}`.trim(),
        product_name: (t.product_name || "").trim() || "—",
        variant_label: t.variant
          ? [t.variant.color, t.variant.size].filter(Boolean).join(" / ")
          : "",
        quantity: Number(t.quantity) || 0,
        price: Number(t.price) || 0,
        total: (Number(t.price) || 0) * (Number(t.quantity) || 0),
        // Priorizar t.currency (moneda elegida por el cliente) sobre la del método de pago
        currency: t.currency || t.payment_method?.currency || "",
        status: t.status || "",
        date: (t.create_date || "").slice(0, 10),
        locality: t.locality || "",
        original_price: Number(t.original_price) || Number(t.price) || 0,
        discount_amount: Number(t.discount_amount) || 0,
        offer_name: t.offer_name || "",
      });
    })
  );
  return rows;
};

const symbolOf = (code) => currencies.find((c) => c.code === code)?.symbol || code || "";

const ProductReport = ({ customers = [] }) => {
  const anim = useChartAnimation();
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
  const hasMultiCurrency = currencyCodes.length > 1;

  const [selectedProduct, setSelectedProduct] = useState("all");
  // Si hay varias monedas, arrancar en "all" para ver el desglose completo
  const [currency, setCurrency] = useState(currencyCodes.length === 1 ? currencyCodes[0] : "all");
  const [locality, setLocality] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const hasLocalities = localityCodes.length > 0;

  const rows = useMemo(
    () =>
      allRows.filter(
        (r) =>
          (selectedProduct === "all" || r.product_name.trim() === selectedProduct.trim()) &&
          (currency === "all" || r.currency === currency) &&
          (locality === "all" || (r.locality || NO_LOC) === locality) &&
          (!from || r.date >= from) &&
          (!to || r.date <= to)
      ),
    [allRows, selectedProduct, currency, locality, from, to]
  );
  const paidRows = useMemo(() => rows.filter((r) => PAID.includes(r.status)), [rows]);

  // Tabla agrupada por producto + variante + MONEDA (para no mezclar montos de distintas divisas)
  const grouped = useMemo(() => {
    const map = {};
    paidRows.forEach((r) => {
      const vk = r.variant_label || NO_VAR;
      const cur = r.currency || "—";
      const key = `${r.product_name.trim()}||${vk}||${cur}`;
      if (!map[key]) map[key] = { product_name: r.product_name.trim(), variant: vk, currency: cur, units: 0, revenue: 0, totalDiscount: 0 };
      map[key].units += r.quantity;
      map[key].revenue += r.total;
      map[key].totalDiscount += r.discount_amount || 0;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [paidRows]);

  // Orden por columna (sin columna activa = orden original: resumen por ingresos desc.)
  const summarySort = useSortableData(grouped, SUMMARY_SORT);
  const detailSort = useSortableData(rows, DETAIL_SORT);
  const sortedGrouped = summarySort.sorted;
  const sortedRows = detailSort.sorted;

  const hasVariants = useMemo(() => paidRows.some((r) => r.variant_label), [paidRows]);
  const hasDiscounts = useMemo(() => grouped.some(g => g.totalDiscount > 0), [grouped]);

  // KPIs: ingresos separados por moneda, unidades y órdenes sí se pueden sumar (son cantidades, no dinero)
  const stats = useMemo(() => {
    const revByCur = {};
    paidRows.forEach((r) => {
      const cur = r.currency || "—";
      revByCur[cur] = (revByCur[cur] || 0) + r.total;
    });
    const units = paidRows.reduce((s, r) => s + r.quantity, 0);
    const distinctProducts = new Set(paidRows.map((r) => r.product_name.trim())).size;
    // Precio promedio: solo tiene sentido si estamos viendo una sola moneda
    const singleCur = Object.keys(revByCur).length === 1 ? Object.keys(revByCur)[0] : null;
    const avgPrice = singleCur && units ? revByCur[singleCur] / units : null;
    return {
      revByCur, units, orders: rows.length, paidOrders: paidRows.length,
      distinctProducts, avgPrice, avgCur: singleCur,
    };
  }, [rows, paidRows]);

  // Datos del gráfico: si hay multi-moneda y vista "Todos", usar unidades (comparable); si no, usar ingresos
  const useUnitsForChart = hasMultiCurrency && currency === "all";

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
    const key = useUnitsForChart ? "units" : "revenue";
    return {
      chartData: Object.values(map).sort((a, b) => b[key] - a[key]).slice(0, 10),
      chartTitle: useUnitsForChart ? "Unidades por producto (todas las monedas)" : "Ingresos por producto",
      chartKey: key,
    };
  }, [paidRows, selectedProduct, hasVariants, useUnitsForChart]);

  const exportToExcel = async () => {
    const XLSX = await import("xlsx-js-style");
    const hStyle = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 }, fill: { fgColor: { rgb: "113F67" } }, alignment: { horizontal: "center" } };
    const applyHeader = (ws, headers) => headers.forEach((_, c) => { const cell = ws[XLSX.utils.encode_cell({ r: 0, c })]; if (cell) cell.s = hStyle; });

    // Hoja 1: Resumen por producto + variante + moneda
    const sumH = ["Producto", ...(hasVariants ? ["Variante"] : []), "Moneda", "Unidades", "Precio prom.", "Ingresos", ...(hasDiscounts ? ["Descuento"] : [])];
    const sumRows = sortedGrouped.map((g) => [
      g.product_name.trim(), ...(hasVariants ? [g.variant] : []), g.currency,
      g.units, g.units ? g.revenue / g.units : 0, g.revenue,
      ...(hasDiscounts ? [g.totalDiscount || 0] : []),
    ]);
    const wsSummary = XLSX.utils.aoa_to_sheet([sumH, ...sumRows]);
    applyHeader(wsSummary, sumH);

    // Hoja 2: Detalle completo
    const detH = ["Producto", ...(hasVariants ? ["Variante"] : []), "Moneda", "Cant.", "Precio", "Total", "Estado", ...(hasLocalities ? ["Localidad"] : []), "Fecha"];
    const detRows = sortedRows.map((r) => [
      r.product_name.trim(), ...(hasVariants ? [r.variant_label || NO_VAR] : []), r.currency,
      r.quantity, r.price, r.total, r.status, ...(hasLocalities ? [r.locality || NO_LOC] : []), r.date,
    ]);
    const wsDetail = XLSX.utils.aoa_to_sheet([detH, ...detRows]);
    applyHeader(wsDetail, detH);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen por producto");
    XLSX.utils.book_append_sheet(wb, wsDetail, "Detalle");
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }), "Reporte_Productos.xlsx");
  };

  // Totales por moneda (no se mezclan)
  const grandTotalsByCur = useMemo(() => {
    const map = {};
    grouped.forEach((g) => { map[g.currency] = (map[g.currency] || 0) + g.revenue; });
    return map;
  }, [grouped]);
  const grandUnits = grouped.reduce((s, g) => s + g.units, 0);

  return (
    <div>
      {/* Filtros */}
      <div className={styles.filters}>
        <label className={styles.filter}>
          Producto
          <Select
            value={selectedProduct}
            onChange={setSelectedProduct}
            options={[
              { value: "all", label: "Todos los productos" },
              ...productNames.map((n) => ({ value: n, label: n })),
            ]}
          />
        </label>
        {currencyCodes.length > 0 && (
          <label className={styles.filter}>
            Moneda
            <Select
              value={currency}
              onChange={setCurrency}
              options={[
                ...(hasMultiCurrency ? [{ value: "all", label: "Todas las monedas" }] : []),
                ...currencyCodes.map((c) => ({ value: c, label: c })),
              ]}
              searchable={false}
            />
          </label>
        )}
        {hasLocalities && (
          <label className={styles.filter}>
            Localidad
            <Select
              value={locality}
              onChange={setLocality}
              options={[
                { value: "all", label: "Todas" },
                ...localityCodes.map(l => ({ value: l, label: l })),
                { value: NO_LOC, label: "Sin especificar" },
              ]}
            />
          </label>
        )}
        <div className={styles.filter}>
          <span id="product-report-from-label">Desde</span>
          <DatePicker className="input" aria-labelledby="product-report-from-label" value={from} max={to || undefined} onChange={(v) => setFrom(v)} />
        </div>
        <div className={styles.filter}>
          <span id="product-report-to-label">Hasta</span>
          <DatePicker className="input" aria-labelledby="product-report-to-label" value={to} min={from || undefined} onChange={(v) => setTo(v)} />
        </div>
        <Button variant="secondary" icon={Download} className={styles.exportBtn} onClick={exportToExcel}>Exportar a Excel</Button>
      </div>

      {/* KPIs: ingresos por moneda, separados */}
      <div className={styles.kpis}>
        {Object.entries(stats.revByCur).map(([cur, val]) => (
          <div key={cur} className={styles.kpi}>
            <span>Ingresos {cur !== "—" ? cur : ""} cobrados</span>
            <strong>{symbolOf(cur)} {formatted(val)}</strong>
          </div>
        ))}
        <div className={styles.kpi}><span>Unidades vendidas</span><strong>{stats.units}</strong></div>
        <div className={styles.kpi}><span>Órdenes totales</span><strong>{stats.orders}</strong></div>
        {selectedProduct === "all" && <div className={styles.kpi}><span>Productos distintos</span><strong>{stats.distinctProducts}</strong></div>}
        {stats.avgPrice !== null && (
          <div className={styles.kpi}><span>Precio promedio</span><strong>{symbolOf(stats.avgCur)} {formatted(stats.avgPrice)}</strong></div>
        )}
      </div>

      {/* Gráfico */}
      {chartData.length > 0 && (
        <div className={`${styles.chartsGrid} ${styles.single}`}>
          <div className={styles.chartCard}>
            <h3>{chartTitle}</h3>
            <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 44)}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
                <XAxis type="number" tick={AXIS_TICK} stroke={GRID_COLOR} tickFormatter={(v) => chartKey === "revenue" ? `${symbolOf(currency !== "all" ? currency : "")} ${formatted(v)}` : String(v)} />
                <YAxis type="category" dataKey="name" width={130} tick={AXIS_TICK} stroke={GRID_COLOR} />
                <Tooltip formatter={(v) => chartKey === "revenue" ? `${symbolOf(currency !== "all" ? currency : "")} ${formatted(v)}` : `${v} uds.`} />
                <Bar dataKey={chartKey} radius={[0, 6, 6, 0]} fill={BAR_COLOR} {...anim} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabla resumen agrupada (por producto + variante + moneda) */}
      <div className={styles.tableCard}>
        <h3>Resumen por producto{hasVariants ? " y variante" : ""} (órdenes cobradas)</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <SortableHeader sortKey="product_name" sort={summarySort}>Producto</SortableHeader>
                {hasVariants && <SortableHeader sortKey="variant" sort={summarySort}>Variante</SortableHeader>}
                {hasMultiCurrency && <SortableHeader sortKey="currency" sort={summarySort}>Moneda</SortableHeader>}
                <SortableHeader sortKey="units" sort={summarySort}>Unidades</SortableHeader>
                <SortableHeader sortKey="avg" sort={summarySort}>Precio prom.</SortableHeader>
                <SortableHeader sortKey="revenue" sort={summarySort}>Ingresos</SortableHeader>
                {hasDiscounts && <SortableHeader sortKey="totalDiscount" sort={summarySort}>Descuento total</SortableHeader>}
              </tr>
            </thead>
            <tbody>
              {sortedGrouped.map((g, i) => (
                <tr key={i}>
                  <td>{g.product_name.trim()}</td>
                  {hasVariants && <td>{g.variant.trim()}</td>}
                  {hasMultiCurrency && <td>{g.currency}</td>}
                  <td>{g.units}</td>
                  <td>{symbolOf(g.currency)} {formatted(g.units ? g.revenue / g.units : 0)}</td>
                  <td><strong>{symbolOf(g.currency)} {formatted(g.revenue)}</strong></td>
                  {hasDiscounts && (
                    <td className={g.totalDiscount > 0 ? styles.positive : undefined}>
                      {g.totalDiscount > 0 ? `− ${symbolOf(g.currency)} ${formatted(g.totalDiscount)}` : "—"}
                    </td>
                  )}
                </tr>
              ))}
              {grouped.length === 0 && (
                <tr><td colSpan={hasVariants ? 6 : 5} className={styles.tableEmpty}>Sin órdenes cobradas en el rango seleccionado.</td></tr>
              )}
              {grouped.length > 0 && (
                <tr className={styles.totalRow}>
                  <td colSpan={(hasVariants ? 1 : 0) + (hasMultiCurrency ? 2 : 1)}>Total</td>
                  <td>{grandUnits}</td>
                  <td></td>
                  <td>
                    {Object.entries(grandTotalsByCur).map(([cur, val]) => (
                      <div key={cur}>{symbolOf(cur)} {formatted(val)}</div>
                    ))}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla detalle completo */}
      <div className={`${styles.tableCard} ${styles.stacked}`}>
        <h3>Detalle de todas las órdenes</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <SortableHeader sortKey="product_name" sort={detailSort}>Producto</SortableHeader>
                {hasVariants && <SortableHeader sortKey="variant" sort={detailSort}>Variante</SortableHeader>}
                <SortableHeader sortKey="quantity" sort={detailSort}>Cant.</SortableHeader>
                <SortableHeader sortKey="price" sort={detailSort}>Precio</SortableHeader>
                <SortableHeader sortKey="total" sort={detailSort}>Total</SortableHeader>
                <SortableHeader sortKey="status" sort={detailSort}>Estado</SortableHeader>
                {hasLocalities && <SortableHeader sortKey="locality" sort={detailSort}>Localidad</SortableHeader>}
                <SortableHeader sortKey="date" sort={detailSort}>Fecha</SortableHeader>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r, i) => (
                <tr key={i}>
                  <td>{r.product_name.trim()}</td>
                  {hasVariants && <td>{r.variant_label.trim()}</td>}
                  <td>{r.quantity}</td>
                  <td>{symbolOf(r.currency)} {formatted(r.price)}</td>
                  <td>{symbolOf(r.currency)} {formatted(r.total)}</td>
                  <td>
                    <StatusBadge status={r.status} />
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