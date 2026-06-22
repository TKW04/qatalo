import { useState, useRef, useEffect, useMemo } from "react";
import styles from "./Select.module.css";

/**
 * Select — dropdown genérico reutilizable.
 *
 * Props principales:
 *  - value:        valor seleccionado (lo que sea que uses como id)
 *  - onChange:     (value) => void
 *  - options:      array de opciones. Cada una: { value, label, sublabel?, group? }
 *                    value:    lo que se guarda (ej. "DOP", category_id, etc.)
 *                    label:    texto principal visible
 *                    sublabel: texto secundario a la derecha (opcional, ej. código/símbolo)
 *                    group:    nombre del grupo para agrupar (opcional)
 *  - placeholder?: texto cuando no hay selección
 *  - searchable?:  muestra el campo de búsqueda (default: true si hay > 8 opciones)
 *  - searchKeys?:  campos por los que filtra (default: ["label", "value"])
 *  - disabled?:    deshabilita el control
 *
 * Reemplazo directo de un <select>: value + onChange funcionan igual.
 */
export default function Select({
  value,
  onChange,
  options = [],
  placeholder = "Seleccionar...",
  searchable,
  searchKeys = ["label", "value"],
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find((o) => o.value === value) || null;

  // Búsqueda automática si hay muchas opciones (a menos que se especifique)
  const showSearch = searchable !== undefined ? searchable : options.length > 8;

  // Cerrar al hacer click fuera
  useEffect(() => {
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (open && showSearch && inputRef.current) inputRef.current.focus();
  }, [open, showSearch]);

  // Filtrado
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) =>
      searchKeys.some((k) => String(o[k] || "").toLowerCase().includes(term))
    );
  }, [search, options, searchKeys]);

  // Agrupar (si alguna opción tiene `group`)
  const hasGroups = useMemo(() => options.some((o) => o.group), [options]);
  const grouped = useMemo(() => {
    if (!hasGroups) return [["", filtered]];
    const map = new Map();
    filtered.forEach((o) => {
      const g = o.group || "Otras";
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(o);
    });
    return [...map.entries()];
  }, [filtered, hasGroups]);

  const flat = useMemo(() => grouped.flatMap(([, list]) => list), [grouped]);

  const choose = (val) => {
    onChange(val);
    setOpen(false);
    setSearch("");
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[highlight]) choose(flat[highlight].value);
    } else if (e.key === "Escape") {
      setOpen(false);
      setSearch("");
    }
  };

  useEffect(() => setHighlight(0), [search]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <span className={styles.selectedText}>
            {selected.label}
            {selected.sublabel && <span className={styles.sublabel}> ({selected.sublabel})</span>}
          </span>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}>▾</span>
      </button>

      {open && (
        <div className={styles.panel}>
          {showSearch && (
            <div className={styles.searchBox}>
              <input
                ref={inputRef}
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Buscar..."
              />
            </div>
          )}

          <div className={styles.list} role="listbox">
            {flat.length === 0 ? (
              <div className={styles.empty}>Sin resultados</div>
            ) : (
              grouped.map(([group, list]) => (
                <div key={group || "_"} className={styles.group}>
                  {group && <div className={styles.groupLabel}>{group}</div>}
                  {list.map((o) => {
                    const flatIndex = flat.indexOf(o);
                    const isHighlighted = flatIndex === highlight;
                    const isSelected = o.value === value;
                    return (
                      <button
                        type="button"
                        key={o.value}
                        role="option"
                        aria-selected={isSelected}
                        className={`${styles.option} ${isHighlighted ? styles.optionHighlight : ""} ${isSelected ? styles.optionSelected : ""}`}
                        onClick={() => choose(o.value)}
                        onMouseEnter={() => setHighlight(flatIndex)}
                      >
                        <span className={styles.optLabel}>{o.label}</span>
                        {o.sublabel && <span className={styles.optSub}>{o.sublabel}</span>}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
