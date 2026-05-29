// PrimaryButton.jsx
import styles from "./PrimaryButton.module.css";
import { Link } from "react-router-dom";

const PrimaryButton = ({ children, to, onClick, type = "button", isPulse = false }) => {
  const className = `${styles.button} ${styles.primary} ${isPulse ? styles.pulse : ""}`;

  if (to) {
    return <Link to={to} className={className}>{children}</Link>;
  }

  return (
    <button type={type} onClick={onClick} className={className}>
      {children}
    </button>
  );
};

export default PrimaryButton;