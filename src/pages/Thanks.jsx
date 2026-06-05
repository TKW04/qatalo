import { Link } from "react-router-dom";
import styles from "./Thanks.module.css";

const Thanks = () => {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <svg className={styles.check} viewBox="0 0 52 52" aria-hidden="true">
            <circle className={styles.circle} cx="26" cy="26" r="24" fill="none" />
            <path className={styles.tick} fill="none" d="M14 27l8 8 16-16" />
          </svg>
        </div>

        <h1 className={styles.title}>¡Gracias por tu compra!</h1>
        <p className={styles.message}>
          Tu pago se procesó correctamente. Estamos activando tu suscripción;
          esto puede tardar unos instantes en reflejarse en tu cuenta.
        </p>

        <Link to="/admin" className={styles.button}>
          Ir a mi panel
        </Link>

        <p className={styles.note}>
          Si en unos minutos no ves tu suscripción activa, cierra sesión y vuelve
          a entrar, o contáctanos.
        </p>
      </div>
    </div>
  );
};

export default Thanks;