import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import IconButton from "./IconButton";
import styles from "./admin.module.css";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal accesible del admin: role=dialog, aria-modal, título enlazado,
 * Esc y clic fuera cierran, foco atrapado y devuelto, scroll del body bloqueado.
 * En móvil (<=600px) se presenta como hoja inferior.
 *   <Modal open={open} onClose={close} title="Nueva categoría" footer={<Button>Guardar</Button>}>...</Modal>
 * size: sm | md | lg | xl. dismissible=false para bloquear el cierre mientras se guarda.
 */
const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
  initialFocusRef,
}) => {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);

  useEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
  });

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const node = dialogRef.current;
    // Foco al diálogo (no al primer input, para no abrir el teclado en móvil)
    const first = initialFocusRef?.current || node;
    first?.focus({ preventScroll: true });

    const onKeyDown = (e) => {
      if (e.key === "Escape" && dismissibleRef.current) {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  const sizeCls = { sm: styles.modalSm, md: styles.modalMd, lg: styles.modalLg, xl: styles.modalXl }[size] || styles.modalMd;

  return createPortal(
    <div
      className={styles.modalOverlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && dismissible) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`${styles.modal} ${sizeCls}`}
      >
        <div className={styles.modalHeader}>
          <div>
            {title && <h2 id={titleId} className={styles.modalTitle}>{title}</h2>}
            {description && <p id={descId} className={styles.modalDescription}>{description}</p>}
          </div>
          {dismissible && <IconButton icon={X} label="Cerrar" onClick={onClose} />}
        </div>
        <div className={styles.modalBody}>{children}</div>
        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
