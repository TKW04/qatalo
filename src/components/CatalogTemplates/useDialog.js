import { useEffect, useRef } from "react";

// Comportamiento accesible común para overlays del catálogo (modal, drawer):
// - Esc cierra SOLO el diálogo superior (pila: sub-modales cierran primero).
// - Al abrir enfoca [data-autofocus] o el primer enfocable (o el contenedor); al cerrar
//   devuelve el foco al elemento que lo abrió.
// - Tab / Shift+Tab quedan atrapados dentro del diálogo superior.
// - Bloquea el scroll del body mientras haya algún diálogo abierto.
// Uso: const ref = useDialog(onClose, isOpen); <div ref={ref} role="dialog" aria-modal="true" tabIndex={-1}>

const stack = [];
let lockCount = 0;
let prevOverflow = "";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const focusables = (el) =>
  Array.from(el.querySelectorAll(FOCUSABLE)).filter((n) => n.offsetParent !== null || n === document.activeElement);

const lockScroll = () => {
  if (lockCount === 0) {
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
};

const unlockScroll = () => {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) document.body.style.overflow = prevOverflow;
};

export default function useDialog(onClose, active = true) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!active) return undefined;
    const node = ref.current;
    const opener = document.activeElement;
    const entry = { ref };
    stack.push(entry);
    lockScroll();

    // Enfoque inicial (sin desplazar la página)
    if (node) {
      const first = node.querySelector("[data-autofocus]") || focusables(node)[0];
      (first || node).focus({ preventScroll: true });
    }

    const onKey = (e) => {
      if (stack[stack.length - 1] !== entry) return;
      const el = ref.current;
      if (!el) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key === "Tab") {
        const items = focusables(el);
        if (items.length === 0) { e.preventDefault(); el.focus(); return; }
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === firstEl || !el.contains(document.activeElement))) {
          e.preventDefault(); lastEl.focus();
        } else if (!e.shiftKey && (document.activeElement === lastEl || !el.contains(document.activeElement))) {
          e.preventDefault(); firstEl.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      const i = stack.indexOf(entry);
      if (i !== -1) stack.splice(i, 1);
      unlockScroll();
      if (opener && typeof opener.focus === "function" && document.contains(opener)) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [active]);

  return ref;
}
