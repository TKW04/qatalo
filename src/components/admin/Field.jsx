import { cloneElement, isValidElement, useId } from "react";
import styles from "./admin.module.css";

/**
 * Campo con <label htmlFor>. Inyecta id en el control hijo si no lo trae.
 *   <Field label="Nombre" hint="..." error={err}><input className="input" /></Field>
 */
const Field = ({ label, hint, error, required, children, className = "" }) => {
  const autoId = useId();
  const child = isValidElement(children) ? children : null;
  const id = child?.props.id || autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`${styles.field} ${className}`}>
      <label htmlFor={id} className={styles.fieldLabel}>
        {label}
        {required && <span className="required" aria-hidden="true">*</span>}
      </label>
      {child
        ? cloneElement(child, {
            id,
            "aria-describedby": describedBy,
            "aria-invalid": error ? true : undefined,
          })
        : children}
      {hint && <span id={hintId} className={styles.fieldHint}>{hint}</span>}
      {error && <span id={errorId} className={styles.fieldError}>{error}</span>}
    </div>
  );
};

export default Field;
