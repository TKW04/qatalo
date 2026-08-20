import { useMemo, useState } from "react";
import { saveAs } from "file-saver";
import { currencies, formatted } from "../helpers/utils";
import { buildCustomerReport, fmtDate, timeAgo } from "../helpers/customerReport";
import styles from "./SellReport.module.css";
import Select from "./Select";

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
  const [sort, setSort] = useState("ltv");
  const [search, setSearch] = useState("");

  // Rows filtradas por búsqueda y moneda
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    let out = allRows.filter((r) => {
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

    const cmp = {
      ltv: (a, b) => ltvInFilter(b) - ltvInFilter(a),
      orders: (a, b) => b.orders_count - a.orders_count,
      recent: (a, b) => (b.last_sale || "").localeCompare(a.last_sale || ""),
      oldest: (a, b) => (a.created || "").localeCompare(b.created || ""),
    }[sort] || ((a, b) => ltvInFilter(b) - ltvInFilter(a));

    return [...out].sort(cmp);
  }, [allRows, filterCurrency, sort, search]);

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
      ...rows.map((r) => [
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

        <label className={styles.filter}>Ordenar por
          <Select value={sort} onChange={setSort}
            options={[
              { value: "ltv", label: "Mayor gasto" },
              { value: "orders", label: "Más órdenes" },
              { value: "recent", label: "Compra más reciente" },
              { value: "oldest", label: "Cliente más antiguo" },
            ]} searchable={false} />
        </label>

        <button className={styles.exportBtn} onClick={exportToExcel}>Exportar a Excel</button>
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
                <th>Cliente</th>
                <th>Cliente desde</th>
                <th>Última compra</th>
                <th>Producto favorito</th>
                <th>Órdenes</th>
                <th>Total gastado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.customer_id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    {(r.email || r.phone) && (
                      <div style={{ fontSize: ".8rem", color: "#667085" }}>
                        {r.email}{r.email && r.phone ? " · " : ""}{r.phone}
                      </div>
                    )}
                  </td>
                  <td>
                    {fmtDate(r.created)}
                    <div style={{ fontSize: ".78rem", color: "#98a2b3" }}>{timeAgo(r.created)}</div>
                  </td>
                  <td>
                    {r.last_sale ? (
                      <>
                        {fmtDate(r.last_sale)}
                        <div style={{ fontSize: ".78rem", color: "#98a2b3" }}>{timeAgo(r.last_sale)}</div>
                      </>
                    ) : <span style={{ color: "#98a2b3" }}>Sin compras</span>}
                  </td>
                  <td>
                    {r.favorite_product}
                    {r.favorite_units > 0 && (
                      <div style={{ fontSize: ".78rem", color: "#98a2b3" }}>{r.favorite_units} uds</div>
                    )}
                  </td>
                  <td>{r.orders_count}</td>
                  <td>
                    {Object.entries(r.ltv || {}).length === 0
                      ? <span style={{ color: "#98a2b3" }}>—</span>
                      : Object.entries(r.ltv).map(([cur, val]) => (
                          <div key={cur} style={{ fontWeight: 600 }}>
                            {sym(cur)} {formatted(val)}
                            {Object.keys(r.ltv).length > 1 && (
                              <span style={{ fontSize: ".75rem", color: "#98a2b3", marginLeft: ".3rem" }}>({cur})</span>
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