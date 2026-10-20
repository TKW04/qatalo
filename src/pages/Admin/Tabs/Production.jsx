import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, RefreshCw, Factory, Plus, ArrowDownUp } from "lucide-react";

import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import { formatDate } from "../../../helpers/utils";
import Select from "../../../components/Select";
import DatePicker, { toISODate, parseISODate } from "../../../components/DatePicker";
import { DAYS_LONG } from "../../../components/DatePicker/dateUtils";
import {
  PageHeader,
  Button,
  IconButton,
  Modal,
  EmptyState,
  Field,
  Tabs,
  TabPanel,
  SkeletonTable,
  SkeletonKpis,
  SortableHeader,
  useSortableData,
} from "../../../components/admin";
import { fetchProducts } from "../../../services/productsApi";
import {
  fetchProductionLogs,
  createProductionLog,
  deleteProductionLog,
  fetchProductionReport,
} from "../../../services/productionApi";
import reportStyles from "../../../components/SellReport.module.css"; // misma paleta que Reportes
import styles from "./Production.module.css";
import Recipes from "./Recipes";

const PRODUCTION_TABS = [
  { id: "log", label: "Registro" },
  { id: "detail", label: "Detalle" },
  { id: "report", label: "Fabricados vs Vendidos" },
  { id: "recipes", label: "Recetas" },
];

const LOG_SORT = {
  date: { type: "date" },
  product_name: { type: "text" },
  quantity: { type: "number" },
};
const REPORT_SORT = {
  product_name: { type: "text" },
  produced: { type: "number" },
  sold: { type: "number" },
  difference: { type: "number" },
};

const todayISO = () => toISODate(new Date());
const monthStartISO = () => {
  const n = new Date();
  return toISODate(new Date(n.getFullYear(), n.getMonth(), 1));
};

// Años disponibles (desc) a partir de fechas "YYYY-...".
const yearsFrom = (dates) => {
  const set = new Set();
  dates.forEach((d) => { const y = (d || "").slice(0, 4); if (/^\d{4}$/.test(y)) set.add(y); });
  return [...set].sort((a, b) => b.localeCompare(a));
};
const yearOptions = (years) => [{ value: "all", label: "Todos los años" }, ...years.map((y) => ({ value: y, label: y }))];

// Selector de año para filtros por rango: fija Desde/Hasta al año completo (dispara el fetch existente).
// Si el usuario edita las fechas a mano, el selector vuelve a "Todos".
// Siempre visible: "all" aquí significa rango manual (Desde/Hasta), no "sin filtro".
const YearRangeFilter = ({ idPrefix, years, year, onSelect }) => {
  if (years.length === 0) return null;
  return (
    <div className={reportStyles.filter}>
      <span id={`${idPrefix}-year-label`}>Año</span>
      <div className={styles.filterSelect} aria-labelledby={`${idPrefix}-year-label`}>
        <Select
          value={year}
          onChange={onSelect}
          options={[{ value: "all", label: "Rango personalizado" }, ...years.map((y) => ({ value: y, label: y }))]}
        />
      </div>
    </div>
  );
};

const useYearRange = (years) => {
  const [from, setFromRaw] = useState(monthStartISO);
  const [to, setToRaw] = useState(todayISO);
  const [year, setYear] = useState("all");
  useEffect(() => {
    if (year !== "all" && !years.includes(year)) setYear("all");
  }, [years, year]);
  const selectYear = (y) => {
    setYear(y);
    if (y !== "all") { setFromRaw(`${y}-01-01`); setToRaw(`${y}-12-31`); }
  };
  const setFrom = (v) => { setYear("all"); setFromRaw(v); };
  const setTo = (v) => { setYear("all"); setToRaw(v); };
  return { from, to, year, setFrom, setTo, selectYear };
};

const EMPTY_FORM = { product_id: "", quantity: "", date: "", note: "" };

const diffClass = (v) => (v > 0 ? reportStyles.positive : v < 0 ? styles.negative : undefined);
const signed = (v) => (v > 0 ? `+${v}` : String(v));

/* ---------- Registro de fabricación ---------- */
const ProductionLog = ({ tenantId, products, productsLoading }) => {
  const { showError, showWarning, showSuccess } = useNotification();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, date: todayISO() }));
  const [errors, setErrors] = useState({});
  const [productFilter, setProductFilter] = useState("all");
  const [year, setYear] = useState("all");
  const [toDelete, setToDelete] = useState(null);

  const productOptions = useMemo(
    () =>
      products
        .map((p) => ({ value: p.product_id, label: (p.name || "").trim() || "—" }))
        .sort((a, b) => a.label.localeCompare(b.label, "es")),
    [products]
  );

  const {
    data: logs = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["production", tenantId, productFilter],
    queryFn: () => fetchProductionLogs({ product_id: productFilter === "all" ? "" : productFilter }),
    enabled: !!tenantId,
    retry: false,
  });

  // Años disponibles (desc) derivados de date. Si el año elegido desaparece, volver a "all".
  const years = useMemo(() => yearsFrom(logs.map((l) => l.date)), [logs]);
  useEffect(() => {
    if (year !== "all" && !years.includes(year)) setYear("all");
  }, [years, year]);
  const yearLogs = useMemo(
    () => (year === "all" ? logs : logs.filter((l) => (l.date || "").slice(0, 4) === year)),
    [logs, year]
  );

  const logSort = useSortableData(yearLogs, LOG_SORT);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["production", tenantId] });
    queryClient.invalidateQueries({ queryKey: ["production-report", tenantId] });
    // La fabricación modifica el stock del producto
    queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
  };

  const createMutation = useMutation({
    mutationFn: createProductionLog,
    onSuccess: () => {
      showSuccess("¡Éxito!", "Fabricación registrada y sumada al stock");
      invalidate();
      setForm((f) => ({ ...EMPTY_FORM, date: f.date }));
      setErrors({});
    },
    onError: (error) => showWarning("Revisa la información", error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteProductionLog(id),
    onSuccess: () => {
      showSuccess("Eliminado", "Registro de fabricación eliminado");
      invalidate();
      setToDelete(null);
    },
    onError: (error) => showError("Error", error.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    const next = {};
    if (!form.product_id) next.product_id = "Selecciona un producto";
    if (!form.quantity || !Number.isInteger(qty) || qty <= 0) next.quantity = "Ingresa una cantidad entera mayor que 0";
    if (!form.date) next.date = "Selecciona la fecha de fabricación";
    setErrors(next);
    if (Object.keys(next).length) {
      return showWarning("Valida tu información", "Completa los campos obligatorios");
    }
    const note = form.note.trim();
    createMutation.mutate({
      product_id: form.product_id,
      quantity: qty,
      date: form.date,
      ...(note ? { note } : {}),
    });
  };

  const focusForm = () => {
    document.getElementById("production-quantity")?.focus();
  };

  return (
    <>
      {/* Formulario */}
      <section className={styles.card} aria-labelledby="production-form-title">
        <h2 id="production-form-title">Registrar fabricación</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <span className={styles.groupLabel} id="production-product-label">
                Producto <span className={styles.required} aria-hidden="true">*</span>
              </span>
              <Select
                value={form.product_id}
                onChange={(v) => setForm({ ...form, product_id: v })}
                options={productOptions}
                placeholder={productsLoading ? "Cargando productos..." : "Seleccionar producto"}
                disabled={productsLoading}
              />
              {errors.product_id && <span className={styles.err}>{errors.product_id}</span>}
            </div>
            <Field label="Cantidad fabricada" required error={errors.quantity}>
              <input
                id="production-quantity"
                className="input"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="Ej. 24"
              />
            </Field>
          </div>
          <div className={styles.formRow}>
            <Field label="Fecha" required error={errors.date}>
              <DatePicker
                id="production-date"
                className="input"
                required
                value={form.date}
                max={todayISO()}
                onChange={(v) => setForm({ ...form, date: v })}
              />
            </Field>
            <Field label="Nota" hint="Opcional. Ej. lote, materiales, responsable.">
              <input
                id="production-note"
                className="input"
                maxLength={200}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Ej. Lote #12"
              />
            </Field>
          </div>
          <div className={styles.formActions}>
            <Button type="submit" icon={Plus} loading={createMutation.isPending}>
              {createMutation.isPending ? "Guardando..." : "Registrar fabricación"}
            </Button>
          </div>
        </form>
      </section>

      {/* Listado */}
      <div className={styles.listHeader}>
        <h2>Registros de fabricación</h2>
        <div className={styles.listTools}>
          {years.length > 1 && (
            <div className={styles.filterSelect} aria-label="Filtrar registros por año">
              <Select value={year} onChange={setYear} options={yearOptions(years)} />
            </div>
          )}
          {productOptions.length > 0 && (
            <div className={styles.filterSelect}>
              <Select
                value={productFilter}
                onChange={setProductFilter}
                options={[{ value: "all", label: "Todos los productos" }, ...productOptions]}
              />
            </div>
          )}
          <Button variant="secondary" size="sm" icon={RefreshCw} loading={isFetching && !isLoading} onClick={() => refetch()}>
            Actualizar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} label="Cargando registros..." />
      ) : yearLogs.length === 0 ? (
        <EmptyState
          icon={Factory}
          title={productFilter === "all" && year === "all" ? "Aún no registras fabricación" : "Sin registros para este filtro"}
          description="Cada registro suma la cantidad fabricada al stock del producto."
          action={
            productFilter === "all" && year === "all"
              ? <Button icon={Plus} onClick={focusForm}>Registrar fabricación</Button>
              : <Button variant="secondary" onClick={() => { setProductFilter("all"); setYear("all"); }}>Quitar filtros</Button>
          }
        />
      ) : (
        <div className={reportStyles.tableCard}>
          <div className={reportStyles.tableWrap}>
            <table className={reportStyles.table}>
              <thead>
                <tr>
                  <SortableHeader sortKey="date" sort={logSort}>Fecha</SortableHeader>
                  <SortableHeader sortKey="product_name" sort={logSort}>Producto</SortableHeader>
                  <SortableHeader sortKey="quantity" sort={logSort}>Cantidad</SortableHeader>
                  <th>Nota</th>
                  <th><span className={styles.srOnly}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {logSort.sorted.map((log) => (
                  <tr key={log.log_id}>
                    <td>{log.date ? formatDate(log.date) : "—"}</td>
                    <td>{log.product_name || "—"}</td>
                    <td><strong>{log.quantity}</strong></td>
                    <td className={reportStyles.cellMuted}>{log.note || "—"}</td>
                    <td className={styles.actionsCell}>
                      <IconButton
                        icon={Trash2}
                        variant="danger"
                        label={`Eliminar registro de ${log.product_name || "producto"}`}
                        onClick={() => setToDelete(log)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Eliminar registro"
        size="sm"
        dismissible={!deleteMutation.isPending}
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(toDelete.log_id)}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </>
        }
      >
        <p className={styles.modalText}>
          ¿Seguro que deseas eliminar el registro de <strong>{toDelete?.quantity}</strong> unidades de{" "}
          <strong>{toDelete?.product_name}</strong>
          {toDelete?.date ? ` del ${formatDate(toDelete.date)}` : ""}? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </>
  );
};

/* ---------- Detalle de producción (matriz fecha × producto) ---------- */
const pad2 = (n) => String(n).padStart(2, "0");
// "YYYY-MM-DD" → "lunes 19/10" (fecha local, no UTC); con año si el rango cruza años
const formatDayLabel = (iso, withYear) => {
  const d = parseISODate(iso);
  if (!d) return iso || "—";
  const base = `${DAYS_LONG[d.getDay()]} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
  return withYear ? `${base}/${d.getFullYear()}` : base;
};

const ProductionDetail = ({ tenantId, years }) => {
  const { from, to, year, setFrom, setTo, selectYear } = useYearRange(years);
  const [descending, setDescending] = useState(false);

  const { data: logs = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    // bajo ["production", tenantId] → se invalida al crear/eliminar registros
    queryKey: ["production", tenantId, "detail", from, to],
    queryFn: () => fetchProductionLogs({ from, to }),
    enabled: !!tenantId,
    retry: false,
  });

  const matrix = useMemo(() => {
    const productNames = new Map(); // product_id -> nombre
    const cells = new Map(); // date -> Map(product_id -> cantidad)
    logs.forEach((log) => {
      const date = (log.date || "").slice(0, 10);
      const qty = Number(log.quantity) || 0;
      if (!date || !log.product_id) return;
      if (!productNames.has(log.product_id)) {
        productNames.set(log.product_id, (log.product_name || "").trim() || "—");
      }
      if (!cells.has(date)) cells.set(date, new Map());
      const row = cells.get(date);
      row.set(log.product_id, (row.get(log.product_id) || 0) + qty);
    });

    const columns = [...productNames.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
    const dates = [...cells.keys()].sort();
    const withYear = dates.length > 0 && dates[0].slice(0, 4) !== dates[dates.length - 1].slice(0, 4);

    const rows = dates.map((date) => {
      const values = cells.get(date);
      const total = [...values.values()].reduce((a, b) => a + b, 0);
      return { date, label: formatDayLabel(date, withYear), values, total };
    });
    const columnTotals = columns.map((c) => rows.reduce((a, r) => a + (r.values.get(c.id) || 0), 0));
    const grandTotal = columnTotals.reduce((a, b) => a + b, 0);
    return { columns, rows, columnTotals, grandTotal };
  }, [logs]);

  const rows = descending ? [...matrix.rows].reverse() : matrix.rows;

  return (
    <div>
      {/* Filtros */}
      <div className={reportStyles.filters}>
        <div className={reportStyles.filter}>
          <span id="production-detail-from-label">Desde</span>
          <DatePicker className="input" aria-labelledby="production-detail-from-label" value={from} max={to || undefined} onChange={(v) => setFrom(v)} />
        </div>
        <div className={reportStyles.filter}>
          <span id="production-detail-to-label">Hasta</span>
          <DatePicker className="input" aria-labelledby="production-detail-to-label" value={to} min={from || undefined} onChange={(v) => setTo(v)} />
        </div>
        <YearRangeFilter idPrefix="production-detail" years={years} year={year} onSelect={selectYear} />
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} label="Cargando detalle..." />
      ) : isError ? (
        <p className={styles.errorText} role="alert">{error?.message || "No se pudo cargar el detalle"}</p>
      ) : matrix.rows.length === 0 ? (
        <EmptyState
          icon={Factory}
          title="Sin fabricación en el rango"
          description="Ajusta las fechas o registra fabricación en la pestaña Registro."
        />
      ) : (
        <div className={reportStyles.tableCard}>
          <div className={styles.listHeader}>
            <h2>Detalle Producción</h2>
            <div className={styles.listTools}>
              <Button
                variant="secondary"
                size="sm"
                icon={ArrowDownUp}
                onClick={() => setDescending((v) => !v)}
                title="Cambiar el orden de las fechas"
              >
                {descending ? "Más recientes primero" : "Más antiguas primero"}
              </Button>
              <Button variant="secondary" size="sm" icon={RefreshCw} loading={isFetching && !isLoading} onClick={() => refetch()}>
                Actualizar
              </Button>
            </div>
          </div>
          <div className={reportStyles.tableWrap}>
            <table className={`${reportStyles.table} ${styles.matrix}`}>
              <thead>
                <tr>
                  <th rowSpan={2} scope="col" className={styles.stickyCol}>Fecha</th>
                  <th colSpan={matrix.columns.length} scope="colgroup" className={styles.groupHead}>Cantidad</th>
                  <th rowSpan={2} scope="col" className={styles.numCell}>Total</th>
                </tr>
                <tr>
                  {matrix.columns.map((c) => (
                    <th key={c.id} scope="col" className={styles.numCell}>{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.date}>
                    <th scope="row" className={`${styles.stickyCol} ${styles.rowHead}`}>{r.label}</th>
                    {matrix.columns.map((c) => {
                      const v = r.values.get(c.id);
                      return (
                        <td key={c.id} className={v ? styles.numCell : `${styles.numCell} ${reportStyles.cellMuted}`}>
                          {v || "—"}
                        </td>
                      );
                    })}
                    <td className={styles.numCell}><strong>{r.total}</strong></td>
                  </tr>
                ))}
                <tr className={reportStyles.totalRow}>
                  <td className={styles.stickyCol}>Total</td>
                  {matrix.columnTotals.map((t, i) => (
                    <td key={matrix.columns[i].id} className={styles.numCell}>{t}</td>
                  ))}
                  <td className={styles.numCell}>{matrix.grandTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Reporte Fabricados vs Vendidos ---------- */
// Disponible = is_available === "available"; Agotado = cualquier otro valor o producto inexistente. El backend lo envía como `active`.
const AVAILABILITY_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "available", label: "Disponible" },
  { value: "unavailable", label: "Agotado" },
];

const ProductionReport = ({ tenantId, years }) => {
  const { from, to, year, setFrom, setTo, selectYear } = useYearRange(years);
  const [availability, setAvailability] = useState("all");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["production-report", tenantId, from, to],
    queryFn: () => fetchProductionReport({ from, to }),
    enabled: !!tenantId,
    retry: false,
  });

  // Un backend antiguo no envía `active`: sin ese dato no se puede filtrar, así que el filtro se oculta y se trata como "Todos".
  const rawItems = useMemo(() => data?.items || [], [data]);
  const canFilterAvailability = rawItems.length === 0 || rawItems.some((it) => typeof it.active === "boolean");
  const effectiveAvailability = canFilterAvailability ? availability : "all";

  const items = useMemo(
    () => rawItems
      .filter((it) => effectiveAvailability === "all" || (effectiveAvailability === "available" ? it.active === true : it.active !== true))
      .sort((a, b) => (Number(b.produced) || 0) - (Number(a.produced) || 0)),
    [rawItems, effectiveAvailability]
  );
  // Totales recalculados sobre los productos filtrados.
  const totals = useMemo(() => {
    const produced = items.reduce((acc, it) => acc + (Number(it.produced) || 0), 0);
    const sold = items.reduce((acc, it) => acc + (Number(it.sold) || 0), 0);
    return { produced, sold, difference: produced - sold };
  }, [items]);
  const reportSort = useSortableData(items, REPORT_SORT);

  return (
    <div>
      {/* Filtros */}
      <div className={reportStyles.filters}>
        <div className={reportStyles.filter}>
          <span id="production-report-from-label">Desde</span>
          <DatePicker className="input" aria-labelledby="production-report-from-label" value={from} max={to || undefined} onChange={(v) => setFrom(v)} />
        </div>
        <div className={reportStyles.filter}>
          <span id="production-report-to-label">Hasta</span>
          <DatePicker className="input" aria-labelledby="production-report-to-label" value={to} min={from || undefined} onChange={(v) => setTo(v)} />
        </div>
        <YearRangeFilter idPrefix="production-report" years={years} year={year} onSelect={selectYear} />
        {canFilterAvailability && (
          <div className={reportStyles.filter}>
            <span id="production-report-availability-label">Disponibilidad</span>
            <div className={styles.filterSelect} aria-labelledby="production-report-availability-label">
              <Select value={availability} onChange={setAvailability} options={AVAILABILITY_OPTIONS} />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <SkeletonKpis count={3} label="Cargando reporte..." />
          <SkeletonTable rows={5} label="Cargando reporte..." />
        </div>
      ) : isError ? (
        <p className={styles.errorText} role="alert">{error?.message || "No se pudo cargar el reporte"}</p>
      ) : (
        <>
          {/* KPIs */}
          <div className={reportStyles.kpis}>
            <div className={reportStyles.kpi}><span>Unidades fabricadas</span><strong>{totals.produced}</strong></div>
            <div className={reportStyles.kpi}><span>Unidades vendidas</span><strong>{totals.sold}</strong></div>
            <div className={reportStyles.kpi}>
              <span>Diferencia</span>
              <strong className={diffClass(totals.difference)}>{signed(totals.difference)}</strong>
            </div>
          </div>

          {/* Tabla */}
          <div className={reportStyles.tableCard}>
            <h3>Fabricados vs vendidos por producto</h3>
            <div className={reportStyles.tableWrap}>
              <table className={reportStyles.table}>
                <thead>
                  <tr>
                    <SortableHeader sortKey="product_name" sort={reportSort}>Producto</SortableHeader>
                    <SortableHeader sortKey="produced" sort={reportSort}>Fabricados</SortableHeader>
                    <SortableHeader sortKey="sold" sort={reportSort}>Vendidos</SortableHeader>
                    <SortableHeader sortKey="difference" sort={reportSort}>Diferencia</SortableHeader>
                  </tr>
                </thead>
                <tbody>
                  {reportSort.sorted.map((it) => (
                    <tr key={it.product_id}>
                      <td>{it.product_name || "—"}</td>
                      <td>{it.produced}</td>
                      <td>{it.sold}</td>
                      <td className={diffClass(it.difference)}><strong>{signed(it.difference)}</strong></td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td colSpan={4} className={reportStyles.tableEmpty}>
                      {effectiveAvailability === "all"
                        ? "Sin fabricación ni ventas en el rango seleccionado."
                        : `Sin productos ${effectiveAvailability === "available" ? "disponibles" : "agotados"} con fabricación o ventas en el rango seleccionado.`}
                    </td></tr>
                  )}
                  {items.length > 0 && (
                    <tr className={reportStyles.totalRow}>
                      <td>Total</td>
                      <td>{totals.produced}</td>
                      <td>{totals.sold}</td>
                      <td className={diffClass(totals.difference)}>{signed(totals.difference)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className={styles.footnote}>
            Vendidos incluye las órdenes en todos los estados. Una diferencia positiva indica unidades fabricadas aún sin vender.
          </p>
        </>
      )}
    </div>
  );
};

const Production = () => {
  const auth = getTokenInfo();
  const tenantId = auth?.sub;
  const [tab, setTab] = useState("log");

  // misma queryKey que Products.jsx → caché compartido, sin doble fetch
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products", tenantId],
    queryFn: fetchProducts,
    enabled: !!tenantId,
    retry: false,
  });

  // misma queryKey que el Registro sin filtro de producto → caché compartido; de aquí salen los años
  const { data: allLogs = [] } = useQuery({
    queryKey: ["production", tenantId, "all"],
    queryFn: () => fetchProductionLogs({ product_id: "" }),
    enabled: !!tenantId,
    retry: false,
  });
  // Años para los filtros por rango: los de la bitácora + el actual y los 4 anteriores (las ventas pueden
  // existir en años sin producción registrada), igual que los chips de la app.
  const productionYears = useMemo(() => {
    const y = new Date().getFullYear();
    const recent = Array.from({ length: 5 }, (_, i) => `${y - i}-01-01`);
    return yearsFrom([...allLogs.map((l) => l.date), ...recent]);
  }, [allLogs]);

  return (
    <div>
      <PageHeader title="Producción" description="Registra lo que fabricas y compáralo con lo vendido." />

      <Tabs idPrefix="production" label="Sección de producción" items={PRODUCTION_TABS} value={tab} onChange={setTab} />

      <TabPanel idPrefix="production" id="log" value={tab}>
        <ProductionLog
          tenantId={tenantId}
          products={Array.isArray(products) ? products : []}
          productsLoading={productsLoading}
        />
      </TabPanel>
      <TabPanel idPrefix="production" id="detail" value={tab}>
        <ProductionDetail tenantId={tenantId} years={productionYears} />
      </TabPanel>
      <TabPanel idPrefix="production" id="report" value={tab}>
        <ProductionReport tenantId={tenantId} years={productionYears} />
      </TabPanel>
      <TabPanel idPrefix="production" id="recipes" value={tab}>
        <Recipes tenantId={tenantId} />
      </TabPanel>
    </div>
  );
};

export default Production;
