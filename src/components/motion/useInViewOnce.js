// Uso: const [ref, played] = useInViewOnce({ threshold: 0.4 });
// `played` pasa a true una sola vez cuando el elemento entra en pantalla.
// Con prefers-reduced-motion o sin IntersectionObserver devuelve true de inmediato
// (estado final, sin animación).
import { useEffect, useRef, useState } from "react";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canAnimate = () =>
  typeof window !== "undefined" && "IntersectionObserver" in window && !prefersReducedMotion();

export default function useInViewOnce({ threshold = 0.35, rootMargin = "0px 0px -10% 0px" } = {}) {
  const ref = useRef(null);
  const [played, setPlayed] = useState(() => !canAnimate());

  useEffect(() => {
    if (played) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPlayed(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [played, threshold, rootMargin]);

  return [ref, played];
}
