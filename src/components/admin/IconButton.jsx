import styles from "./admin.module.css";

/**
 * Botón solo icono, área táctil de 44px. `label` es obligatorio (aria-label + title).
 * variant: default | outline | danger
 */
const IconButton = ({ icon, label, variant = "default", size = 18, type = "button", className = "", ...rest }) => {
  const Icon = icon;
  const cls = [
    styles.iconButton,
    variant === "outline" ? styles.iconOutline : "",
    variant === "danger" ? styles.iconDanger : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button type={type} className={cls} aria-label={label} title={label} {...rest}>
      <Icon size={size} aria-hidden="true" />
    </button>
  );
};

export default IconButton;
