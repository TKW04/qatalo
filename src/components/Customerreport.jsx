import { useMemo, useState } from "react";
import { saveAs } from "file-saver";
import { currencies, formatted } from "../helpers/utils";
import { buildCustomerReport, fmtDate, timeAgo } from "../helpers/customerReport";
import styles from "./SellReport.module.css";
import Select from "./Select";

const CustomerReport = ({ customers = [] }) => {
  const allRows = useMemo(() => buildCustomerReport(customers), [customers]);

  const currencyCodes = useMemo(
    () => [...new Set(allRows.map((r) => r.currency).filter(Boolean))],
    [allRows]
  );

  const [currency, setCurrency] = useState("all");
  const [sort, setSort] = useState("ltv");     // ltv | recent | oldest | orders
  const [search, setSearch] = useState("");

  const symbol = currencies.find((c) => c.code === currency)?.symbol || (currency === "all" ? "" : currency) || "";

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    let out = allRows.filter((r) =>
      (currency === "all" || r.currency === currency) &&
      (!term ||
        r.name.toLowerCase().includes(term) ||
        (r.email || "").toLowerCase().includes(term) ||
        (r.favorite_product || "").toLowerCase().includes(term))
    );
    const cmp = {
      ltv: (a, b) => b.ltv - a.ltv,
      orders: (a, b) => b.orders_count - a.orders_count,
      recent: (a, b) => (b.last_sale || "").localeCompare(a.last_sale || ""),
      oldest: (a, b) => (a.created || "").localeCompare(b.created || ""),
    }[sort] || ((a, b) => b.ltv - a.ltv);
    return [...out].sort(cmp);
  }, [allRows, currency, sort, search]);

  console.log(rows);
  
  const stats = useMemo(() => {
    const total = rows.length;
    const withPurchase = rows.filter((r) => r.orders_count > 0).length;
    const totalLtv = rows.reduce((s, r) => s + r.ltv, 0);
    // Clientes inactivos: última compra hace más de 60 días (o nunca)
    const now = Date.now();
    const inactive = rows.filter((r) => {
      if (!r.last_sale) return true;
      const d = new Date(r.last_sale).getTime();
      return isNaN(d) || (now - d) / 86400000 > 60;
    }).length;
    return { total, withPurchase, totalLtv, inactive };
  }, [rows]);

  const exportToExcel = async () => {
    const XLSX = await import("xlsx-js-style");
    const header = [
      "Cliente", "Email", "Teléfono", "Cliente desde",
      "Última compra", "Producto favorito", "Uds. favorito", "Órdenes", "Total gastado",
    ];
    const wsData = [
      header,
      ...rows.map((r) => [
        r.name, r.email, r.phone,
        r.created ? r.created.slice(0, 10) : "",
        r.last_sale ? r.last_sale.slice(0, 10) : "",
        r.favorite_product, r.favorite_units, r.orders_count, r.ltv,
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
          <input
            type="text"
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre, correo o producto"
          />
        </label>

        {currencyCodes.length > 1 && (
          <label className={styles.filter}>Moneda
            <Select
              value={currency}
              onChange={(code) => setCurrency(code)}
              options={[
                { value: "all", label: "Todas" },
                ...currencyCodes.map((c) => ({ value: c, label: c })),
              ]}
            />
          </label>
        )}

        <label className={styles.filter}>Ordenar por
          <Select
            value={sort}
            onChange={(v) => setSort(v)}
            options={[
              { value: "ltv", label: "Mayor gasto" },
              { value: "orders", label: "Más órdenes" },
              { value: "recent", label: "Compra más reciente" },
              { value: "oldest", label: "Cliente más antiguo" },
            ]}
            searchable={false}
          />
        </label>

        <button className={styles.exportBtn} onClick={exportToExcel}>Exportar a Excel</button>
      </div>

      <div className={styles.kpis}>
        <div className={styles.kpi}><span>Clientes</span><strong>{stats.total}</strong></div>
        <div className={styles.kpi}><span>Con al menos una compra</span><strong>{stats.withPurchase}</strong></div>
        <div className={styles.kpi}><span>Gasto total (cobrado)</span><strong>{symbol} {formatted(stats.totalLtv)}</strong></div>
        <div className={styles.kpi}><span>Inactivos (+60 días)</span><strong>{stats.inactive}</strong></div>
      </div>

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
                    ) : (
                      <span style={{ color: "#98a2b3" }}>Sin compras</span>
                    )}
                  </td>
                  <td>
                    {r.favorite_product}
                    {r.favorite_units > 0 && (
                      <div style={{ fontSize: ".78rem", color: "#98a2b3" }}>{r.favorite_units} uds</div>
                    )}
                  </td>
                  <td>{r.orders_count}</td>
                  <td style={{ fontWeight: 600 }}>
                    {(currency === "all" ? (currencies.find((c) => c.code === r.currency)?.symbol || r.currency || "") : symbol)} {formatted(r.ltv)}
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