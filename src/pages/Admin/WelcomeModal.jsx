import styles from "./WelcomeModal.module.css";

const WelcomeModal = ({ onClose }) => (
  <div className={styles.overlay}>
    <div className={styles.modal}>
      <div className={styles.iconWrap} aria-hidden="true">🎉</div>

      <h2 className={styles.title}>¡Bienvenido a Qatalo!</h2>
      <p className={styles.lead}>
        Estás a un paso de tener tu catálogo digital con QR listo para compartir.
      </p>

      <div className={styles.card}>
        <p className={styles.cardText}>
          Para empezar, completa los datos de tu negocio en esta sección.
          Una vez que lo crees, se habilitarán todas las demás opciones del panel:
          categorías, productos, métodos de pago, clientes y reportes.
        </p>
        <ul className={styles.list}>
          <li>🏪 Nombre y datos de tu negocio</li>
          <li>🎨 Logo, colores y tema de tu catálogo</li>
          <li>🔗 Tu enlace y QR únicos</li>
        </ul>
      </div>

      <p className={styles.hint}>
        ¿Tienes dudas? Escríbenos a{" "}
        <a href="mailto:info@qatalo.online" className={styles.link}>
          info@qatalo.online
        </a>
      </p>

      <button className={styles.btn} onClick={onClose}>
        Crear mi negocio ahora
      </button>
    </div>
  </div>
);

export default WelcomeModal;