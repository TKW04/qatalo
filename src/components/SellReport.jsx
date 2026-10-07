import { useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { saveAs } from "file-saver";
import { currencies, formatted } from "../helpers/utils";
import styles from "./SellReport.module.css";
import Select from "./Select";
import DatePicker, { parseISODate } from "./DatePicker";
import { Download } from "lucide-react";
import { Button, StatusBadge, statusColor, useChartAnimation, useAnimatedNumber, SortableHeader, useSortableData } from "./admin";

// Cifra de KPI: interpola (<=250ms) solo cuando cambia un filtro; al montar muestra el valor final.
const KpiValue = ({ value, format = (v) => Math.round(v), className }) => {
  const shown = useAnimatedNumber(value);
  return <strong className={className}>{format(shown)}</strong>;
};

const PAID = ["Aprobada", "Entregada"];
// Un solo color de marca para barras; estados con tokens --state-*.
const BAR_COLOR = "var(--color-interactive)";
const GRID_COLOR = "var(--color-line)";
const AXIS_TICK = { fill: "var(--color-ink-soft)", fontSize: 11 };
const NO_LOC = "Sin especificar";

// Columnas ordenables del detalle: valores crudos (no el texto formateado).
const SORT_COLUMNS = {
  full_name: { type: "text" },
  product_name: { type: "text", value: (r) => (r.product_name === "—" ? "" : r.product_name) },
  quantity: { type: "number" },
  price: { type: "number" },
  total: { type: "number" },
  status: { type: "text" },
  locality: { type: "text" },
  date: { type: "date" },
  offer: { type: "text", value: (r) => r.offer_code || r.offer_name },
  discount_amount: { type: "number" },
};

const flatten = (customers) => {
  const rows = [];
  customers.forEach((c) =>
    (c.transactions || []).forEach((t) =>
      rows.push({
        product_id: t.product_id,
        full_name: c.full_name || `${c.given_name} ${c.family_name}`,
        product_name: (t.product_name || "").trim() || "—",
        quantity: Number(t.quantity) || 0,
        price: Number(t.price) || 0,
        total: (Number(t.price) || 0) * (Number(t.quantity) || 0),
        // Priorizar t.currency (moneda elegida por el cliente) sobre la del método de pago
        currency: t.currency || t.payment_method?.currency || "",
        status: t.status,
        date: (t.create_date || "").slice(0, 10),
        delivery_day: t.delivery_day || "",
        locality: t.locality || "",
        original_price: Number(t.original_price) || Number(t.price) || 0,
        discount_amount: Number(t.discount_amount) || 0,
        offer_name: t.offer_name || "",
        offer_code: t.offer_code || "",
      })
    )
  );
  return rows;
};

const SellReport = ({ customers = [] }) => {
  const allRows = useMemo(() => flatten(customers), [customers]);
  const currencyCodes = useMemo(() => [...new Set(allRows.map((r) => r.currency).filter(Boolean))], [allRows]);
  const localityCodes = useMemo(() => [...new Set(allRows.map((r) => r.locality).filter(Boolean))], [allRows]);
  const hasLocalities = localityCodes.length > 0;
  const hasMultiCurrency = currencyCodes.length > 1;

  // Si hay múltiples monedas, empezar en "all"; si hay una, filtrar directo
  const [currency, setCurrency] = useState(currencyCodes.length === 1 ? currencyCodes[0] : "all");
  const [locality, setLocality] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [offerFilter, setOfferFilter] = useState("all");

  const anim = useChartAnimation();
  const symbol = (code) => currencies.find((c) => c.code === code)?.symbol || code || "";
  const curSym = currency === "all" ? "" : symbol(currency);

  const rows = useMemo(
    () => allRows.filter((r) =>
      (currency === "all" || r.currency === currency) &&
      (locality === "all" || (r.locality || NO_LOC) === locality) &&
      (!from || r.date >= from) &&
      (!to || r.date <= to) &&
      (offerFilter === "all" || r.offer_name === offerFilter || r.offer_code === offerFilter)
    ),
    [allRows, currency, locality, from, to, offerFilter]
  );

  const stats = useMemo(() => {
    const paid = rows.filter((r) => PAID.includes(r.status));
    const delivered = rows.filter((r) => r.status === "Entregada").length;
    const cancelled = rows.filter((r) => r.status === "Cancelada").length;

    // Ingresos por moneda
    const revByCur = {};
    paid.forEach((r) => { revByCur[r.currency] = (revByCur[r.currency] || 0) + r.total; });

    const byStatusMap = {};
    rows.forEach((r) => { byStatusMap[r.status] = (byStatusMap[r.status] || 0) + 1; });
    const byStatus = Object.entries(byStatusMap).map(([name, value]) => ({ name, value }));

    const byDayMap = {};
    paid.forEach((r) => { if (r.date) byDayMap[r.date] = (byDayMap[r.date] || 0) + r.total; });
    const byDay = Object.entries(byDayMap).sort((a, b) => a[0].localeCompare(b[0])).map(([date, total]) => ({ date, total }));

    const prodMap = {};
    paid.forEach((r) => {
      if (!prodMap[r.product_id]) prodMap[r.product_id] = { name: r.product_name.trim(), units: 0, revenue: 0 };
      prodMap[r.product_id].units += r.quantity;
      prodMap[r.product_id].revenue += r.total;
    });
    const topProducts = Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

    const locMap = {};
    rows.forEach((r) => {
      const key = r.locality || NO_LOC;
      if (!locMap[key]) locMap[key] = { name: key, orders: 0, revenue: 0 };
      locMap[key].orders += 1;
      if (PAID.includes(r.status)) locMap[key].revenue += r.total;
    });
    const byLocality = Object.values(locMap).sort((a, b) => b.revenue - a.revenue);

    return {
      revByCur, orders: rows.length, paidOrders: paid.length, delivered, cancelled,
      conversion: rows.length ? Math.round((delivered / rows.length) * 100) : 0,
      cancellation: rows.length ? Math.round((cancelled / rows.length) * 100) : 0,
      byStatus, byDay, topProducts, byLocality,
      totalDiscounted: paid.reduce((s, r) => s + (r.discount_amount || 0), 0),
      txsWithOffer: paid.filter(r => (r.discount_amount || 0) > 0 || r.offer_code).length,
    };
  }, [rows]);

  // Orden por columna (sin columna activa = orden original de las órdenes)
  const sort = useSortableData(rows, SORT_COLUMNS);
  const sortedRows = sort.sorted;

  const offerOptions = useMemo(() =>
    [...new Set(allRows.filter(r => r.offer_name || r.offer_code).map(r => r.offer_name || r.offer_code))],
    [allRows]);

  const exportToExcel = async () => {
    const XLSX = await import("xlsx-js-style");
    const header = ["Cliente", "Producto", "Cantidad", "Moneda", "Precio", "Total", "Estado", "Fecha", "Oferta", "Descuento"];
    if (hasLocalities) header.splice(7, 0, "Localidad");
    const wsData = [
      header,
      ...sortedRows.map((r) => {
        const base = [r.full_name, r.product_name, r.quantity, r.currency, r.price, r.total, r.status, r.date, r.offer_code || r.offer_name || "", r.discount_amount || 0];
        if (hasLocalities) base.splice(7, 0, r.locality || NO_LOC);
        return base;
      }),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 13 }, alignment: { horizontal: "center" }, fill: { fgColor: { rgb: "113F67" } } };
    header.forEach((_, c) => { const cell = ws[XLSX.utils.encode_cell({ r: 0, c })]; if (cell) cell.s = headerStyle; });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer], { type: "application/octet-stream" }), "Ventas.xlsx");
  };

  const colSpan = hasLocalities ? 10 : 9;
  const filtersActive = !!from || !!to || locality !== "all" || offerFilter !== "all";
  const clearFilters = () => { setFrom(""); setTo(""); setLocality("all"); setOfferFilter("all"); };

  return (
    <div>
      <div className={styles.filters}>
        {(currencyCodes.length > 0) && (
          <label className={styles.filter}>Moneda
            <Select value={currency} onChange={setCurrency}
              options={[
                ...(hasMultiCurrency ? [{ value: "all", label: "Todas las monedas" }] : []),
                ...currencyCodes.map((c) => ({ value: c, label: c })),
              ]} searchable={false} />
          </label>
        )}
        {hasLocalities && (
          <label className={styles.filter}>Localidad
            <Select value={locality} onChange={setLocality}
              options={[{ value: "all", label: "Todas" }, ...localityCodes.map(l => ({ value: l, label: l }))]}
            />
          </label>
        )}
        {offerOptions.length > 0 && (
          <label className={styles.filter}>Oferta
            <Select value={offerFilter} onChange={setOfferFilter}
              options={[{ value: "all", label: "Todas" }, ...offerOptions.map(n => ({ value: n, label: n }))]}
            />
          </label>
        )}
        <div className={styles.filter}>
          <span id="sell-report-from-label">Desde</span>
          <DatePicker className="input" aria-labelledby="sell-report-from-label" value={from} max={to || undefined} onChange={(v) => setFrom(v)} />
        </div>
        <div className={styles.filter}>
          <span id="sell-report-to-label">Hasta</span>
          <DatePicker className="input" aria-labelledby="sell-report-to-label" value={to} min={from || undefined} onChange={(v) => setTo(v)} />
        </div>
        <Button variant="secondary" icon={Download} className={styles.exportBtn} onClick={exportToExcel}>Exportar a Excel</Button>
      </div>

      {/* KPIs: ingresos separados por moneda */}
      <div className={styles.kpis}>
        {Object.entries(stats.revByCur).map(([cur, val]) => (
          <div key={cur} className={styles.kpi}>
            <span>Ingresos {cur} (cobrados)</span>
            <KpiValue value={val} format={(v) => `${symbol(cur)} ${formatted(v)}`} />
          </div>
        ))}
        <div className={styles.kpi}><span>Órdenes</span><KpiValue value={stats.orders} /></div>
        <div className={styles.kpi}><span>Tasa de entrega</span><KpiValue value={stats.conversion} format={(v) => `${Math.round(v)}%`} /></div>
        <div className={styles.kpi}><span>Cancelación</span><KpiValue value={stats.cancellation} format={(v) => `${Math.round(v)}%`} /></div>
      </div>
      {stats.totalDiscounted > 0 && (
        <div className={`${styles.kpi} ${styles.kpiStandalone}`}><span>Total descontado</span><strong className={styles.positive}>- {curSym} {formatted(stats.totalDiscounted)}</strong></div>
      )}

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Ingresos por día{hasMultiCurrency && currency === "all" ? " (todas las monedas sumadas)" : curSym ? ` (${currency})` : ""}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.byDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-interactive)" stopOpacity={0.35} /><stop offset="95%" stopColor="var(--color-interactive)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="date" tick={AXIS_TICK} stroke={GRID_COLOR} />
              <YAxis tick={AXIS_TICK} stroke={GRID_COLOR} />
              <Tooltip formatter={(v) => `${curSym || ""} ${formatted(v)}`} />
              <Area type="monotone" dataKey="total" stroke="var(--color-brand)" fill="url(#rev)" strokeWidth={2} {...anim} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3>Órdenes por estado</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stats.byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2} {...anim}>
                {stats.byStatus.map((s) => (<Cell key={s.name} fill={statusColor(s.name)} />))}
              </Pie>
              <Tooltip /><Legend fontSize={11} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={`${styles.chartCard} ${styles.full}`}>
          <h3>Top productos (por ingreso)</h3>
          <ResponsiveContainer width="100%" height={Math.max(220, stats.topProducts.length * 42)}>
            <BarChart data={stats.topProducts} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis type="number" tick={AXIS_TICK} stroke={GRID_COLOR} />
              <YAxis type="category" dataKey="name" width={120} tick={AXIS_TICK} stroke={GRID_COLOR} />
              <Tooltip formatter={(v) => `${curSym || ""} ${formatted(v)}`} />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]} fill={BAR_COLOR} {...anim} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {hasLocalities && (
          <div className={`${styles.chartCard} ${styles.full}`}>
            <h3>Ventas por localidad (ingreso cobrado)</h3>
            <ResponsiveContainer width="100%" height={Math.max(220, stats.byLocality.length * 42)}>
              <BarChart data={stats.byLocality} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis type="number" tick={AXIS_TICK} stroke={GRID_COLOR} />
                <YAxis type="category" dataKey="name" width={120} tick={AXIS_TICK} stroke={GRID_COLOR} />
                <Tooltip formatter={(v, n) => n === "revenue" ? `${curSym || ""} ${formatted(v)}` : v} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]} fill={BAR_COLOR} {...anim} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className={styles.tableCard}>
        <h3>Detalle de ventas</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <SortableHeader sortKey="full_name" sort={sort}>Cliente</SortableHeader>
                <SortableHeader sortKey="product_name" sort={sort}>Producto</SortableHeader>
                <SortableHeader sortKey="quantity" sort={sort}>Cant</SortableHeader>
                <SortableHeader sortKey="price" sort={sort}>Precio</SortableHeader>
                <SortableHeader sortKey="total" sort={sort}>Total</SortableHeader>
                <SortableHeader sortKey="status" sort={sort}>Estado</SortableHeader>
                {hasLocalities && <SortableHeader sortKey="locality" sort={sort}>Localidad</SortableHeader>}
                <SortableHeader sortKey="date" sort={sort}>Fecha</SortableHeader>
                <SortableHeader sortKey="offer" sort={sort}>Oferta</SortableHeader>
                <SortableHeader sortKey="discount_amount" sort={sort}>Descuento</SortableHeader>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r, i) => (
                <tr key={i}>
                  <td>{r.full_name}</td><td>{r.product_name}</td><td>{r.quantity}</td>
                  <td>{symbol(r.currency)} {formatted(r.price)}</td>
                  <td>{symbol(r.currency)} {formatted(r.total)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  {hasLocalities && <td>{r.locality || NO_LOC}</td>}
                  <td>{parseISODate(r.date)?.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) ?? "—"}</td>
                  <td>{r.offer_code || r.offer_name || "—"}</td>
                  <td className={(r.discount_amount || 0) > 0 ? styles.positive : undefined}>
                    {(r.discount_amount || 0) > 0 ? `− ${symbol(r.currency)} ${formatted(r.discount_amount)}` : "—"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={colSpan} className={styles.tableEmpty}>
                  Sin ventas con estos filtros.
                  {filtersActive && (
                    <div><Button variant="ghost" size="sm" onClick={clearFilters}>Quitar filtros</Button></div>
                  )}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellReport;