import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Settings, FolderOpen, Package, Wallet, Users, ClipboardList, Tag, ChartColumn,
  QrCode, CalendarSync, KeyRound, Power, ShieldCheck, X,
} from "lucide-react";

import { logout } from "../../services/authenticate";
import { getTokenInfo } from "../../helpers/token";
import { fetchBusinessData } from "../../services/businessApi";
import { fetchSubscriptionStatus } from "../../services/subscriptionApi";
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

  // Estado de suscripción FRESCO desde el backend (no del token cacheado).
  // Así, si se canceló/venció, al refrescar la página se bloquea de inmediato.
  const { data: sub } = useQuery({
    queryKey: ["subscription-status", tenantId],
    queryFn: fetchSubscriptionStatus,
    enabled: !!tenantId,
    retry: false,
    refetchOnWindowFocus: true,   // revalida al volver a la pestaña
    staleTime: 60 * 1000,
  });

  // Preferimos el estado fresco del backend; si aún no cargó, caemos al del token.
  const tokenStatus = auth?.["custom:transaction_status"];
  const status = sub?.transaction_status ?? tokenStatus;
  const subscribed = sub?.active ?? (status === "trialing" || status === "active");
  const hasBusiness = !!business?.business_id;

  const groups = getTokenInfo()?.["cognito:groups"] || [];
  const isRoot = groups.includes("root");

  const menuItems = [
    { id: "business", label: "Configuración", icon: Settings },
    { id: "categories", label: "Categorías", icon: FolderOpen },
    { id: "products", label: "Productos", icon: Package },
    { id: "paymentMethods", label: "Métodos de pago", icon: Wallet },
    { id: "customers", label: "Clientes", icon: Users },
    { id: "orders", label: "Órdenes", icon: ClipboardList },
    { id: "offers", label: "Ofertas", icon: Tag },
    { id: "reports", label: "Reportes", icon: ChartColumn },
    { id: "qr", label: "Código QR", icon: QrCode },
    { id: "subscription", label: "Suscripción", icon: CalendarSync },
    { id: "changepassword", label: "Cambiar contraseña", icon: KeyRound },
  ];

  const handleItemClick = (itemId) => {
    onTabChange(itemId);
    if (window.innerWidth <= 992) onClose();
  };

  // Al abrir el menú móvil, el foco entra al panel (botón cerrar)
  const closeRef = useRef(null);
  useEffect(() => {
    if (isOpen && window.innerWidth <= 992) closeRef.current?.focus();
  }, [isOpen]);

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
    <aside
      id="admin-sidebar"
      className={`${styles.adminSidebar} ${isOpen ? styles.open : ""}`}
      aria-label="Menú del panel"
    >
      <div className={styles.logoContainer}>
        <img
          src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo.png"
          alt="Qatalo"
          className={styles.logo}
          loading="lazy"
        />
        <button
          ref={closeRef}
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </div>

      <nav className={styles.nav} aria-label="Secciones">
        <ul className={styles.adminNav}>
          {menuItems.map(({ id, label, icon }) => {
            const Icon = icon;
            const isActive = activeTab === id;
            return (
              <li key={id} className={styles.menuItem}>
                <button
                  type="button"
                  onClick={() => handleItemClick(id)}
                  className={`${styles.menuButton} ${isActive ? styles.active : ""}`}
                  disabled={!setEnabled(id)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={20} className={styles.menuIcon} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {isRoot && (
          <ul className={styles.adminNav}>
            <li className={styles.menuItem}>
              <NavLink to="/root" className={styles.menuButton}>
                <ShieldCheck size={20} className={styles.menuIcon} aria-hidden="true" />
                <span>Panel Root</span>
              </NavLink>
            </li>
          </ul>
        )}

        <div className={styles.logoutContainer}>
          <button type="button" onClick={() => logout()} className={styles.logoutButton}>
            <Power size={20} className={styles.menuIcon} aria-hidden="true" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
