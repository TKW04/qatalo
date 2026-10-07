// Efecto 03 (toggle Mensual/Anual). Uso:
//   <BillingToggle value="month" onChange={setCycle} savings="Ahorra 17%" />
// Renderízalo SOLO si existen ambas periodicidades reales del mismo plan, y calcula
// `savings` con los precios reales (si no hay ahorro, no lo pases).
import styles from "./BillingToggle.module.css";

const OPTIONS = [
  { value: "month", label: "Mensual" },
  { value: "year", label: "Anual" },
];

const BillingToggle = ({ value, onChange, savings, className = "" }) => (
  <div
    className={`${styles.toggle} ${className}`}
    role="group"
    aria-label="Periodicidad de pago"
    data-active={value === "year" ? "1" : "0"}
  >
    <span className={styles.thumb} aria-hidden="true" />
    {OPTIONS.map((o) => (
      <button
        key={o.value}
        type="button"
        className={styles.option}
        aria-pressed={value === o.value}
        onClick={() => onChange(o.value)}
      >
        {o.label}
        {o.value === "year" && savings ? <span className={styles.savings}>{savings}</span> : null}
      </button>
    ))}
  </div>
);

export default BillingToggle;
