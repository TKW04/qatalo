import { Fragment, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Download, LayoutDashboard, RefreshCw } from "lucide-react";

import { getTokenInfo } from "../../../helpers/token";
import { curSymbol, formatted, formatDate } from "../../../helpers/utils";
import DatePicker, { toISODate } from "../../../components/DatePicker";
import {
  PageHeader,
  Button,
  EmptyState,
  StatusBadge,
  SkeletonKpis,
  SkeletonTable,
  SortableHeader,
  useSortableData,
} from "../../../components/admin";
import { fetchDashboard } from "../../../services/dashboardApi";
import reportStyles from "../../../components/SellReport.module.css"; // misma paleta que Reportes
import styles from "./Summary.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

// Rango por defecto: mes en curso (1 → último día).
const currentMonth = () => {
  const n = new Date();
  return {
    from: toISODate(new Date(n.getFullYear(), n.getMonth(), 1)),
    to: toISODate(new Date(n.getFullYear(), n.getMonth() + 1, 0)),
  };
};

const num = (v) => Number(v) || 0;

// Montos por moneda: nunca se suman monedas distintas. "RD$ 1,200.00 · $ 40.00"
const amountEntries = (amount) =>
  Object.entries(amount || {})
    .filter(([, v]) => num(v) !== 0)
    .sort(([a], [b]) => a.localeCompare(b));

const formatAmount = (amount) => {
  const entries = amountEntries(amount);
  return entries.length ? entries.map(([cur, v]) => `${curSymbol(cur)} ${formatted(v)}`).join(" · ") : "—";
};

// Moneda de referencia para ordenar por monto: la que aparece en más filas.
const primaryCurrency = (rows) => {
  const count = {};
  rows.forEach((r) => Object.keys(r.amount || {}).forEach((c) => { count[c] = (count[c] || 0) + 1; }));
  return Object.entries(count).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null;
};

const productLabel = (r) => [r.product_name || "—", r.variant_label].filter(Boolean).join(" · ");
const rowKey = (r, i) => `${r.product_id || i}::${r.variant_label || ""}`;
const orderRef = (l) => {
  const id = l.order_group || l.transaction_id;
  return id ? `#${String(id).slice(0, 8).toUpperCase()}` : "—";
};
const lineDate = (d) => (d ? formatDate(String(d).slice(0, 10)) : "—");

const PRODUCED_SORT = {
  product_name: { type: "text" },
  quantity: { type: "number" },
  sold: { type: "number" },
  inventory: { type: "number" },
};

// Producidos + vendidas por producto (todas las variantes). Incluye productos
// vendidos sin producción en el rango (producidas 0) para que cuadre con el KPI.
const buildProducedRows = (produced, sold) => {
  const soldBy = new Map();
  const names = new Map();
  sold.forEach((r) => {
    const k = r.product_id || r.product_name || "";
    soldBy.set(k, (soldBy.get(k) || 0) + num(r.quantity));
    if (!names.has(k)) names.set(k, r.product_name);
  });
  const rows = produced.map((r) => {
    const k = r.product_id || r.product_name || "";
    const s = soldBy.get(k) || 0;
    soldBy.delete(k);
    return { ...r, quantity: num(r.quantity), sold: s, inventory: num(r.quantity) - s };
  });
  soldBy.forEach((s, k) => {
    rows.push({ product_id: k, product_name: names.get(k), quantity: 0, sold: s, inventory: -s });
  });
  return rows;
};

// ── Tablas ────────────────────────────────────────────────────────────────────

const ProducedTable = ({ rows }) => {
  const sort = useSortableData(rows, PRODUCED_SORT);
  return (
    <section className={reportStyles.tableCard} aria-labelledby="summary-produced-title">
      <h3 id="summary-produced-title">Producidos</h3>
      <div className={reportStyles.tableWrap}>
        <table className={reportStyles.table}>
          <thead>
            <tr>
              <SortableHeader sortKey="product_name" sort={sort}>Producto</SortableHeader>
              <SortableHeader sortKey="quantity" sort={sort} className={styles.num}>Producidas</SortableHeader>
              <SortableHeader sortKey="sold" sort={sort} className={styles.num}>Vendidas</SortableHeader>
              <SortableHeader sortKey="inventory" sort={sort} className={styles.num}>En inventario</SortableHeader>
            </tr>
          </thead>
          <tbody>
            {sort.sorted.map((r, i) => (
              <tr key={r.product_id || i}>
                <td>{r.product_name || "—"}</td>
                <td className={styles.num}>{r.quantity}</td>
                <td className={styles.num}>{r.sold}</td>
                <td className={`${styles.num} ${r.inventory < 0 ? styles.negative : ""}`}>{r.inventory}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4}className={reportStyles.tableEmpty}>Sin producción registrada en este rango.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// Vendidos / Promesas: filas por producto expandibles al detalle de líneas.
const LinesTable = ({ id, title, rows, withStatus = false, emptyText }) => {
  const [open, setOpen] = useState(() => new Set());
  const cur = useMemo(() => primaryCurrency(rows), [rows]);
  const columns = useMemo(() => ({
    product: { type: "text", value: productLabel },
    quantity: { type: "number" },
    amount: { type: "number", value: (r) => (cur ? r.amount?.[cur] ?? null : null) },
  }), [cur]);
  const sort = useSortableData(rows, columns);

  const toggle = (key) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const colSpan = withStatus ? 5 : 4;
  const titleId = `summary-${id}-title`;

  return (
    <section className={reportStyles.tableCard} aria-labelledby={titleId}>
      <h3 id={titleId}>{title}</h3>
      <div className={reportStyles.tableWrap}>
        <table className={reportStyles.table}>
          <thead>
            <tr>
              <th className={styles.expandCol}><span className={styles.srOnly}>Detalle</span></th>
              <SortableHeader sortKey="product" sort={sort}>Producto</SortableHeader>
              <SortableHeader sortKey="quantity" sort={sort} className={styles.num}>Cantidad</SortableHeader>
              <SortableHeader
                sortKey="amount"
                sort={sort}
                className={styles.num}
                title={cur ? `Ordena por el monto en ${cur}` : undefined}
              >
                Monto
              </SortableHeader>
              {withStatus && <th>Estados</th>}
            </tr>
          </thead>
          <tbody>
            {sort.sorted.map((r, i) => {
              const key = rowKey(r, i);
              const isOpen = open.has(key);
              const lines = Array.isArray(r.lines) ? r.lines : [];
              const panelId = `summary-${id}-lines-${i}`;
              return (
                <Fragment key={key}>
                  <tr className={isOpen ? styles.rowOpen : undefined}>
                    <td className={styles.expandCol}>
                      <button
                        type="button"
                        className={styles.expandBtn}
                        onClick={() => toggle(key)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        aria-label={`${isOpen ? "Ocultar" : "Ver"} detalle de ${productLabel(r)}`}
                        disabled={lines.length === 0}
                      >
                        {isOpen ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
                      </button>
                    </td>
                    <td>
                      <span className={reportStyles.cellStrong}>{r.product_name || "—"}</span>
                      {r.variant_label && <div className={reportStyles.cellMeta}>{r.variant_label}</div>}
                    </td>
                    <td className={styles.num}>{num(r.quantity)}</td>
                    <td className={`${styles.num} ${styles.amount}`}>{formatAmount(r.amount)}</td>
                    {withStatus && (
                      <td>
                        <div className={styles.badges}>
                          {Object.entries(r.by_status || {}).filter(([, q]) => num(q) > 0).map(([s, q]) => (
                            <StatusBadge key={s} status={s}>{s} · {num(q)}</StatusBadge>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                  {isOpen && (
                    <tr id={panelId} className={styles.detailRow}>
                      <td colSpan={colSpan}>
                        <div className={styles.detailWrap}>
                          <table className={`${reportStyles.table} ${styles.detailTable}`}>
                            <thead>
                              <tr>
                                <th>Pedido</th>
                                <th>Cliente</th>
                                <th className={styles.num}>Cant</th>
                                <th className={styles.num}>Precio</th>
                                {withStatus && <th>Estado</th>}
                                <th>Fecha</th>
                              </tr>
                            </thead>
                            <tbody>
                              {lines.map((l, j) => (
                                <tr key={`${l.transaction_id || j}`}>
                                  <td className={styles.mono}>{orderRef(l)}</td>
                                  <td>{l.customer_name || "—"}</td>
                                  <td className={styles.num}>{num(l.quantity)}</td>
                                  <td className={styles.num}>{curSymbol(l.currency)} {formatted(num(l.price))}</td>
                                  {withStatus && <td><StatusBadge status={l.status} /></td>}
                                  <td>{lineDate(l.date)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={colSpan} className={reportStyles.tableEmpty}>{emptyText}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// ── Exportación ───────────────────────────────────────────────────────────────

const exportToExcel = async (data, from, to) => {
  const [XLSX, { saveAs }] = await Promise.all([import("xlsx-js-style"), import("file-saver")]);
  const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 13 }, alignment: { horizontal: "center" }, fill: { fgColor: { rgb: "113F67" } } };

  const sheet = (header, body) => {
    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    header.forEach((_, c) => { const cell = ws[XLSX.utils.encode_cell({ r: 0, c })]; if (cell) cell.s = headerStyle; });
    ws["!cols"] = header.map(() => ({ wch: 18 }));
    return ws;
  };

  // Una fila por línea de pedido; productos sin líneas salen como fila resumen.
  const lineRows = (rows) => rows.flatMap((r) => {
    const lines = Array.isArray(r.lines) ? r.lines : [];
    if (lines.length === 0) {
      return [[r.product_name || "", r.variant_label || "", "", "", num(r.quantity), "", "", "", "", ""]];
    }
    return lines.map((l) => [
      r.product_name || "", r.variant_label || "", orderRef(l), l.customer_name || "",
      num(l.quantity), l.currency || "", num(l.price), num(l.price) * num(l.quantity),
      l.status || "", l.date ? String(l.date).slice(0, 10) : "",
    ]);
  });
  const linesHeader = ["Producto", "Variante", "Pedido", "Cliente", "Cantidad", "Moneda", "Precio", "Total", "Estado", "Fecha"];

  const wb = XLSX.utils.book_new();
  const producedRows = buildProducedRows(data.produced || [], data.sold || []);
  XLSX.utils.book_append_sheet(wb, sheet(
    ["Producto", "Producidas", "Vendidas", "En inventario"],
    producedRows.map((r) => [r.product_name || "", r.quantity, r.sold, r.inventory]),
  ), "Producidos");
  XLSX.utils.book_append_sheet(wb, sheet(linesHeader, lineRows(data.sold)), "Vendidos");
  XLSX.utils.book_append_sheet(wb, sheet(linesHeader, lineRows(data.promises)), "Promesas");

  const suffix = from || to ? `_${from || "inicio"}_${to || "hoy"}` : "";
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buffer], { type: "application/octet-stream" }), `Resumen${suffix}.xlsx`);
};

// ── Pestaña ───────────────────────────────────────────────────────────────────

const Summary = () => {
  const tenantId = getTokenInfo()?.sub;
  const defaults = useMemo(currentMonth, []);
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const isDefaultRange = from === defaults.from && to === defaults.to;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboard", tenantId, from, to],
    queryFn: () => fetchDashboard({ from, to }),
    enabled: !!tenantId,
    retry: false,
    placeholderData: keepPreviousData, // al cambiar el rango no parpadea a skeleton
  });

  const totals = data?.totals || {};
  const produced = data?.produced || [];
  const sold = data?.sold || [];
  const promises = data?.promises || [];
  const isEmpty = !!data && produced.length === 0 && sold.length === 0 && promises.length === 0;
  const producedRows = useMemo(() => buildProducedRows(data?.produced || [], data?.sold || []), [data]);
  const inventoryUnits = num(totals.produced_units) - num(totals.sold_units);

  const resetRange = () => { setFrom(defaults.from); setTo(defaults.to); };

  return (
    <div>
      <PageHeader
        title="Resumen"
        description="Lo producido, lo vendido y las promesas de compra en el rango elegido."
      />

      <div className={reportStyles.filters}>
        <div className={reportStyles.filter}>
          <span id="summary-from-label">Desde</span>
          <DatePicker className="input" aria-labelledby="summary-from-label" value={from} max={to || undefined} onChange={(v) => setFrom(v)} />
        </div>
        <div className={reportStyles.filter}>
          <span id="summary-to-label">Hasta</span>
          <DatePicker className="input" aria-labelledby="summary-to-label" value={to} min={from || undefined} onChange={(v) => setTo(v)} />
        </div>
        {!isDefaultRange && (
          <Button variant="ghost" size="sm" onClick={resetRange}>Mes en curso</Button>
        )}
        <Button
          variant="secondary"
          icon={Download}
          className={reportStyles.exportBtn}
          onClick={() => exportToExcel(data, from, to)}
          disabled={!data || isEmpty}
        >
          Exportar a Excel
        </Button>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <SkeletonKpis count={4}label="Cargando resumen..." />
          <SkeletonTable rows={5} label="Cargando resumen..." />
        </div>
      ) : isError ? (
        <div className={styles.error} role="alert">
          <p>{error?.message || "No se pudo cargar el resumen"}</p>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => refetch()} loading={isFetching}>Reintentar</Button>
        </div>
      ) : (
        <div className={styles.content} aria-busy={isFetching || undefined}>
          <div className={reportStyles.kpis}>
            <div className={reportStyles.kpi}>
              <span>Producidas</span>
              <strong>{num(totals.produced_units)} uds.</strong>
            </div>
            <div className={reportStyles.kpi}>
              <span>Vendidas</span>
              <strong>{num(totals.sold_units)} uds.</strong>
              <span className={styles.kpiAmount}>{formatAmount(totals.sold_amount)}</span>
            </div>
            <div className={reportStyles.kpi}>
              <span>Promesas</span>
              <strong>{num(totals.promises_units)} uds.</strong>
              <span className={styles.kpiAmount}>{formatAmount(totals.promises_amount)}</span>
            </div>
            <div className={`${reportStyles.kpi} ${inventoryUnits < 0 ? styles.kpiWarning : ""}`}>
              <span>En inventario</span>
              <strong>{inventoryUnits} uds.</strong>
              <span className={styles.kpiNote}>
                {inventoryUnits < 0 ? "Vendido más de lo producido en el rango" : "Producidas − Vendidas del rango"}
              </span>
            </div>
          </div>

          {isEmpty ? (
            <EmptyState
              icon={LayoutDashboard}
              title="Sin movimiento en este rango"
              description="No hay producción, ventas ni promesas de compra entre esas fechas. Prueba con otro rango."
              action={!isDefaultRange ? <Button variant="secondary" size="sm" onClick={resetRange}>Ver mes en curso</Button> : undefined}
            />
          ) : (
            <div className={styles.sections}>
              <ProducedTable rows={producedRows} />
              <LinesTable id="sold" title="Vendidos" rows={sold} emptyText="Sin ventas cobradas en este rango." />
              <LinesTable id="promises" title="Promesas de compra" rows={promises} withStatus emptyText="Sin promesas de compra en este rango." />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Summary;
