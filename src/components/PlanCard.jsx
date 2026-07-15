import { useState } from "react";
import styles from "./PlanCard.module.css";
import PrimaryButton from "./PrimaryButton";

const PlanCard = ({ plan, button, showAll: showAllProp, onToggleShowAll }) => {

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

  return (
    <div className={styles.card}>
      <h3 className={styles.name}>{plan.name}</h3>

      <div className={styles.priceContainer}>
        <span className={styles.currency}>$</span>
        <span className={styles.price}>{plan.unit_price}</span>
      </div>

      <div className={styles.period}>{plan.product_name}</div>

      <ul className={styles.features}>
        {visible.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>

      {FEATURES.length > VISIBLE && (
        <button
          type="button"
          className={styles.moreBtn}
          onClick={toggle}
          aria-expanded={showAll}
        >
          {showAll ? "Ver menos" : "Ver más"}
        </button>
      )}

      {button ? (
        button
      ) : (
        <PrimaryButton to={`/register?plan=${plan.price_id}`} variant="primary">
          Seleccionar Plan
        </PrimaryButton>
      )}
    </div>
  );
};

export default PlanCard;