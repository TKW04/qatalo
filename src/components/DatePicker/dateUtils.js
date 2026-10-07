// Utilidades de fecha para DatePicker. Todo es fecha LOCAL (sin zona horaria):
// "YYYY-MM-DD" se parsea con new Date(y, m, d), nunca con new Date("YYYY-MM-DD")
// (que se interpreta como UTC y en RD (UTC-4) retrocede un día).

export const MONTHS_LONG = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const DAYS_LONG = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const DAYS_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
export const DAYS_MIN = ["D", "L", "M", "X", "J", "V", "S"];

/** "YYYY-MM-DD" (o ISO con hora: se toman los 10 primeros caracteres) → Date local o null. */
export const parseISODate = (value) => {
  if (!value || typeof value !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const date = new Date(y, mo, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) return null;
  return date;
};

const pad = (n) => String(n).padStart(2, "0");

/** Date local → "YYYY-MM-DD". */
export const toISODate = (date) =>
  date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : "";

export const today = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
};

export const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

/** Suma meses conservando el día cuando existe (31 ene + 1 mes → 28/29 feb). */
export const addMonths = (date, n) => {
  const first = new Date(date.getFullYear(), date.getMonth() + n, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), last));
};

export const sameDay = (a, b) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Limita date a [min, max] (Date o null). */
export const clampDate = (date, min, max) => {
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
};

export const isOutOfRange = (date, min, max) => (!!min && date < min) || (!!max && date > max);

/** "mié 8 oct 2026" */
export const formatShort = (date) =>
  date ? `${DAYS_SHORT[date.getDay()]} ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}` : "";

/** "miércoles, 8 de octubre de 2026" */
export const formatLong = (date) =>
  date ? `${DAYS_LONG[date.getDay()]}, ${date.getDate()} de ${MONTHS_LONG[date.getMonth()]} de ${date.getFullYear()}` : "";

/** 6 semanas (42 días) empezando en domingo (es-DO), para una altura estable. */
export const monthMatrix = (year, month) => {
  const first = new Date(year, month, 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
};
