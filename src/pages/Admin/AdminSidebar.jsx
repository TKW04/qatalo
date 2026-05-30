import { useEffect } from "react";
import { useSelector } from "react-redux";

import { IoIosCog } from "react-icons/io";
import { FiPackage } from "react-icons/fi";
import { IoQrCode } from "react-icons/io5";
import { LuCalendarSync, LuKeyRound, LuCirclePower } from "react-icons/lu";
import { FaFolderOpen, FaDollarSign, FaUsers } from "react-icons/fa";

import { logout } from "../../services/authenticate";
import { getTokenInfo } from "../../helpers/token";
import styles from "./AdminSidebar.module.css";

const AdminSidebar = ({ activeTab, onTabChange, isOpen, onClose }) => {
  const auth = getTokenInfo();
  const business = useSelector((state) => state.business.business);

  const menuItems = [
    { id: "business", label: "Configuración", icon: <IoIosCog size={22} className={styles.menuIcon} /> },
    { id: "categories", label: "Categorías", icon: <FaFolderOpen size={20} className={styles.menuIcon} /> },
    { id: "products", label: "Productos", icon: <FiPackage size={20} className={styles.menuIcon} /> },
    { id: "paymentMethods", label: "Métodos de Pago", icon: <FaDollarSign size={20} className={styles.menuIcon} /> },
    { id: "customers", label: "Clientes", icon: <FaUsers size={20} className={styles.menuIcon} /> },
    { id: "qr", label: "Código QR", icon: <IoQrCode size={20} className={styles.menuIcon} /> },
    { id: "subscription", label: "Suscripción", icon: <LuCalendarSync size={20} className={styles.menuIcon} /> },
    { id: "changepassword", label: "Cambiar Contraseña", icon: <LuKeyRound size={20} className={styles.menuIcon} /> },
  ];

  const handleItemClick = (itemId) => {
    onTabChange(itemId);
    if (window.innerWidth <= 992) {
      onClose();
    }
  };

  useEffect(() => {
    if (
      auth["custom:transaction_status"] !== "trialing" &&
      auth["custom:transaction_status"] !== "active"
    ) {
      if (activeTab !== "subscription") {
        onTabChange("subscription");
      }
    }
  }, [activeTab, auth, onTabChange]);

  const setEnabled = (itemId) => {
    if (
      auth["custom:transaction_status"] !== "trialing" &&
      auth["custom:transaction_status"] !== "active"
    ) {
      return itemId === "subscription";
    } else {
      if (itemId === "business") return true;
      if (business?.business_id === "") return false;
      return true;
    }
  };

  return (
    <aside className={`${styles.adminSidebar} ${isOpen ? styles.open : ""}`}>
      <div className={styles.logoContainer}>
        <img
          src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo.png"
          alt="Qatalo Logo"
          className={styles.logo}
          loading="lazy"
        />
      </div>

      <nav style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <ul className={styles.adminNav}>
          {menuItems.map((item) => (
            <li key={item.id} className={styles.menuItem}>
              <button
                onClick={() => handleItemClick(item.id)}
                className={`${styles.menuButton} ${activeTab === item.id ? styles.active : ""}`}
                disabled={!setEnabled(item.id)}
                aria-label={item.label}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.logoutContainer}>
          <button onClick={() => logout()} className={styles.logoutButton}>
            <LuCirclePower size={22} className={styles.menuIcon} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default AdminSidebar;