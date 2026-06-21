import { useQuery } from "@tanstack/react-query";
import { getTokenInfo } from "../../../helpers/token";
import Loading from "../../../components/UI/Loading";
import { formatDate, formatted } from "../../../helpers/utils";
import { fetchSubscription, fetchReactivationPrices } from "../../../services/subscriptionApi";
import PaddleCheckoutButton from "../../../components/PaddleCheckoutButton";
import adminStyles from "../AdminDashboard.module.css";
import styles from "./Subscription.module.css";

const STATUS_LABEL = {
  trialing: "En prueba", canceled: "Cancelado", expired: "Expirado",
  paused: "En pausa", pending: "Pendiente", active: "Activo",
};
const INTERVAL_LABEL = { month: "Mes", year: "Año", week: "Semana", day: "Día" };

// Estados donde la sub ya no está vigente → ofrecer reactivación
const NEEDS_REACTIVATION = ["canceled", "expired", "paused"];

const Subscription = () => {
  const auth = getTokenInfo();
  const subscriptionId = auth?.["custom:transaction_id"];
  const customerId = auth?.["custom:customer_id"];   // para vincular el checkout al cliente Paddle
  const userId = auth?.sub;

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", subscriptionId],
    queryFn: () => fetchSubscription(subscriptionId),
    enabled: !!subscriptionId,
    retry: false,
  });

  const status = subscription?.status;
  const needsReactivation = NEEDS_REACTIVATION.includes(status);

  // Solo carga el price de reactivación si hace falta
  const { data: reactPlans = [] } = useQuery({
    queryKey: ["reactivation-prices"],
    queryFn: fetchReactivationPrices,
    enabled: needsReactivation,
    retry: false,
  });

  const [selectedPlan, setSelectedPlan] = useState(null);

  // Helper para nombrar el ciclo
  const cycleLabel = (p) => {
    if (p.billing_interval === "year") return "Anual";
    if (p.billing_interval === "month" && p.billing_frequency === 3) return "Trimestral";
    if (p.billing_interval === "month") return "Mensual";
    return p.product_name;
  }

  const getStatus = (s) => STATUS_LABEL[s] || "Desconocido";
  const getInterval = (i) => INTERVAL_LABEL[i] || "Desconocido";

  const trialDaysLeft = () => {
    if (!subscription?.trial_ends_at) return 0;
    const diff = Math.abs(new Date(subscription.trial_ends_at) - new Date());
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const pluralDays = (n, interval) =>
    `${n} ${getInterval(interval)}${n > 1 && interval === "day" ? "s" : ""}`;

  if (isLoading) return <Loading message="Cargando suscripción..." />;

  const hasSub = subscription && subscription.subscription_id;

  return (
    <div>
      <div className={adminStyles.adminHeader}>
        <h1>Gestión de Suscripción</h1>
      </div>

      <div className={styles.card}>
        {!hasSub ? (
          <p className={styles.empty}>No tienes una suscripción activa.</p>
        ) : (
          <>
            <div className={styles.grid}>
              <div className={styles.item}>
                <span className={styles.label}>Estado</span>
                <span className={styles.value}>{getStatus(subscription.status)}</span>
              </div>

              {subscription.status === "trialing" && (
                <>
                  <div className={styles.item}>
                    <span className={styles.label}>Prueba iniciada</span>
                    <span className={styles.value}>{formatDate(subscription.trial_starts_at)}</span>
                  </div>
                  <div className={styles.item}>
                    <span className={styles.label}>Prueba finaliza</span>
                    <span className={styles.value}>{formatDate(subscription.trial_ends_at)}</span>
                  </div>
                  {subscription.trial_period && (
                    <div className={styles.item}>
                      <span className={styles.label}>Duración de prueba</span>
                      <span className={styles.value}>
                        {pluralDays(subscription.trial_period.frequency, subscription.trial_period.interval)}
                      </span>
                    </div>
                  )}
                  <div className={styles.item}>
                    <span className={styles.label}>Tiempo restante</span>
                    <span className={styles.value}>
                      {trialDaysLeft()} día{trialDaysLeft() !== 1 ? "s" : ""}
                    </span>
                  </div>
                </>
              )}

              <div className={styles.item}>
                <span className={styles.label}>Próxima factura</span>
                <span className={styles.value}>{formatDate(subscription.next_bill_date)}</span>
              </div>

              {subscription.billing_cycle && (
                <div className={styles.item}>
                  <span className={styles.label}>Ciclo de facturación</span>
                  <span className={styles.value}>
                    {pluralDays(subscription.billing_cycle.frequency, subscription.billing_cycle.interval)}
                  </span>
                </div>
              )}

              <div className={styles.item}>
                <span className={styles.label}>Monto</span>
                <span className={styles.value}>
                  {(subscription.currency || "").toUpperCase()} {formatted(subscription.price)}
                </span>
              </div>
            </div>

            {/* Suscripción vigente → administrar */}
            {!needsReactivation && subscription.update_url && (
              <a href={subscription.update_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.manageBtn}
              >
                Administrar suscripción
              </a>
            )}

            {/* Suscripción cancelada/pausada → reactivar SIN trial */}
            {needsReactivation && (
              <div className={styles.reactivateBox}>
                <p className={styles.reactivateText}>
                  Tu suscripción está {getStatus(subscription.status).toLowerCase()}.
                  Elige un plan y reactívala — el pago se procesa de inmediato, sin periodo de prueba.
                </p>

                {reactPlans.length === 0 ? (
                  <p className={styles.empty}>Cargando planes...</p>
                ) : (
                  <>
                    <div className={styles.planGrid}>
                      {reactPlans.map((p) => (
                        <label
                          key={p.price_id}
                          className={`${styles.planCard} ${selectedPlan === p.price_id ? styles.planCardActive : ""}`}
                        >
                          <input
                            type="radio"
                            name="reactPlan"
                            checked={selectedPlan === p.price_id}
                            onChange={() => setSelectedPlan(p.price_id)}
                          />
                          <span className={styles.planName}>{cycleLabel(p)}</span>
                          <span className={styles.planPrice}>
                            {(p.currency || "").toUpperCase()} {formatted(p.unit_price)}
                          </span>
                        </label>
                      ))}
                    </div>

                    {selectedPlan ? (
                      <PaddleCheckoutButton
                        mode="price"
                        priceId={selectedPlan}
                        quantity={1}
                        email={auth.email}
                        customerId={subscription.customer_id || customerId}
                        customData={{ appUserId: userId }}
                        locale="es"
                        successUrl={import.meta.env.VITE_APP_LOGIN_REDIRECT_URL}
                      />
                    ) : (
                      <p className={styles.planHint}>Selecciona un plan para continuar.</p>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Subscription;