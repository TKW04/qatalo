import styles from "./admin.module.css";

/** Encabezado de pestaña del admin: título corto, descripción opcional y acciones. */
const PageHeader = ({ title, description, actions, id }) => (
  <header className={styles.pageHeader}>
    <div className={styles.pageHeaderText}>
      <h1 className={styles.pageTitle} id={id}>{title}</h1>
      {description && <p className={styles.pageDescription}>{description}</p>}
    </div>
    {actions && <div className={styles.pageActions}>{actions}</div>}
  </header>
);

export default PageHeader;
