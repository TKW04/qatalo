import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Image } from "primereact/image";
import { Button } from "primereact/button";
import { useNotification } from "../components/UI/NotificationProvider";
import "./Payment.css";

import { Checkout, GetPlans } from "../store/payment-store/plan-actions";
const Payment = () => {
  const plans = useSelector((state) => state.plan.plans);
  const dispatch = useDispatch();
  const { showError } = useNotification();

  useEffect(() => {
    if (plans.length === 0) {
      dispatch(GetPlans());
    }
  }, [dispatch, plans.length]);

  return (
    <div class="container-payment">
      <header>
        <div class="logo-payment">
          <Image
            src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo.png"
            alt="CatalogQR Logo"
            width={200}
            style={{ padding: "0rem" }}
          />
        </div>
        <div class="subtitle">
          Automatiza tu flujo de trabajo con la plataforma más avanzada
        </div>
      </header>

      <section class="pricing-section">
        <h1 class="section-title">Planes y Precios</h1>
        <div class="plans-grid">
          {plans.map((plan) => (
            <div class="plan-card" key={plan.price_id}>
              <h3 class="plan-name">{plan.name}</h3>
              <p class="plan-description">{plan.description}</p>
              <div class="plan-price">
                <span class="currency">$</span>
                <span id="basic-price">{plan.unit_price}</span>
              </div>
              <div class="plan-period">por usuario/{plan.billing_cycle}</div>
              <ul class="plan-features">
                <li>1 catálogo</li>
                <li>Categorías ilimitadas</li>
                <li>Productos ilimitados</li>
                <li>Manejo de clientes</li>
                <li>Integración con Whatsapp</li>
              </ul>
              <Button
                className="plan-button secondary"
                label="Comenzar Gratis"
                type="button"
                onClick={() => dispatch(Checkout(plan.price_id, showError))}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Payment;
