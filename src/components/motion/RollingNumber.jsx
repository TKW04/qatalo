// Efecto 03 (precio rodando). Uso: <RollingNumber value={formattedPrice} />
// Al cambiar `value` (p. ej. toggle Mensual/Anual) la cifra anterior sale hacia arriba y la
// nueva entra desde abajo (transform/opacity, una vez por cambio). En el montaje no anima.
// reduced-motion → cambio directo.
import { useState } from "react";
import { prefersReducedMotion } from "./useInViewOnce";
import styles from "./RollingNumber.module.css";

const RollingNumber = ({ value, className = "" }) => {
  const [state, setState] = useState({ current: value, prev: null, k: 0 });

  // Estado derivado: registrar el cambio durante el render (patrón recomendado por React).
  if (value !== state.current) {
    setState({
      current: value,
      prev: prefersReducedMotion() ? null : state.current,
      k: state.k + 1,
    });
  }

  const clearPrev = () => setState((s) => (s.prev === null ? s : { ...s, prev: null }));

  return (
    <span className={`${styles.roll} ${className}`} data-motion="roll">
      <span key={`c${state.k}`} className={state.prev !== null ? styles.enter : undefined}>
        {state.current}
      </span>
      {state.prev !== null && (
        <span key={`p${state.k}`} className={styles.exit} aria-hidden="true" onAnimationEnd={clearPrev}>
          {state.prev}
        </span>
      )}
    </span>
  );
};

export default RollingNumber;
