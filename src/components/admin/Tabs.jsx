import { useRef } from "react";
import styles from "./admin.module.css";

/**
 * Pestañas accesibles (role=tablist, aria-selected, flechas/Home/End).
 *   <Tabs idPrefix="reports" label="Tipo de reporte" items={[{id, label, icon?, badge?}]}
 *         value={tab} onChange={setTab} />
 *   <TabPanel idPrefix="reports" id="general" value={tab}>...</TabPanel>
 */
export const Tabs = ({ items, value, onChange, label, idPrefix = "tabs", className = "" }) => {
  const refs = useRef({});

  const onKeyDown = (e) => {
    const idx = items.findIndex((t) => t.id === value);
    let next = null;
    if (e.key === "ArrowRight") next = (idx + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next === null) return;
    e.preventDefault();
    const target = items[next];
    onChange(target.id);
    refs.current[target.id]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className={`${styles.tabList} ${className}`} onKeyDown={onKeyDown}>
      {items.map(({ id, label: tabLabel, icon: Icon, badge }) => {
        const selected = id === value;
        return (
          <button
            key={id}
            ref={(el) => { refs.current[id] = el; }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${id}`}
            tabIndex={selected ? 0 : -1}
            className={styles.tab}
            onClick={() => onChange(id)}
          >
            {Icon && <Icon size={18} aria-hidden="true" />}
            {tabLabel}
            {badge != null && <span className={styles.tabBadge}>{badge}</span>}
          </button>
        );
      })}
    </div>
  );
};

export const TabPanel = ({ idPrefix = "tabs", id, value, children, className }) => {
  if (id !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${id}`}
      aria-labelledby={`${idPrefix}-tab-${id}`}
      className={className}
    >
      {children}
    </div>
  );
};

export default Tabs;
