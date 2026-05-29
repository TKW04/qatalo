import styles from "./PlanCard.module.css";
import PrimaryButton from "./PrimaryButton";

const PlanCard = ({ plan }) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.name}>{plan.name}</h3>
      {/* <p className={styles.description}>{plan.description}</p> */}
      
      <div className={styles.priceContainer}>
        <span className={styles.currency}>$</span>
        <span className={styles.price}>{plan.unit_price}</span>
      </div>
      
      <div className={styles.period}> {plan.product_name}</div>
      
      <ul className={styles.features}>
        <li>✓ 1 catálogo</li>
        <li>✓ Categorías ilimitadas</li>
        <li>✓ Productos ilimitados</li>
        <li>✓ Manejo de clientes</li>
        <li>✓ Integración con Whatsapp</li>
      </ul>

      {/* Aquí inyectamos nuestro botón estandarizado */}
      <PrimaryButton to={`/register?plan=${plan.price_id}`} variant="primary">
        Seleccionar Plan
      </PrimaryButton>
    </div>
  );
};

export default PlanCard;