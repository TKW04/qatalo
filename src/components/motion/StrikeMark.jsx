// Efecto 11 (tachado → resaltado). Uso:
//   const [ref, play] = useInViewOnce();
//   <h1 ref={ref}>Deja de vender por <StrikeText play={play}>fotos sueltas</StrikeText> …</h1>
//   <p>… con <MarkText play={play} delay={520}>un solo enlace</MarkText>.</p>
// El texto nunca cambia (queda completo en el DOM); solo se dibuja una línea / un fondo
// con transform. Estado final estático; reduced-motion → estado final.
import styles from "./StrikeMark.module.css";

export const StrikeText = ({ children, play, delay = 0 }) => (
  <span
    className={styles.strike}
    data-motion="strike"
    data-state={play ? "play" : "idle"}
    style={{ "--motion-delay": `${delay}ms` }}
  >
    {children}
  </span>
);

export const MarkText = ({ children, play, delay = 0 }) => (
  <span
    className={styles.mark}
    data-motion="mark"
    data-state={play ? "play" : "idle"}
    style={{ "--motion-delay": `${delay}ms` }}
  >
    {children}
  </span>
);
