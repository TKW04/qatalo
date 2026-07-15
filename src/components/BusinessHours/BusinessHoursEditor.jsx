import { TbClock, TbTrash, TbPlus, TbCopy } from "react-icons/tb";
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
  const statusStyle =
    status.level === "open" ? S.statusOpen :
    status.level === "closing_soon" ? S.statusSoon : S.statusClosed;

  return (
    <div>
      {/* Toggle maestro */}
      <label style={S.masterRow}>
        <input type="checkbox" checked={enabled} onChange={(e) => onChange?.({ enabled: e.target.checked })} />
        <span style={S.masterText}>
          <strong>{masterLabel}</strong>
          <span style={S.masterHint}>{masterHint}</span>
        </span>
      </label>

      {enabled && (
        <>
          {/* Modo */}
          <div style={S.modeBox}>
            <span style={S.modeTitle}>Cuando esté cerrado…</span>
            <div style={S.modePills}>
              {HOURS_MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  style={{ ...S.pill, ...(mode === m.value ? S.pillActive : {}) }}
                  onClick={() => onChange?.({ mode: m.value })}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <span style={S.modeHint}>
              {mode === "block"
                ? "Los clientes verán el aviso y NO podrán completar el pedido hasta que abras."
                : "Los clientes verán el aviso, pero igual podrán enviar su pedido."}
            </span>
          </div>

          {/* Vista previa del estado ahora */}
          {showStatus && (
            <div style={{ ...S.statusPreview, ...statusStyle }}>
              <TbClock /> Ahora mismo: <strong>{status.message}</strong>
            </div>
          )}

          {/* Días */}
          <div style={S.days}>
            {DAYS.map((d) => {
              const ranges = h[d.key] || [];
              return (
                <div key={d.key} style={S.dayRow}>
                  <div style={S.dayHead}>
                    <span style={S.dayName}>{d.label}</span>
                    {ranges.length === 0
                      ? <span style={S.closedTag}>Cerrado</span>
                      : (
                        <button type="button" style={S.copyBtn} onClick={() => copyToAll(d.key)} title="Copiar este horario a todos los días">
                          <TbCopy size={14} /> Copiar a todos
                        </button>
                      )}
                  </div>

                  {ranges.map((r, idx) => (
                    <div key={idx} style={S.rangeRow}>
                      <input type="time" style={S.time} value={r.open || ""} onChange={(e) => setRange(d.key, idx, "open", e.target.value)} />
                      <span style={S.dash}>a</span>
                      <input type="time" style={S.time} value={r.close || ""} onChange={(e) => setRange(d.key, idx, "close", e.target.value)} />
                      <button type="button" style={S.rangeDel} onClick={() => removeRange(d.key, idx)} aria-label="Quitar rango"><TbTrash /></button>
                    </div>
                  ))}

                  <button type="button" style={S.addBtn} onClick={() => addRange(d.key)}>
                    <TbPlus size={14} /> {ranges.length ? "Agregar otro rango" : "Agregar horario"}
                  </button>
                </div>
              );
            })}
          </div>

          <p style={S.footHint}>
            Tip: para horarios que cruzan la medianoche (ej. abre 8:00 PM y cierra 2:00 AM), pon la hora de
            cierre menor a la de apertura — el sistema lo entiende como que cierra al día siguiente.
          </p>
        </>
      )}
    </div>
  );
};

const S = {
  masterRow: { display: "flex", alignItems: "flex-start", gap: ".6rem", cursor: "pointer", marginBottom: "1rem" },
  masterText: { display: "flex", flexDirection: "column", gap: ".15rem" },
  masterHint: { fontSize: ".82rem", color: "#667085" },
  modeBox: { background: "#f6f7f9", border: "1px solid #eef0f3", borderRadius: 10, padding: "0.85rem 1rem", marginBottom: "1rem" },
  modeTitle: { fontWeight: 700, color: "#113f67", fontSize: ".9rem" },
  modePills: { display: "flex", gap: ".5rem", margin: ".55rem 0 .5rem", flexWrap: "wrap" },
  pill: { padding: ".45rem .9rem", border: "1.5px solid #d0d5dd", background: "#fff", borderRadius: 999, fontSize: ".85rem", fontWeight: 600, color: "#475467", cursor: "pointer" },
  pillActive: { borderColor: "#113f67", background: "#113f67", color: "#fff" },
  modeHint: { fontSize: ".8rem", color: "#667085" },
  statusPreview: { display: "flex", alignItems: "center", gap: ".4rem", padding: ".6rem .85rem", borderRadius: 9, fontSize: ".88rem", marginBottom: "1.25rem" },
  statusOpen: { background: "#D1FAE5", color: "#065F46" },
  statusSoon: { background: "#FEF3C7", color: "#92400E" },
  statusClosed: { background: "#FEE4E2", color: "#B42318" },
  days: { display: "flex", flexDirection: "column", gap: ".6rem" },
  dayRow: { border: "1px solid #eef0f3", borderRadius: 10, padding: ".75rem .9rem", background: "#fff" },
  dayHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".5rem" },
  dayName: { fontWeight: 700, color: "#1d2939" },
  closedTag: { fontSize: ".78rem", color: "#98a2b3", fontWeight: 600 },
  copyBtn: { display: "inline-flex", alignItems: "center", gap: ".3rem", border: "none", background: "transparent", color: "#34699a", fontSize: ".78rem", fontWeight: 600, cursor: "pointer" },
  rangeRow: { display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".45rem" },
  time: { border: "1px solid #d0d5dd", borderRadius: 8, padding: ".4rem .5rem", fontSize: ".9rem", color: "#1d2939" },
  dash: { color: "#667085", fontSize: ".85rem" },
  rangeDel: { border: "none", background: "transparent", color: "#d92d20", cursor: "pointer", fontSize: "1rem", padding: ".2rem" },
  addBtn: { display: "inline-flex", alignItems: "center", gap: ".3rem", border: "1px dashed #cbd2da", background: "transparent", color: "#34699a", borderRadius: 8, padding: ".4rem .7rem", fontSize: ".82rem", fontWeight: 600, cursor: "pointer", marginTop: ".15rem" },
  footHint: { fontSize: ".8rem", color: "#667085", marginTop: "1rem", lineHeight: 1.5 },
};

export default BusinessHoursEditor;