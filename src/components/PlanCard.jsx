const PlanCard = ({ plan, button }) => {
  return (
    <div className="plan-card" key={plan.price_id}>
      <h3 className="plan-name">{plan.name}</h3>
      <p className="plan-description">{plan.description}</p>
      <div className="plan-price">
        <span className="currency">$</span>
        <span id="basic-price">{plan.unit_price}</span>
      </div>
      <div className="plan-period">por usuario/{plan.billing_cycle}</div>
      <ul className="plan-features">
        <li>1 catálogo</li>
        <li>Categorías ilimitadas</li>
        <li>Productos ilimitados</li>
        <li>Manejo de clientes</li>
        <li>Integración con Whatsapp</li>
      </ul>
      {button}
    </div>
  );
};
export default PlanCard;
