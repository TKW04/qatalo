import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { getTokenInfo } from "../../helpers/token";
import { GetSubscription } from "../../store/payment-store/plan-actions";
import { useNotification } from "../UI/NotificationProvider";
import "../../styles/catalog.css";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { formatDate, formatted } from "../../helpers/utils";
import { Link } from "react-router-dom";

let once = true;
const Subscription = () => {
  const dispatch = useDispatch();
  const auth = getTokenInfo();
  const subscription = useSelector((state) => state.plan.subscription);
  const { showError } = useNotification();
  const isMobile = window.innerWidth <= 480;
  console.log(subscription);

  useEffect(() => {
    if (
      auth &&
      auth["custom:transaction_id"] &&
      once &&
      (subscription.subscription_id === undefined ||
        subscription.subscription_id === "")
    ) {
      dispatch(GetSubscription(auth["custom:transaction_id"], showError));
      once = false;
    }
  }, [auth, dispatch, showError, subscription.subscription_id]);

  const getStatus = (status) => {
    switch (status) {
      case "trialing":
        return "En prueba";
      case "canceled":
        return "Cancelado";
      case "expired":
        return "Expirado";
      case "paused":
        return "En pausa";
      case "pending":
        return "Pendiente";
      case "active":
        return "Activo";
      default:
        return "Desconocido";
    }
  };

  const getInterval = (interval) => {
    switch (interval) {
      case "month":
        return "Mes";
      case "year":
        return "Año";
      case "week":
        return "Semana";
      case "day":
        return "Día";
      default:
        return "Desconocido";
    }
  };
  const getCurrentTrialDays = () => {
    const start = new Date();
    const end = new Date(subscription.trial_ends_at);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div>
      <div className="admin-header">
        <h1>Gestión de Suscripción</h1>
      </div>
      <div className="card">
        <Card style={{ width: "100%", padding: "20px" }}>
          <>
            {subscription.subscription_id === undefined ||
            subscription.subscription_id === "" ? (
              <div style={{ marginBottom: "20px" }}>
                <span>No tienes una suscripción activa.</span>
              </div>
            ) : (
              <div className="grid">
                <div className={`${isMobile ? "col-12" : "col-4"}`}>
                  <span style={{ fontWeight: "bold" }}>Estado: </span>
                  <span style={{ color: "var(--color-navy)" }}>
                    {getStatus(subscription.status)}
                  </span>
                </div>
                {subscription.status === "trialing" && (
                  <>
                    <div className={`${isMobile ? "col-12" : "col-4"}`}>
                      <span style={{ fontWeight: "bold" }}>
                        Pruebas iniciadas en:{" "}
                      </span>
                      <span>{formatDate(subscription.trial_starts_at)}</span>
                    </div>
                    <div className={`${isMobile ? "col-12" : "col-4"}`}>
                      <span style={{ fontWeight: "bold" }}>
                        Pruebas finalizan en:{" "}
                      </span>
                      <span>{formatDate(subscription.trial_ends_at)}</span>
                    </div>
                    <div className={`${isMobile ? "col-12" : "col-4"}`}>
                      <span style={{ fontWeight: "bold" }}>
                        La prueba durará :{" "}
                      </span>
                      <span>
                        {subscription.trial_period.frequency}{" "}
                        {getInterval(subscription.trial_period.interval)}
                        {subscription.trial_period.frequency > 1 &&
                        subscription.trial_period.interval === "day"
                          ? "s"
                          : ""}
                      </span>
                    </div>
                    <div className={`${isMobile ? "col-12" : "col-4"}`}>
                      <span style={{ fontWeight: "bold" }}>
                        Tiempo restante :{" "}
                      </span>
                      <span>
                        {getCurrentTrialDays()}{" "}
                        {getInterval(subscription.trial_period.interval)}
                        {getCurrentTrialDays() > 1 ? "s" : ""}
                      </span>
                    </div>
                  </>
                )}
                <div className={`${isMobile ? "col-12" : "col-4"}`}>
                  <span style={{ fontWeight: "bold" }}>Próxima factura: </span>
                  <span>{formatDate(subscription.next_bill_date)}</span>
                </div>
                <div className={`${isMobile ? "col-12" : "col-4"}`}>
                  <span style={{ fontWeight: "bold" }}>
                    Ciclo de facturación:{" "}
                  </span>
                  <span>
                    {subscription.billing_cycle.frequency}{" "}
                    {getInterval(subscription.billing_cycle.interval)}
                    {subscription.billing_cycle.frequency > 1 &&
                    subscription.billing_cycle.interval === "day"
                      ? "s"
                      : ""}
                  </span>
                </div>
                <div className={`${isMobile ? "col-12" : "col-4"}`}>
                  <span style={{ fontWeight: "bold" }}>Monto: </span>
                  <span>
                    {subscription.currency.toUpperCase()}{" "}
                    {formatted(subscription.price)}
                  </span>
                </div>
                <div className={`${isMobile ? "col-12" : "col-4"}`}>
                  <Link
                    to={subscription.update_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                  >
                    Ver Catálogo Público
                  </Link>
                </div>
              </div>
            )}
          </>
        </Card>
      </div>
    </div>
  );
};
export default Subscription;
