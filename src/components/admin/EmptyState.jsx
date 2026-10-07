import styles from "./admin.module.css";

/** Estado vacío con acción: siempre di qué hacer a continuación. */
const EmptyState = ({ icon: Icon, title, description, action, compact = false }) => (
  <div className={`${styles.empty} ${compact ? styles.emptyCompact : ""}`}>
    {Icon && (
      <span className={styles.emptyIcon} aria-hidden="true">
        <Icon size={24} />
      </span>
    )}
    <p className={styles.emptyTitle}>{title}</p>
    {description && <p className={styles.emptyText}>{description}</p>}
    {action && <div className={styles.emptyAction}>{action}</div>}
  </div>
);

export default EmptyState;
