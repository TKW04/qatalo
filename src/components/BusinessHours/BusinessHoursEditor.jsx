import { useId } from "react";
import { Clock, Trash2, Plus, Copy } from "lucide-react";
import styles from "./BusinessHours.module.css";
import { DAYS, HOURS_MODES, defaultBusinessHours, getHoursStatus } from "../../helpers/businessHours";

// Editor genérico de un bloque de horario (enabled + mode + hours).
// Emite patches con claves genéricas: onChange({ enabled }) / ({ mode }) / ({ hours }).
const BusinessHoursEditor = ({
  enabled = false,
  mode = "inform",
  hours,
  onChange,
  masterLabel = "Mostrar horario de atención",
  masterHint = "Muestra a tus clientes si estás abierto o cerrado (hora de RD).",
  showStatus = true,
}) => {
  const uid = useId();
  const h = hours || defaultBusinessHours();

  const patchHours = (next) => onChange?.({ hours: next });

  const setRange = (dayKey, idx, field, val) => {
    patchHours({ ...h, [dayKey]: (h[dayKey] || []).map((r, i) => (i === idx ? { ...r, [field]: val } : r)) });
  };
  const addRange = (dayKey) => {
    const existing = h[dayKey] || [];
    const nueva = existing.length ? { open: "18:00", close: "23:00" } : { open: "09:00", close: "17:00" };
    patchHours({ ...h, [dayKey]: [...existing, nueva] });
  };
  const removeRange = (dayKey, idx) => {
    patchHours({ ...h, [dayKey]: (h[dayKey] || []).filter((_, i) => i !== idx) });
  };
  const copyToAll = (dayKey) => {
    const src = (h[dayKey] || []).map((r) => ({ ...r }));
    const next = {};
    DAYS.forEach((d) => { next[d.key] = src.map((r) => ({ ...r })); });
    patchHours(next);
  };

  const status = getHoursStatus({ business_hours_enabled: enabled, hours_mode: mode, business_hours: h });
  const statusClass =
    status.level === "open" ? styles.statusOpen :
    status.level === "closing_soon" ? styles.statusSoon : styles.statusClosed;

  return (
    <div>
      {/* Toggle maestro */}
      <label className={styles.masterRow}>
        <input className={styles.check} type="checkbox" checked={enabled} onChange={(e) => onChange?.({ enabled: e.target.checked })} />
        <span className={styles.masterText}>
          <strong>{masterLabel}</strong>
          <span className={styles.masterHint}>{masterHint}</span>
        </span>
      </label>

      {enabled && (
        <>
          {/* Modo */}
          <div className={styles.modeBox}>
            <span className={styles.modeTitle} id={`${uid}-mode`}>Cuando esté cerrado…</span>
            <div className={styles.modePills} role="group" aria-labelledby={`${uid}-mode`}>
              {HOURS_MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  className={`${styles.pill} ${mode === m.value ? styles.pillActive : ""}`}
                  aria-pressed={mode === m.value}
                  onClick={() => onChange?.({ mode: m.value })}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <span className={styles.modeHint}>
              {mode === "block"
                ? "Los clientes verán el aviso y NO podrán completar el pedido hasta que abras."
                : "Los clientes verán el aviso, pero igual podrán enviar su pedido."}
            </span>
          </div>

          {/* Vista previa del estado ahora */}
          {showStatus && (
            <div className={`${styles.statusPreview} ${statusClass}`} role="status">
              <Clock size={16} aria-hidden="true" /> Ahora mismo: <strong>{status.message}</strong>
            </div>
          )}

          {/* Días */}
          <div className={styles.days}>
            {DAYS.map((d) => {
              const ranges = h[d.key] || [];
              return (
                <div key={d.key} className={styles.dayRow}>
                  <div className={styles.dayHead}>
                    <span className={styles.dayName}>{d.label}</span>
                    {ranges.length === 0
                      ? <span className={styles.closedTag}>Cerrado</span>
                      : (
                        <button type="button" className={styles.linkBtn} onClick={() => copyToAll(d.key)} title="Copiar este horario a todos los días">
                          <Copy size={14} aria-hidden="true" /> Copiar a todos
                        </button>
                      )}
                  </div>

                  {ranges.map((r, idx) => (
                    <div key={idx} className={styles.rangeRow}>
                      <input type="time" className={styles.time} aria-label={`${d.label}: abre`} value={r.open || ""} onChange={(e) => setRange(d.key, idx, "open", e.target.value)} />
                      <span className={styles.dash} aria-hidden="true">a</span>
                      <input type="time" className={styles.time} aria-label={`${d.label}: cierra`} value={r.close || ""} onChange={(e) => setRange(d.key, idx, "close", e.target.value)} />
                      <button type="button" className={styles.rangeDel} onClick={() => removeRange(d.key, idx)} aria-label={`Quitar rango del ${d.label.toLowerCase()}`} title="Quitar rango"><Trash2 size={18} aria-hidden="true" /></button>
                    </div>
                  ))}

                  <button type="button" className={styles.addBtn} onClick={() => addRange(d.key)}>
                    <Plus size={14} aria-hidden="true" /> {ranges.length ? "Agregar otro rango" : "Agregar horario"}
                  </button>
                </div>
              );
            })}
          </div>

          <p className={styles.footHint}>
            Tip: para horarios que cruzan la medianoche (ej. abre 8:00 PM y cierra 2:00 AM), pon la hora de
            cierre menor a la de apertura. El sistema lo entiende como que cierra al día siguiente.
          </p>
        </>
      )}
    </div>
  );
};

export default BusinessHoursEditor;
