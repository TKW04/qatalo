import { statusTone } from "./status";
import styles from "./admin.module.css";

/** Insignia de estado de orden con los tokens --state-* (AA). */
const StatusBadge = ({ status, children, className = "" }) => (
  <span className={`${styles.status} ${styles[`status-${statusTone(status)}`]} ${className}`}>
    {children ?? status}
  </span>
);

export default StatusBadge;
