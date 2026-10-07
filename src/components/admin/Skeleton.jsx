import styles from "./admin.module.css";

/** Bloque base. Usa los presets de abajo para cada zona. */
export const Skeleton = ({ width = "100%", height = 14, radius, className = "", style }) => (
  <span
    className={`${styles.skeleton} ${className}`}
    style={{ width, height, borderRadius: radius, ...style }}
    aria-hidden="true"
  />
);

const Status = ({ label }) => <span className={styles.srOnly} role="status">{label}</span>;

/** Lista de tarjetas/filas (productos, categorías, clientes...). */
export const SkeletonList = ({ rows = 5, label = "Cargando...", media = true }) => (
  <div className={styles.skeletonStack} aria-busy="true">
    <Status label={label} />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={`${styles.skeletonCard} ${styles.skeletonRow}`}>
        {media && <Skeleton width={48} height={48} radius={8} />}
        <div className={styles.skeletonGrow}>
          <Skeleton width="45%" height={16} />
          <Skeleton width="70%" height={12} />
        </div>
        <Skeleton width={72} height={28} radius={999} />
      </div>
    ))}
  </div>
);

/** Tabla (órdenes, reportes por producto). */
export const SkeletonTable = ({ rows = 6, label = "Cargando..." }) => (
  <div className={styles.skeletonCard} aria-busy="true">
    <Status label={label} />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={styles.skeletonTableRow}>
        <Skeleton width="80%" height={14} />
        <Skeleton width="60%" height={14} />
        <Skeleton width="50%" height={14} />
        <Skeleton width="40%" height={14} />
      </div>
    ))}
  </div>
);

/** Fila de KPIs. */
export const SkeletonKpis = ({ count = 4, label = "Cargando..." }) => (
  <div className={styles.skeletonKpis} aria-busy="true">
    <Status label={label} />
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`${styles.skeletonCard} ${styles.skeletonStack}`}>
        <Skeleton width="55%" height={12} />
        <Skeleton width="70%" height={26} />
      </div>
    ))}
  </div>
);

const BAR_HEIGHTS = [55, 80, 40, 95, 65, 75, 45];

/** Gráfico de barras. */
export const SkeletonChart = ({ label = "Cargando..." }) => (
  <div className={styles.skeletonCard} aria-busy="true">
    <Status label={label} />
    <Skeleton width="35%" height={16} />
    <div className={styles.skeletonChart}>
      {BAR_HEIGHTS.map((h, i) => (
        <Skeleton key={i} className={styles.skeletonBar} height={`${h}%`} radius="6px 6px 0 0" width="auto" />
      ))}
    </div>
  </div>
);

/** Formulario (configuración, métodos de pago...). */
export const SkeletonForm = ({ fields = 5, label = "Cargando..." }) => (
  <div className={`${styles.skeletonCard} ${styles.skeletonStack}`} aria-busy="true">
    <Status label={label} />
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className={styles.skeletonStack} style={{ gap: 6 }}>
        <Skeleton width={120} height={12} />
        <Skeleton height={40} />
      </div>
    ))}
  </div>
);

export default Skeleton;
