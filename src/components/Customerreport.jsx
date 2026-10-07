import { useMemo, useState } from "react";
import { saveAs } from "file-saver";
import { currencies, formatted } from "../helpers/utils";
import { buildCustomerReport, fmtDate, timeAgo } from "../helpers/customerReport";
import styles from "./SellReport.module.css";
import Select from "./Select";
import { Download } from "lucide-react";
import { Button, SortableHeader, useSortableData } from "./admin";

const sym = (code) => currencies.find((c) => c.code === code)?.symbol || code || "";

const CustomerReport = ({ customers = [] }) => {
  const allRows = useMemo(() => buildCustomerReport(customers), [customers]);

  // Todas las monedas presentes en el reporte
  const allCurrencies = useMemo(() => {
    const set = new Set();
    allRows.forEach((r) => Object.keys(r.ltv || {}).forEach((c) => set.add(c)));
    return [...set];
  }, [allRows]);

  const [filterCurrency, setFilterCurrency] = useState("all");
  const [search, setSearch] = useState("");

  // Rows filtradas por búsqueda y moneda; orden inicial: mayor gasto (en la moneda filtrada)
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const out = allRows.filter((r) => {
      const matchSearch = !term ||
        r.name.toLowerCase().includes(term) ||
        (r.email || "").toLowerCase().includes(term) ||
        (r.favorite_product || "").toLowerCase().includes(term);
      const matchCur = filterCurrency === "all" || (r.ltv || {})[filterCurrency] !== undefined;
      return matchSearch && matchCur;
    });

    const ltvInFilter = (r) => {
      if (filterCurrency === "all") return Object.values(r.ltv || {}).reduce((s, v) => s + v, 0);
      return (r.ltv || {})[filterCurrency] || 0;
    };

    return out.sort((a, b) => ltvInFilter(b) - ltvInFilter(a));
  }, [allRows, filterCurrency, search]);

  // Orden por columna (sin columna activa = orden inicial por mayor gasto)
  const columnSort = useMemo(() => ({
    name: { type: "text", value: (r) => (r.name === "—" ? "" : r.name) },
    created: { type: "date" },
    last_sale: { type: "date" },
    favorite_product: { type: "text", value: (r) => (r.favorite_product === "—" ? "" : r.favorite_product) },
    orders_count: { type: "number" },
    // Gasto según el filtro de moneda (con "todas", misma suma que el orden inicial); sin compras → al final
    ltv: {
      type: "number",
      value: (r) => {
        const ltv = r.ltv || {};
        if (filterCurrency !== "all") return ltv[filterCurrency] ?? null;
        const vals = Object.values(ltv);
        return vals.length ? vals.reduce((s, v) => s + v, 0) : null;
      },
    },
  }), [filterCurrency]);
  const sortState = useSortableData(rows, columnSort);
  const sortedRows = sortState.sorted;

  // KPIs: separados por moneda
  const stats = useMemo(() => {
    const total = rows.length;
    const withPurchase = rows.filter((r) => r.orders_count > 0).length;
    const ltvByCur = {};
    rows.forEach((r) => {
      Object.entries(r.ltv || {}).forEach(([cur, val]) => {
        ltvByCur[cur] = (ltvByCur[cur] || 0) + val;
      });
    });
    const now = Date.now();
    const inactive = rows.filter((r) => {
      if (!r.last_sale) return true;
      const d = new Date(r.last_sale).getTime();
      return isNaN(d) || (now - d) / 86400000 > 60;
    }).length;
    return { total, withPurchase, ltvByCur, inactive };
  }, [rows]);

  const exportToExcel = async () => {
    const XLSX = await import("xlsx-js-style");
    const header = [
      "Cliente", "Email", "Teléfono", "Cliente desde",
      "Última compra", "Producto favorito", "Uds. favorito", "Órdenes",
      ...allCurrencies.map((c) => `Total ${c}`),
    ];
    const wsData = [
      header,
      ...sortedRows.map((r) => [
        r.name, r.email, r.phone,
        r.created ? r.created.slice(0, 10) : "",
        r.last_sale ? r.last_sale.slice(0, 10) : "",
        r.favorite_product, r.favorite_units, r.orders_count,
        ...allCurrencies.map((c) => (r.ltv || {})[c] || 0),
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 13 },
      alignment: { horizontal: "center" },
      fill: { fgColor: { rgb: "113F67" } },
    };
    header.forEach((_, c) => {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
      if (cell) cell.s = headerStyle;
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer], { type: "application/octet-stream" }), "Clientes.xlsx");
  };

  return (
    <div>
      <div className={styles.filters}>
        <label className={styles.filter}>Buscar
          <input type="text" className="input" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre, correo o producto" />
        </label>

        {allCurrencies.length > 1 && (
          <label className={styles.filter}>Filtrar por moneda
            <Select value={filterCurrency} onChange={setFilterCurrency}
              options={[
                { value: "all", label: "Todas las monedas" },
                ...allCurrencies.map((c) => ({ value: c, label: c })),
              ]} searchable={false} />
          </label>
        )}

        <Button variant="secondary" icon={Download} className={styles.exportBtn} onClick={exportToExcel}>Exportar a Excel</Button>
      </div>

      {/* KPIs */}
      <div className={styles.kpis}>
        <div className={styles.kpi}><span>Clientes</span><strong>{stats.total}</strong></div>
        <div className={styles.kpi}><span>Con al menos una compra</span><strong>{stats.withPurchase}</strong></div>
        {Object.entries(stats.ltvByCur).map(([cur, val]) => (
          <div key={cur} className={styles.kpi}>
            <span>Gasto total {cur}</span>
            <strong>{sym(cur)} {formatted(val)}</strong>
          </div>
        ))}
        <div className={styles.kpi}><span>Inactivos (+60 días)</span><strong>{stats.inactive}</strong></div>
      </div>

      {/* Tabla */}
      <div className={styles.tableCard}>
        <h3>Detalle de clientes</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <SortableHeader sortKey="name" sort={sortState}>Cliente</SortableHeader>
                <SortableHeader sortKey="created" sort={sortState}>Cliente desde</SortableHeader>
                <SortableHeader sortKey="last_sale" sort={sortState}>Última compra</SortableHeader>
                <SortableHeader sortKey="favorite_product" sort={sortState}>Producto favorito</SortableHeader>
                <SortableHeader sortKey="orders_count" sort={sortState}>Órdenes</SortableHeader>
                <SortableHeader sortKey="ltv" sort={sortState}>Total gastado</SortableHeader>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r) => (
                <tr key={r.customer_id}>
                  <td>
                    <div className={styles.cellStrong}>{r.name}</div>
                    {(r.email || r.phone) && (
                      <div className={styles.cellMeta}>
                        {r.email}{r.email && r.phone ? " · " : ""}{r.phone}
                      </div>
                    )}
                  </td>
                  <td>
                    {fmtDate(r.created)}
                    <div className={styles.cellMeta}>{timeAgo(r.created)}</div>
                  </td>
                  <td>
                    {r.last_sale ? (
                      <>
                        {fmtDate(r.last_sale)}
                        <div className={styles.cellMeta}>{timeAgo(r.last_sale)}</div>
                      </>
                    ) : <span className={styles.cellMuted}>Sin compras</span>}
                  </td>
                  <td>
                    {r.favorite_product}
                    {r.favorite_units > 0 && (
                      <div className={styles.cellMeta}>{r.favorite_units} uds</div>
                    )}
                  </td>
                  <td>{r.orders_count}</td>
                  <td>
                    {Object.entries(r.ltv || {}).length === 0
                      ? <span className={styles.cellMuted}>—</span>
                      : Object.entries(r.ltv).map(([cur, val]) => (
                          <div key={cur} className={styles.cellStrong}>
                            {sym(cur)} {formatted(val)}
                            {Object.keys(r.ltv).length > 1 && (
                              <span className={styles.cellMeta} style={{ marginLeft: "var(--space-1)" }}>({cur})</span>
                            )}
                          </div>
                        ))
                    }
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className={styles.tableEmpty}>No hay clientes que coincidan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerReport;