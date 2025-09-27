import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Image } from "primereact/image";

import PaddleCheckoutButton from "../components/PaddleCheckoutButton";

import { useNotification } from "../components/UI/NotificationProvider";
import "./Payment.css";

import { GetPlans } from "../store/payment-store/plan-actions";
import { getTokenInfo } from "../helpers/token";
import PlanCard from "../components/PlanCard";
import { Button } from "primereact/button";
const Payment = () => {
  const auth = getTokenInfo();
  const plans = useSelector((state) => state.plan.plans);
  const { showError } = useNotification();

  const dispatch = useDispatch();

  useEffect(() => {
    if (plans.length === 0) {
      dispatch(GetPlans(showError()));
    }
  }, [dispatch, plans, showError]);

  if (
    auth !== null &&
    auth["custom:transaction_status"] !== null &&
    auth["custom:transaction_status"] !== "pending"
  ) {
    window.location.href = "/admin";
  }

  return (
    <div className="container-payment">
      <header>
        <div className="logo-payment">
          <Image
            src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo.png"
            alt="CatalogQR Logo"
            width={200}
            style={{ padding: "0rem" }}
          />
        </div>
        <div className="subtitle">
          Automatiza tu flujo de trabajo con la plataforma más avanzada
        </div>
        {(auth === null || auth.email === null || auth.email === "") && (
          <div className="subtitle">
            <h3>¡Hola! Para poder acceder a los planes debes iniciar sesión</h3>
            <Button
              label="Iniciar Sesión"
              className="btn btn-outline"
              style={{ width: "200px" }}
              onClick={() => {
                window.location.href = "/login";
              }}
            />
          </div>
        )}
      </header>

      <section className="pricing-section">
        {auth !== null && auth.email !== null && auth.email !== "" && (
          <>
            <h1 className="section-title">Planes y Precios</h1>
            <div className="plans-grid">
              {plans.map((plan) => (
                <PlanCard
                  plan={plan}
                  key={plan.price_id}
                  button={
                    <PaddleCheckoutButton
                      mode="price"
                      priceId={plan.price_id}
                      quantity={1}
                      email={auth.email}
                      customerId={
                        auth["custom:customer_id"] !== "" &&
                        auth["custom:customer_id"]
                          ? auth["custom:customer_id"]
                          : null
                      }
                      customData={{ appUserId: auth.sub }}
                      locale="es"
                      successUrl={import.meta.env.VITE_APP_LOGIN_REDIRECT_URL}
                    />
                  }
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Payment;
