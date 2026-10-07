import { useEffect, useRef } from "react";
import { PartyPopper, Store, Palette, Link2 } from "lucide-react";
import styles from "./WelcomeModal.module.css";

const STEPS = [
  { icon: Store, text: "Nombre y datos de tu negocio" },
  { icon: Palette, text: "Logo, colores y tema de tu catálogo" },
  { icon: Link2, text: "Tu enlace y QR únicos" },
];

const WelcomeModal = ({ onClose }) => {
  const ctaRef = useRef(null);

  // Foco en la acción principal; Esc también cierra (solo descarta el aviso)
  useEffect(() => {
    ctaRef.current?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        aria-describedby="welcome-lead"
      >
        <span className={styles.iconWrap} aria-hidden="true">
          <PartyPopper size={28} />
        </span>

        <h2 id="welcome-title" className={styles.title}>¡Bienvenido a Qatalo!</h2>
        <p id="welcome-lead" className={styles.lead}>
          Estás a un paso de tener tu catálogo digital con QR listo para compartir.
        </p>

        <div className={styles.card}>
          <p className={styles.cardText}>
            Para empezar, completa los datos de tu negocio en esta sección.
            Una vez que lo crees, se habilitarán todas las demás opciones del panel:
            categorías, productos, métodos de pago, clientes y reportes.
          </p>
          <ul className={styles.list}>
            {STEPS.map(({ icon, text }) => {
              const Icon = icon;
              return (
                <li key={text}>
                  <Icon size={18} aria-hidden="true" className={styles.listIcon} />
                  {text}
                </li>
              );
            })}
          </ul>
        </div>

        <p className={styles.hint}>
          ¿Tienes dudas? Escríbenos a{" "}
          <a href="mailto:info@qatalo.online" className={styles.link}>
            info@qatalo.online
          </a>
        </p>

        <button ref={ctaRef} type="button" className={styles.btn} onClick={onClose}>
          Crear mi negocio ahora
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;
