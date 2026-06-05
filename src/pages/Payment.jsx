import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import PaddleCheckoutButton from "../components/PaddleCheckoutButton";
import PlanCard from "../components/PlanCard";
import { getTokenInfo } from "../helpers/token";
import { fetchPlans } from "../services/subscriptionApi";
import styles from "./Payment.module.css";

const Payment = () => {
  const auth = getTokenInfo();

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: fetchPlans,
    retry: false,
  });

  useEffect(() => {
    if (
      auth &&
      auth["custom:transaction_status"] &&
      auth["custom:transaction_status"] !== "pending"
    ) {
      window.location.href = "/admin";
    }
  }, [auth]);

  const isLoggedIn = auth && auth.email;

  return (
    <div className={styles.page}>
      <div className={styles.containerPayment}>
        <header className={styles.header}>
          <div className={styles.logo}>
            <img
              src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo.png"
              alt="Qatalo"
              width={200}
            />
          </div>
          <div className={styles.subtitle}>
            Automatiza tu flujo de trabajo con la plataforma más avanzada
          </div>

          {!isLoggedIn && (
            <div className={styles.subtitle}>
              <h3>¡Hola! Para acceder a los planes debes iniciar sesión</h3>
              <button className={styles.loginBtn} onClick={() => (window.location.href = "/login")}>
                Iniciar sesión
              </button>
            </div>
          )}
        </header>

        <section className={styles.pricingSection}>
          {isLoggedIn && (
            <>
              <h1 className={styles.sectionTitle}>Planes y Precios</h1>
              <div className={styles.plansGrid}>
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
                        customerId={auth["custom:customer_id"] || null}
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
    </div>
  );
};

export default Payment;