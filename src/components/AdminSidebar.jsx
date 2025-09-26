import { Link } from "react-router-dom";
import {
  Cog,
  Folder,
  Package,
  QrCode,
  DollarSign,
  Users,
  CirclePower,
  CalendarSync,
  KeyRound,
} from "lucide-react";
import { Image } from "primereact/image";
import { logout } from "../services/authenticate";
import { useSelector } from "react-redux";
import { Button } from "primereact/button";
import { getTokenInfo } from "../helpers/token";
import { act, useEffect } from "react";

const AdminSidebar = ({ activeTab, onTabChange, isOpen, onClose }) => {
  const auth = getTokenInfo();
  const menuItems = [
    { id: "business", label: "Configuración", icon: <Cog /> },
    { id: "categories", label: "Categorías", icon: <Folder /> },
    { id: "products", label: "Productos", icon: <Package /> },
    { id: "paymentMethods", label: "Métodos de Pago", icon: <DollarSign /> },
    { id: "customers", label: "Clientes", icon: <Users /> },
    { id: "qr", label: "Código QR", icon: <QrCode /> },
    { id: "subscription", label: "Suscripción", icon: <CalendarSync /> },
    { id: "changepassword", label: "Cambiar Contraseña", icon: <KeyRound /> },
  ];
  const business = useSelector((state) => state.business.business);

  const handleItemClick = (itemId) => {
    onTabChange(itemId);
    if (window.innerWidth <= 768) {
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
  }, [auth]);

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
            className={activeTab === item.id ? "active " : ""}
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
            style={{
              color: "white",
              textDecoration: "none",
              width: "250px",
            }}
            className={activeTab === item.id ? "active " : ""}
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
      className={`admin-sidebar ${isOpen ? "open" : ""}`}
      style={{ width: "250px" }}
    >
      <h2 style={{ marginRight: isOpen ? "20px" : "" }}>
        <Image
          src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo.png"
          alt="CatalogQR Logo"
          width={isOpen ? 150 : 110}
          style={{ marginLeft: isOpen ? "20px" : "40px" }}
        />
      </h2>
      <nav style={{ padding: "0px" }}>
        <ul
          className="admin-nav"
          style={{ width: "100%", marginLeft: "0px", textAlign: "left" }}
        >
          {menuItems.map((item) => (
            itemTemplate(item)
          ))}

          <li>
            <Button
              onClick={() => logout()}
              style={{ color: "white", textDecoration: "none" }}
            >
              <span style={{ margin: "5px" }}>
                <CirclePower />
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
