import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  MONTHS_LONG, DAYS_LONG, DAYS_MIN,
  parseISODate, toISODate, today as getToday, addDays, addMonths,
  sameDay, clampDate, isOutOfRange, formatShort, formatLong, monthMatrix,
} from "./dateUtils";
import styles from "./DatePicker.module.css";

const SHEET_QUERY = "(max-width: 560px)";
const GAP = 6;
const MARGIN = 8;

/**
 * DatePicker — sustituto accesible de <input type="date">.
 *
 * Valor: string "YYYY-MM-DD" ("" = sin fecha), siempre en fecha local.
 * onChange(value, eventLike): `value` es el string; `eventLike.target.value` también,
 *   para handlers que esperan un evento.
 * Props: min, max ("YYYY-MM-DD"), disabled, required, id, name, placeholder,
 *   aria-label, aria-labelledby, aria-describedby, aria-invalid,
 *   clearable (por defecto !required), className (clases del disparador, p. ej. "input"),
 *   wrapperClassName, tone ("brand" | "catalog").
 *
 * Tema: variables --dp-* que el contenedor puede sobrescribir (--dp-accent,
 *   --dp-on-accent, --dp-surface, --dp-text, --dp-muted, --dp-border, --dp-hover,
 *   --dp-focus, --dp-shadow, --dp-scrim, --dp-radius, --dp-font).
 *   tone="catalog" toma por defecto los colores del negocio (--cat-*).
 */
export default function DatePicker({
  value = "",
  onChange,
  min,
  max,
  disabled = false,
  required = false,
  id,
  name,
  placeholder = "Seleccionar fecha",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  clearable,
  className = "",
  wrapperClassName = "",
  tone = "brand",
}) {
  const autoId = useId();
  const triggerId = id || `dp-${autoId}`;
  const headingId = `${triggerId}-heading`;
  const valueTextId = `${triggerId}-valuetext`;

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const popRef = useRef(null);
  const gridRef = useRef(null);
  const focusGridRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(() => getToday());

  const selected = parseISODate(value);
  const minD = parseISODate(min);
  const maxD = parseISODate(max);
  const canClear = (clearable ?? !required) && !!value && !disabled;
  const todayD = getToday();

  const weeks = useMemo(
    () => monthMatrix(focused.getFullYear(), focused.getMonth()),
    [focused]
  );

  const emit = (v) => onChange?.(v, { target: { value: v, name, id: triggerId } });

  const openPicker = () => {
    if (disabled) return;
    setFocused(clampDate(selected || getToday(), minD, maxD));
    focusGridRef.current = true;
    setOpen(true);
  };

  const close = (returnFocus) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus({ preventScroll: true });
  };

  const select = (date) => {
    if (isOutOfRange(date, minD, maxD)) return;
    emit(toISODate(date));
    close(true);
  };

  const clear = () => {
    emit("");
    if (open) close(true);
    else triggerRef.current?.focus({ preventScroll: true });
  };

  // ── Posición: anclado al disparador y dentro del viewport; en móvil, hoja inferior ──
  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const pop = popRef.current;
      const trig = triggerRef.current;
      if (!pop || !trig) return;
      if (window.matchMedia(SHEET_QUERY).matches) {
        pop.style.top = "";
        pop.style.left = "";
        pop.style.transformOrigin = "";
        return;
      }
      const r = trig.getBoundingClientRect();
      const w = pop.offsetWidth;
      const h = pop.offsetHeight;
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const fitsBelow = r.bottom + GAP + h <= vh - MARGIN;
      const fitsAbove = r.top - GAP - h >= MARGIN;
      const below = fitsBelow || (!fitsAbove && vh - r.bottom >= r.top);
      let top = below ? r.bottom + GAP : r.top - GAP - h;
      top = Math.max(MARGIN, Math.min(top, vh - h - MARGIN));
      const left = Math.max(MARGIN, Math.min(r.left, vw - w - MARGIN));
      const originX = Math.max(0, Math.min(w, r.left + Math.min(r.width, w) / 2 - left));
      pop.style.top = `${top}px`;
      pop.style.left = `${left}px`;
      pop.style.transformOrigin = `${originX}px ${below ? "0" : "100%"}`;
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  // ── Clic fuera cierra (sin robar el foco) ──
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open]);

  // ── Foco itinerante en la cuadrícula ──
  useEffect(() => {
    if (!open || !focusGridRef.current) return;
    const btn = gridRef.current?.querySelector(`[data-iso="${toISODate(focused)}"]`);
    btn?.focus({ preventScroll: true });
  }, [open, focused]);

  const moveFocus = (date) => {
    focusGridRef.current = true;
    setFocused(clampDate(date, minD, maxD));
  };

  const onGridKeyDown = (e) => {
    const f = focused;
    let next = null;
    switch (e.key) {
      case "ArrowLeft": next = addDays(f, -1); break;
      case "ArrowRight": next = addDays(f, 1); break;
      case "ArrowUp": next = addDays(f, -7); break;
      case "ArrowDown": next = addDays(f, 7); break;
      case "Home": next = addDays(f, -f.getDay()); break;
      case "End": next = addDays(f, 6 - f.getDay()); break;
      case "PageUp": next = addMonths(f, e.shiftKey ? -12 : -1); break;
      case "PageDown": next = addMonths(f, e.shiftKey ? 12 : 1); break;
      case "Enter":
      case " ":
        e.preventDefault();
        select(f);
        return;
      default:
        return;
    }
    e.preventDefault();
    moveFocus(next);
  };

  // Esc y Tab se resuelven aquí y no llegan a los modales contenedores
  const onPopKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close(true);
      return;
    }
    if (e.key === "Tab") {
      e.stopPropagation();
      const items = [...popRef.current.querySelectorAll("button:not([disabled])")].filter((el) => el.tabIndex >= 0);
      if (!items.length) return;
      e.preventDefault();
      const i = items.indexOf(document.activeElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
      items[next].focus();
    }
  };

  const onTriggerKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      openPicker();
    }
  };

  const navMonth = (delta) => {
    focusGridRef.current = false;
    setFocused((f) => clampDate(addMonths(f, delta), minD, maxD));
  };

  const prevDisabled = !!minD && new Date(focused.getFullYear(), focused.getMonth(), 0) < minD;
  const nextDisabled = !!maxD && new Date(focused.getFullYear(), focused.getMonth() + 1, 1) > maxD;
  const todayDisabled = isOutOfRange(todayD, minD, maxD);

  const valueText = selected ? formatLong(selected) : "sin fecha";
  const describedBy = [ariaLabel ? null : valueTextId, ariaDescribedBy].filter(Boolean).join(" ") || undefined;

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${tone === "catalog" ? styles.toneCatalog : ""} ${wrapperClassName}`}
    >
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className={`${styles.trigger} ${className || styles.triggerDefault} ${canClear ? styles.hasClear : ""}`}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel ? `${ariaLabel}: ${valueText}` : undefined}
        aria-labelledby={ariaLabelledBy ? `${ariaLabelledBy} ${valueTextId}` : undefined}
        aria-describedby={ariaLabelledBy ? ariaDescribedBy : describedBy}
        aria-required={required || undefined}
        aria-invalid={ariaInvalid}
        onClick={() => (open ? close(false) : openPicker())}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={selected ? styles.value : styles.placeholder}>
          {selected ? formatShort(selected) : placeholder}
        </span>
        {!canClear && <CalendarDays className={styles.icon} size={16} aria-hidden="true" />}
      </button>
      <span id={valueTextId} className={styles.srOnly}>{`Fecha seleccionada: ${valueText}`}</span>

      {canClear && (
        <button type="button" className={styles.clear} onClick={clear} aria-label="Borrar fecha">
          <X size={16} aria-hidden="true" />
        </button>
      )}

      {(name || required) && (
        <input
          className={styles.srOnly}
          tabIndex={-1}
          aria-hidden="true"
          name={name}
          value={value || ""}
          required={required}
          disabled={disabled}
          onChange={() => {}}
          onFocus={() => triggerRef.current?.focus()}
        />
      )}

      {open && (
        <>
          <div className={styles.scrim} onClick={() => close(true)} aria-hidden="true" />
          <div
            ref={popRef}
            className={styles.popover}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel ? `Elegir fecha: ${ariaLabel}` : "Elegir fecha"}
            onKeyDown={onPopKeyDown}
          >
            <div className={styles.header}>
              <button type="button" className={styles.navBtn} onClick={() => navMonth(-1)} disabled={prevDisabled} aria-label="Mes anterior">
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <h2 id={headingId} className={styles.heading} aria-live="polite">
                {MONTHS_LONG[focused.getMonth()]} {focused.getFullYear()}
              </h2>
              <button type="button" className={styles.navBtn} onClick={() => navMonth(1)} disabled={nextDisabled} aria-label="Mes siguiente">
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>

            <table ref={gridRef} role="grid" className={styles.grid} aria-labelledby={headingId} onKeyDown={onGridKeyDown}>
              <thead>
                <tr>
                  {DAYS_MIN.map((d, i) => (
                    <th key={i} scope="col" abbr={DAYS_LONG[i]} className={styles.weekday}>
                      <span aria-hidden="true">{d}</span>
                      <span className={styles.srOnly}>{DAYS_LONG[i]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, w) => (
                  <tr key={w}>
                    {week.map((d) => {
                      const iso = toISODate(d);
                      const isSel = sameDay(d, selected);
                      const isToday = sameDay(d, todayD);
                      const isFocused = sameDay(d, focused);
                      const out = isOutOfRange(d, minD, maxD);
                      const outside = d.getMonth() !== focused.getMonth();
                      return (
                        <td key={iso} role="gridcell" aria-selected={isSel}>
                          <button
                            type="button"
                            data-iso={iso}
                            tabIndex={isFocused ? 0 : -1}
                            className={[
                              styles.day,
                              outside && styles.outside,
                              isToday && styles.today,
                              isSel && styles.selected,
                            ].filter(Boolean).join(" ")}
                            aria-label={`${formatLong(d)}${isToday ? ", hoy" : ""}${out ? ", no disponible" : ""}`}
                            aria-current={isToday ? "date" : undefined}
                            aria-disabled={out || undefined}
                            onClick={() => (out ? moveFocus(d) : select(d))}
                          >
                            {d.getDate()}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.footer}>
              <button type="button" className={styles.footBtn} onClick={() => select(todayD)} disabled={todayDisabled}>
                Hoy
              </button>
              {canClear && (
                <button type="button" className={styles.footBtn} onClick={clear}>
                  Borrar
                </button>
              )}
              <button type="button" className={`${styles.footBtn} ${styles.footClose}`} onClick={() => close(true)}>
                Cerrar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
