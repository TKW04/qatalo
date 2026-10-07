import { useState } from "react";
import { Check } from "lucide-react";
import styles from "./PlanCard.module.css";
import PrimaryButton from "./PrimaryButton";
import RollingNumber from "./motion/RollingNumber";

const FEATURES = [
  "1 catálogo online con enlace propio y código QR personalizado",
  "Categorías y productos ilimitados",
  "Carrito de compras (varios productos en un solo pedido)",
  "Pedidos directos por WhatsApp",
  "Portal de clientes con inicio de sesión por correo y \"Mis órdenes\"",
  "Seguimiento de pedidos: pago, validación, aprobado y entregado",
  "Subida de comprobante de pago",
  "Reportes de ventas y exportación a Excel",
  // --- ocultas hasta "Ver más" ---
  "Diseño personalizable (21 temas de color)",
  "Múltiples métodos de pago (transferencia y link de pago)",
  "Entregas por localidad o zona",
  "Control de inventario automático",
  "Notificaciones por correo en cada etapa del pedido",
  "Base de clientes con historial de compras",
];

const VISIBLE = 8;

// Símbolo de la moneda que trae la API; si no la trae, se mantiene "$".
const currencySymbol = (code) => {
  if (!code) return "$";
  try {
    const part = new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(0)
      .find((p) => p.type === "currency");
    return part?.value || "$";
  } catch {
    return "$";
  }
};

const formatAmount = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return String(n ?? "");
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};

const PlanCard = ({ plan, button, showAll: showAllProp, onToggleShowAll, savings }) => {
  // Estado controlado por el padre si envía showAll/onToggleShowAll;
  // si no, cae a un estado interno (comportamiento anterior).
  const [showAllLocal, setShowAllLocal] = useState(false);
  const isControlled = showAllProp !== undefined;
  const showAll = isControlled ? showAllProp : showAllLocal;
  const toggle = () => {
    if (isControlled) onToggleShowAll?.();
    else setShowAllLocal((v) => !v);
  };

  const visible = showAll ? FEATURES : FEATURES.slice(0, VISIBLE);
  const title = plan.name || plan.product_name;
  // La API no trae la frecuencia (p. ej. Trimestral llega como "month"), así que no se
  // deduce un "/mes" o "/año": el nombre del precio ya indica la periodicidad.
  const subtitle = plan.description || (plan.name && plan.product_name !== plan.name ? plan.product_name : null);

  return (
    <article className={styles.card}>
      <header className={styles.head}>
        <h3 className={styles.name}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {savings && <span className={styles.savings}>{savings}</span>}
      </header>

      <p className={styles.priceContainer}>
        <span className={styles.currency}>{currencySymbol(plan.currency)}</span>
        <RollingNumber className={styles.price} value={formatAmount(plan.unit_price)} />
        {plan.currency && <span className={styles.code}>{plan.currency}</span>}
      </p>

      <ul className={styles.features}>
        {visible.map((f) => (
          <li key={f}>
            <Check className={styles.check} size={18} strokeWidth={2.5} aria-hidden="true" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {FEATURES.length > VISIBLE && (
        <button
          type="button"
          className={styles.moreBtn}
          onClick={toggle}
          aria-expanded={showAll}
        >
          {showAll ? "Ver menos" : `Ver ${FEATURES.length - VISIBLE} más`}
        </button>
      )}

      <div className={styles.action}>
        {button ? (
          button
        ) : (
          <PrimaryButton to={`/register?plan=${plan.price_id}`} variant="primary">
            Seleccionar plan
          </PrimaryButton>
        )}
      </div>
    </article>
  );
};

export default PlanCard;
