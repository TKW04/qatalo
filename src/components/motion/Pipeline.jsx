// Efecto 14 (pipeline de pasos). Uso:
//   <Pipeline steps={[{ title: "Crea tu cuenta", text: "…" }, …]} />
// Lista ordenada real (<ol>). Al entrar en pantalla, una sola vez, cada paso se enciende
// y una línea SVG (stroke-dashoffset) lo conecta con el siguiente. Horizontal en
// escritorio, vertical en móvil. reduced-motion → todo encendido y conectado.
import useInViewOnce from "./useInViewOnce";
import styles from "./Pipeline.module.css";

const Pipeline = ({ steps = [], headingLevel = "h3", className = "" }) => {
  const Heading = headingLevel;
  const [ref, play] = useInViewOnce({ threshold: 0.3 });

  return (
    <ol
      ref={ref}
      className={`${styles.pipeline} ${className}`}
      data-motion="pipeline"
      data-state={play ? "play" : "idle"}
      style={{ "--steps": steps.length }}
    >
      {steps.map((s, i) => (
        <li key={s.title} className={styles.step} style={{ "--i": i }}>
          <span className={styles.node} aria-hidden="true">
            <span className={styles.nodeBase}>{i + 1}</span>
            <span className={styles.nodeLit}>{i + 1}</span>
          </span>

          {i < steps.length - 1 && (
            <span className={styles.connector} aria-hidden="true">
              <svg className={styles.lineH} viewBox="0 0 100 4" preserveAspectRatio="none">
                <line className={styles.track} x1="0" y1="2" x2="100" y2="2" />
                <line className={styles.fill} x1="0" y1="2" x2="100" y2="2" pathLength="1" />
              </svg>
              <svg className={styles.lineV} viewBox="0 0 4 100" preserveAspectRatio="none">
                <line className={styles.track} x1="2" y1="0" x2="2" y2="100" />
                <line className={styles.fill} x1="2" y1="0" x2="2" y2="100" pathLength="1" />
              </svg>
            </span>
          )}

          <div className={styles.body}>
            <Heading className={styles.title}>{s.title}</Heading>
            <p className={styles.text}>{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
};

export default Pipeline;
