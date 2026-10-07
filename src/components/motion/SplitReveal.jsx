// Efecto 12 (split reveal, apoyo). Uso:
//   <SplitReveal as="h2" className={styles.title}>Un precio justo, sin sorpresas</SplitReveal>
// Recibe texto plano. Cada palabra sube y aparece una sola vez al entrar en pantalla;
// el texto completo queda en el DOM. reduced-motion → estado final.
import { Fragment } from "react";
import useInViewOnce from "./useInViewOnce";
import styles from "./SplitReveal.module.css";

const SplitReveal = ({ as = "h2", children, className = "", stagger = 45, ...rest }) => {
  const Tag = as;
  const [ref, play] = useInViewOnce({ threshold: 0.6 });
  const text = typeof children === "string" ? children : String(children ?? "");
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <Tag
      ref={ref}
      className={`${styles.split} ${className}`}
      data-motion="split"
      data-state={play ? "play" : "idle"}
      {...rest}
    >
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className={styles.word} style={{ "--i": i, "--stagger": `${stagger}ms` }}>
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
};

export default SplitReveal;
