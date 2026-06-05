import styles from "./PlanCard.module.css";
import PrimaryButton from "./PrimaryButton";

const PlanCard = ({ plan, button }) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.name}>{plan.name}</h3>

      <div className={styles.priceContainer}>
        <span className={styles.currency}>$</span>
        <span className={styles.price}>{plan.unit_price}</span>
      </div>

      <div className={styles.period}>{plan.product_name}</div>

      <ul className={styles.features}>
        <li>1 catálogo</li>
        <li>Categorías ilimitadas</li>
        <li>Productos ilimitados</li>
        <li>Manejo de clientes</li>
        <li>Integración con WhatsApp</li>
      </ul>

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