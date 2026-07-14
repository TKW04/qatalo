import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { IoIosCog } from "react-icons/io";
import { FiPackage } from "react-icons/fi";
import { IoQrCode } from "react-icons/io5";
import { LuCalendarSync, LuKeyRound, LuCirclePower } from "react-icons/lu";
import { FaFolderOpen, FaDollarSign, FaUsers, FaChartBar, FaTag, FaClipboardList } from "react-icons/fa";
import { FaUserSecret } from "react-icons/fa6";


import { logout } from "../../services/authenticate";
import { getTokenInfo } from "../../helpers/token";
import { fetchBusinessData } from "../../services/businessApi";
import styles from "./AdminSidebar.module.css";
import { NavLink } from "react-router-dom";

const AdminSidebar = ({ activeTab, onTabChange, isOpen, onClose }) => {
  const auth = getTokenInfo();
  const tenantId = auth?.sub;

  // Misma query que Business.jsx -> caché compartido, se refresca al guardar
  const { data: business } = useQuery({
    queryKey: ["business", tenantId],
    queryFn: fetchBusinessData,
    enabled: !!tenantId,
    retry: false, // si el negocio aún no existe, fetchBusinessData lanza 404; no reintentamos
  });

  const status = auth?.["custom:transaction_status"];
  const subscribed = status === "trialing" || status === "active";
  const hasBusiness = !!business?.business_id;

  const groups = getTokenInfo()?.["cognito:groups"] || [];
  const isRoot = groups.includes("root");

  const menuItems = [
    { id: "business", label: "Configuración", icon: <IoIosCog size={22} className={styles.menuIcon} /> },
    { id: "categories", label: "Categorías", icon: <FaFolderOpen size={20} className={styles.menuIcon} /> },
    { id: "products", label: "Productos", icon: <FiPackage size={20} className={styles.menuIcon} /> },
    { id: "paymentMethods", label: "Métodos de Pago", icon: <FaDollarSign size={20} className={styles.menuIcon} /> },
    { id: "customers", label: "Clientes", icon: <FaUsers size={20} className={styles.menuIcon} /> },
    { id: "orders", label: "Órdenes", icon: <FaClipboardList size={20} className={styles.menuIcon} /> },  // ← nuevo
    { id: "offers", label: "Ofertas", icon: <FaTag size={20} className={styles.menuIcon} /> },
    { id: "reports", label: "Reportes", icon: <FaChartBar size={20} className={styles.menuIcon} /> },
    { id: "qr", label: "Código QR", icon: <IoQrCode size={20} className={styles.menuIcon} /> },
    { id: "subscription", label: "Suscripción", icon: <LuCalendarSync size={20} className={styles.menuIcon} /> },
    { id: "changepassword", label: "Cambiar Contraseña", icon: <LuKeyRound size={20} className={styles.menuIcon} /> },
  ];

  const handleItemClick = (itemId) => {
    onTabChange(itemId);
    if (window.innerWidth <= 992) onClose();
  };

  useEffect(() => {
    if (!subscribed && activeTab !== "subscription") {
      onTabChange("subscription");
    }
  }, [activeTab, subscribed, onTabChange]);

  const setEnabled = (itemId) => {

    // Sin suscripción activa: solo Suscripción
    if (!subscribed) return itemId === "subscription";

    // Estas siempre disponibles
    if (itemId === "business" || itemId === "subscription" || itemId === "changepassword") {
      return true;
    }

    // El resto requiere un negocio ya creado
    return hasBusiness;
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

        {isRoot && (
          <ul className={styles.adminNav}>
            <li className={styles.menuItem}>
              <NavLink to="/root"
                className={styles.menuButton}
              ><FaUserSecret size={22} className={styles.menuIcon} />
                <span>Panel Root</span></NavLink>

            </li>
          </ul>
        )}

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