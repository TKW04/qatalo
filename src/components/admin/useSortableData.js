import { useCallback, useMemo, useState } from "react";

// Ordenamiento de tablas por columna (clic en encabezado: asc → desc → asc…).
// Sin columna activa se respeta el orden de entrada (el "orden inicial" de cada tabla).

const ES_COLLATOR = new Intl.Collator("es", { sensitivity: "base", numeric: true });
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

const isEmpty = (v) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "") ||
  (typeof v === "number" && Number.isNaN(v));

/** "YYYY-MM-DD" se interpreta como fecha local (no UTC); otros ISO con Date. Devuelve ms o null. */
export const parseSortDate = (v) => {
  if (isEmpty(v)) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.getTime();
  const s = String(v).trim();
  const m = DATE_ONLY.exec(s);
  const t = m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : new Date(s).getTime();
  return Number.isNaN(t) ? null : t;
};

const normalize = (v, type) => {
  if (isEmpty(v)) return null;
  if (type === "number") {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  }
  if (type === "date") return parseSortDate(v);
  return String(v).trim();
};

const compareValues = (a, b, type) =>
  type === "number" || type === "date" ? a - b : ES_COLLATOR.compare(a, b);

/**
 * useSortableData(items, columns)
 *   columns: { [key]: { type: "text" | "number" | "date", value?: (row) => any } }
 *   `value` debe devolver el valor CRUDO (número/fecha), no el texto formateado.
 *   Vacíos/null siempre al final, en ambos sentidos. Orden estable.
 * Devuelve { sorted, sortKey, direction, requestSort, resetSort, getSortDirection }.
 */
export const useSortableData = (items, columns) => {
  const [sort, setSort] = useState({ key: null, direction: "ascending" });

  const sorted = useMemo(() => {
    const col = sort.key ? columns[sort.key] : null;
    if (!col || !Array.isArray(items)) return items;
    const type = col.type || "text";
    const get = col.value || ((row) => row[sort.key]);
    const sign = sort.direction === "descending" ? -1 : 1;
    return items
      .map((row, index) => ({ row, index, v: normalize(get(row), type) }))
      .sort((a, b) => {
        if (a.v === null && b.v === null) return a.index - b.index;
        if (a.v === null) return 1;
        if (b.v === null) return -1;
        return sign * compareValues(a.v, b.v, type) || a.index - b.index;
      })
      .map((e) => e.row);
  }, [items, columns, sort]);

  const requestSort = useCallback((key) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "ascending" ? "descending" : "ascending" }
        : { key, direction: "ascending" }
    );
  }, []);

  const resetSort = useCallback(() => setSort({ key: null, direction: "ascending" }), []);

  const getSortDirection = useCallback(
    (key) => (sort.key === key ? sort.direction : "none"),
    [sort]
  );

  return { sorted, sortKey: sort.key, direction: sort.direction, requestSort, resetSort, getSortDirection };
};

export default useSortableData;
