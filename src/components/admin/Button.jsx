import { Loader2 } from "lucide-react";
import styles from "./admin.module.css";

/**
 * Botón del admin. variant: primary | secondary | danger | ghost; size: md | sm.
 * loading: muestra spinner, deshabilita y anuncia aria-busy (sin overlay de pantalla completa).
 */
const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  block = false,
  icon: Icon,
  type = "button",
  disabled,
  className = "",
  children,
  ...rest
}) => {
  const cls = [
    styles.button,
    styles[variant],
    size === "sm" ? styles.sm : "",
    block ? styles.block : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Loader2 size={18} className={styles.spinner} aria-hidden="true" />
      ) : (
        Icon && <Icon size={18} aria-hidden="true" />
      )}
      {children}
    </button>
  );
};

export default Button;
