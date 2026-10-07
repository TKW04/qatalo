import { Check, XCircle } from "lucide-react";
import { ORDER_FLOW } from "./status";
import styles from "./admin.module.css";

const SHORT = {
  "Pendiente de pago": "Pago",
  "Pendiente de validación": "Validación",
  "Aprobada": "Aprobada",
  "Entregada": "Entregada",
};

/**
 * Stepper estático del ciclo de la orden (efecto 14 sin animación).
 * "Pago Completado" se trata como "Aprobada". "Cancelada" muestra un aviso.
 */
const OrderStepper = ({ status }) => {
  if (status === "Cancelada") {
    return (
      <div className={styles.stepperCancelled} role="status">
        <XCircle size={18} aria-hidden="true" /> Orden cancelada
      </div>
    );
  }
  const normalized = status === "Pago Completado" ? "Aprobada" : status;
  const current = ORDER_FLOW.indexOf(normalized);
  if (current === -1) return null;
  const isLast = current === ORDER_FLOW.length - 1;

  return (
    <ol className={styles.stepper} aria-label="Progreso de la orden">
      {ORDER_FLOW.map((step, i) => {
        const done = i < current || (isLast && i === current);
        const isCurrent = i === current && !isLast;
        const cls = [styles.step, done ? styles.stepDone : "", isCurrent ? styles.stepCurrent : ""].join(" ");
        return (
          <li key={step} className={cls} aria-current={i === current ? "step" : undefined}>
            <span className={styles.stepDot} aria-hidden="true">
              {done ? <Check size={14} strokeWidth={3} /> : i + 1}
            </span>
            <span className={styles.stepLabel}>{SHORT[step]}</span>
          </li>
        );
      })}
    </ol>
  );
};

export default OrderStepper;
