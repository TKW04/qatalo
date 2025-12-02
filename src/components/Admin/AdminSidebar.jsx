import { useEffect } from "react";
import { useSelector } from "react-redux";

import { IoIosCog } from "react-icons/io";
import { FiPackage } from "react-icons/fi";
import { IoQrCode } from "react-icons/io5";
import { LuCalendarSync, LuKeyRound, LuCirclePower } from "react-icons/lu";
import { FaFolderOpen, FaDollarSign, FaUsers } from "react-icons/fa";

import { Image } from "primereact/image";
import { Button } from "primereact/button";

import { logout } from "../../services/authenticate";
import { getTokenInfo } from "../../helpers/token";
import styles from "./AdminSidebar.module.css";

const AdminSidebar = ({ activeTab, onTabChange, isOpen, onClose }) => {
  const auth = getTokenInfo();
  const business = useSelector((state) => state.business.business);
  const menuItems = [
    {
      id: "business",
      label: "Configuración",
      icon: <IoIosCog size={20} className={styles.menuIcon} />,
    },
    {
      id: "categories",
      label: "Categorías",
      icon: <FaFolderOpen size={20} className={styles.menuIcon} />,
    },
    {
      id: "products",
      label: "Productos",
      icon: <FiPackage size={20} className={styles.menuIcon} />,
    },
    {
      id: "paymentMethods",
      label: "Métodos de Pago",
      icon: <FaDollarSign size={20} className={styles.menuIcon} />,
    },
    {
      id: "customers",
      label: "Clientes",
      icon: <FaUsers size={20} className={styles.menuIcon} />,
    },
    {
      id: "qr",
      label: "Código QR",
      icon: <IoQrCode size={20} className={styles.menuIcon} />,
    },
    {
      id: "subscription",
      label: "Suscripción",
      icon: <LuCalendarSync size={20} className={styles.menuIcon} />,
    },
    {
      id: "changepassword",
      label: "Cambiar Contraseña",
      icon: <LuKeyRound size={20} className={styles.menuIcon} />,
    },
  ];

  const handleItemClick = (itemId) => {
    onTabChange(itemId);
    if (window.innerWidth <= 480) {
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
      if (itemId === "subscription") {
        return true;
      }
      return false;
    } else {
      if (itemId === "business") {
        return true;
      }
      if (business.business_id === "") {
        return false;
      }
      return true;
    }
  };

  const itemTemplate = (item) => {
    if (item.id !== "changepassword") {
      return (
        <li key={item.id}>
          <Button
            onClick={() => handleItemClick(item.id)}
            style={{
              color: "white",
              textDecoration: "none",
              width: "250px",
            }}
            className={activeTab === item.id ? styles.active : ""}
            disabled={!setEnabled(item.id)}
          >
            <span style={{ margin: "5px" }}>{item.icon}</span> {item.label}
          </Button>
        </li>
      );
    } else {
      return (
        <li key={item.id}>
          <Button
            onClick={() => handleItemClick(item.id)}
            className={activeTab === item.id ? styles.active : ""}
            disabled={!setEnabled(item.id)}
          >
            <span style={{ margin: "5px" }}>{item.icon}</span>
            <span style={{ fontSize: "17px" }}>{item.label}</span>
          </Button>
        </li>
      );
    }
  };
  

  return (
    <aside
      className={`${styles.adminSidebar} ${isOpen ? styles.open : ""}`}
    >
      <h2 style={{ marginRight: isOpen ? "20px" : "" }}>
        <Image
          src={"https://qatalo.s3.us-east-1.amazonaws.com/qatalo.png"}
          alt="CatalogQR Logo"
          width={isOpen ? 150 : 110}
          style={{ marginLeft: isOpen ? "20px" : "40px" }}
        />
      </h2>
      <nav style={{ padding: "0px" }}>
        <ul
          className={styles.adminNav}
          style={{ width: "100%", marginLeft: "0px", textAlign: "left" }}
        >
          {menuItems.map((item) => itemTemplate(item))}

          <li>
            <Button onClick={() => logout()}>
              <span style={{ margin: "5px" }}>
                <LuCirclePower size={20} style={{ marginTop: "4px" }} />
              </span>{" "}
              Cerrar sesión
            </Button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
