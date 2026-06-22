import { useState, useRef, useEffect, useMemo } from "react";
import { currencies } from "../helpers/utils";
import styles from "./CurrencySelect.module.css";

/**
 * CurrencySelect — dropdown personalizado con búsqueda y agrupación por región.
 *
 * Props:
 *  - value:    código de moneda seleccionado (ej. "DOP")
 *  - onChange: (code) => void
 *  - placeholder?: texto cuando no hay selección
 *
 * Lee el orden de `currencies` y los agrupa por el campo `region`.
 * Si una moneda no tiene `region`, cae en "Otras".
 */
export default function CurrencySelect({ value, onChange, placeholder = "Seleccionar moneda" }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlight, setHighlight] = useState(0);
    const rootRef = useRef(null);
    const inputRef = useRef(null);

    const selected = currencies.find((c) => c.code === value) || null;

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

    // Focus al input al abrir
    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    // Filtrado por nombre o código
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return currencies;
        return currencies.filter(
            (c) =>
                c.name.toLowerCase().includes(term) ||
                c.code.toLowerCase().includes(term)
        );
    }, [search]);

    // Agrupar por región (manteniendo el orden de aparición)
    const grouped = useMemo(() => {
        const map = new Map();
        filtered.forEach((c) => {
            const region = c.region || "Otras";
            if (!map.has(region)) map.set(region, []);
            map.get(region).push(c);
        });
        return [...map.entries()]; // [ [region, [currencies]], ... ]
    }, [filtered]);

    // Lista plana para navegación con teclado
    const flat = useMemo(() => grouped.flatMap(([, list]) => list), [grouped]);

    const choose = (code) => {
        onChange(code);
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
            if (flat[highlight]) choose(flat[highlight].code);
        } else if (e.key === "Escape") {
            setOpen(false);
            setSearch("");
        }
    };

    // Resetear highlight cuando cambia el filtro
    useEffect(() => setHighlight(0), [search]);

    return (
        <div className={styles.root} ref={rootRef}>
            {/* Trigger */}
            <button
                type="button"
                className={styles.trigger}
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                {selected ? (
                    <span className={styles.selectedText}>
                        {selected.name} <span className={styles.symbol}>({selected.symbol})</span>
                    </span>
                ) : (
                    <span className={styles.placeholder}>{placeholder}</span>
                )}
                <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}>▾</span>
            </button>

            {/* Panel */}
            {open && (
                <div className={styles.panel}>
                    <div className={styles.searchBox}>
                        <input
                            ref={inputRef}
                            className={styles.searchInput}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder="Buscar por nombre o código..."
                        />
                    </div>

                    <div className={styles.list} role="listbox">
                        {flat.length === 0 ? (
                            <div className={styles.empty}>Sin resultados</div>
                        ) : (
                            grouped.map(([region, list]) => (
                                <div key={region} className={styles.group}>
                                    <div className={styles.groupLabel}>{region}</div>
                                    {list.map((c) => {
                                        const flatIndex = flat.indexOf(c);
                                        const isHighlighted = flatIndex === highlight;
                                        const isSelected = c.code === value;
                                        return (
                                            <button
                                                type="button"
                                                key={c.code}
                                                role="option"
                                                aria-selected={isSelected}
                                                className={`${styles.option} ${isHighlighted ? styles.optionHighlight : ""} ${isSelected ? styles.optionSelected : ""}`}
                                                onClick={() => choose(c.code)}
                                                onMouseEnter={() => setHighlight(flatIndex)}
                                            >
                                                <span className={styles.optName}>{c.name}</span>
                                                <span className={styles.optCode}>
                                                    {c.code} · {c.symbol}
                                                </span>
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
