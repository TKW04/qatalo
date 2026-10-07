import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (cb) => {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};
const getSnapshot = () =>
  typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(QUERY).matches;

/** true si el usuario pidió movimiento reducido. */
export const usePrefersReducedMotion = () => useSyncExternalStore(subscribe, getSnapshot, () => false);

/**
 * Props de animación para recharts (Bar, Pie, Line, Area):
 * 350ms ease-out; desactivada con movimiento reducido.
 *   const anim = useChartAnimation();  <Bar {...anim} />
 */
export const useChartAnimation = () => {
  const reduced = usePrefersReducedMotion();
  return reduced
    ? { isAnimationActive: false }
    : { isAnimationActive: true, animationDuration: 350, animationEasing: "ease-out" };
};

/**
 * Interpola un número hacia `value` en <= 250ms solo cuando cambia
 * después del montaje (p. ej. al cambiar un filtro). Al montar muestra
 * el valor final. Sin animación con movimiento reducido.
 */
export const useAnimatedNumber = (value, duration = 240) => {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;
    fromRef.current = to;
    if (reduced || from === to || !Number.isFinite(from)) {
      setDisplay(to);
      return undefined;
    }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration, reduced]);

  return display;
};
