// Lógica de horarios de atención del negocio.
// Zona horaria fija de RD (América/Santo_Domingo, UTC-4 todo el año, sin DST).
// Sin librerías externas: usa Intl para conocer la hora local del negocio.

export const TZ = "America/Santo_Domingo";

export const DAYS = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miércoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

export const HOURS_MODES = [
  { value: "inform", label: "Solo informar" },
  { value: "block", label: "Bloquear pedidos" },
];

export const defaultBusinessHours = () => ({
  mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [],
});

const _JS_WD_TO_KEY = { Sun: "sun", Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat" };

// Hora actual en RD (sin depender del navegador del cliente)
const nowInTZ = () => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, hour12: false, weekday: "short", hour: "2-digit", minute: "2-digit",
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value;
    let hour = parseInt(get("hour"), 10);
    if (hour === 24) hour = 0;
    const minute = parseInt(get("minute"), 10);
    return { dayKey: _JS_WD_TO_KEY[get("weekday")] || "mon", minutes: hour * 60 + minute };
  } catch {
    const d = new Date();
    return { dayKey: _JS_WD_TO_KEY[["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]], minutes: d.getHours() * 60 + d.getMinutes() };
  }
};

const toMin = (hhmm) => {
  const [h, m] = (hhmm || "0:0").split(":").map((n) => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
};

const prevKey = (key) => {
  const i = DAYS.findIndex((d) => d.key === key);
  return DAYS[(i + 6) % 7].key;
};

export const formatTime = (hhmm) => {
  const m = toMin(hhmm);
  let h = Math.floor(m / 60);
  const min = m % 60;
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(min).padStart(2, "0")} ${ap}`;
};

// ¿Está abierto ahora? (contempla rangos que cruzan medianoche)
export const isOpenNow = (hours, now = nowInTZ()) => {
  if (!hours) return false;

  const today = hours[now.dayKey] || [];
  for (const r of today) {
    const o = toMin(r.open), c = toMin(r.close);
    if (c > o) {
      if (now.minutes >= o && now.minutes < c) return true;
    } else if (c < o) {
      // cruza medianoche: la porción de hoy es o → 24:00
      if (now.minutes >= o) return true;
    }
  }

  // Rangos de AYER que cruzan medianoche: porción 00:00 → close
  const yest = hours[prevKey(now.dayKey)] || [];
  for (const r of yest) {
    const o = toMin(r.open), c = toMin(r.close);
    if (c < o && now.minutes < c) return true;
  }

  return false;
};

// Próxima apertura → { dayOffset, dayKey, open } o null
export const nextOpening = (hours, now = nowInTZ()) => {
  if (!hours) return null;
  const startIdx = DAYS.findIndex((d) => d.key === now.dayKey);
  for (let d = 0; d < 8; d++) {
    const key = DAYS[(startIdx + d) % 7].key;
    const ranges = [...(hours[key] || [])]
      .filter((r) => r && r.open)
      .sort((a, b) => toMin(a.open) - toMin(b.open));
    for (const r of ranges) {
      if (d === 0) {
        if (toMin(r.open) > now.minutes) return { dayOffset: d, dayKey: key, open: r.open };
      } else {
        return { dayOffset: d, dayKey: key, open: r.open };
      }
    }
  }
  return null;
};

// Minutos hasta el cierre si está abierto ahora (o null)
const minutesUntilClose = (hours, now) => {
  const today = hours[now.dayKey] || [];
  for (const r of today) {
    const o = toMin(r.open), c = toMin(r.close);
    if (c > o && now.minutes >= o && now.minutes < c) return c - now.minutes;
    if (c < o && now.minutes >= o) return (1440 - now.minutes) + c; // cruza medianoche
  }
  const yest = hours[prevKey(now.dayKey)] || [];
  for (const r of yest) {
    const o = toMin(r.open), c = toMin(r.close);
    if (c < o && now.minutes < c) return c - now.minutes;
  }
  return null;
};

const relTime = (mins) => {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

// Horario efectivo para una localidad: si la zona tiene override activo lo usa,
// si no, cae al horario general del negocio.
// business = objeto con business_hours_enabled/hours_mode/business_hours/locality_hours
export const effectiveHours = (business, locality) => {
  const lh = (business && business.locality_hours) || {};
  if (locality && locality !== "all" && lh[locality] && lh[locality].enabled) {
    return {
      business_hours_enabled: true,
      hours_mode: lh[locality].mode || "inform",
      business_hours: lh[locality].hours || {},
    };
  }
  return {
    business_hours_enabled: !!(business && business.business_hours_enabled),
    hours_mode: (business && business.hours_mode) || "inform",
    business_hours: (business && business.business_hours) || {},
  };
};

// Estado listo para la UI.
// config = { business_hours_enabled, hours_mode, business_hours }
// Devuelve level: "open" | "closing_soon" | "closed"
export const getHoursStatus = (config) => {
  if (!config || !config.business_hours_enabled) {
    return { enabled: false, open: true, blocking: false, level: "open", mode: "inform", message: "" };
  }
  const hours = config.business_hours || {};
  const now = nowInTZ();
  const open = isOpenNow(hours, now);
  const blocking = config.hours_mode === "block" && !open;

  let level, message;
  if (open) {
    const untilClose = minutesUntilClose(hours, now);
    if (untilClose != null && untilClose <= 60) {
      level = "closing_soon";
      message = `Cierra en ${relTime(untilClose)}`;
    } else {
      level = "open";
      message = "Abierto ahora";
    }
  } else {
    level = "closed";
    const nxt = nextOpening(hours, now);
    if (nxt) {
      const untilOpen = nxt.dayOffset * 1440 + toMin(nxt.open) - now.minutes;
      if (untilOpen <= 180) {
        message = `Cerrado · Abre en ${relTime(untilOpen)}`;
      } else {
        const when =
          nxt.dayOffset === 0 ? "hoy" :
          nxt.dayOffset === 1 ? "mañana" :
          `el ${DAYS.find((d) => d.key === nxt.dayKey).label}`;
        message = `Cerrado · Abre ${when} a las ${formatTime(nxt.open)}`;
      }
    } else {
      message = "Cerrado por ahora";
    }
  }

  return { enabled: true, open, blocking, level, mode: config.hours_mode || "inform", message };
};