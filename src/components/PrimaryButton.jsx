import styles from "./PrimaryButton.module.css";
import { Link } from "react-router-dom";

const PrimaryButton = ({ 
  children, 
  to, 
  onClick, 
  type = "button", 
  isPulse = false, 
  variant = "primary",
  disabled = false // <-- Añadimos esta prop
}) => {
  // Si está deshabilitado, forzamos la variante "disabled" (que crearemos en el CSS)
  const currentVariant = disabled ? "disabled" : variant;
  const className = `${styles.button} ${styles[currentVariant] || ""} ${isPulse ? styles.pulse : ""}`;

  if (to && !disabled) {
    return (
      <Link to={to} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={className} disabled={disabled}>
      {children}
    </button>
  );
};

export default PrimaryButton;