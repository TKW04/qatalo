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
} from "lucide-react";
import { Image } from "primereact/image";
import { logout } from "../services/authenticate";
import { useSelector } from "react-redux";
import { Button } from "primereact/button";

const AdminSidebar = ({ activeTab, onTabChange, isOpen, onClose }) => {
  const menuItems = [
    { id: "business", label: "Configuración", icon: <Cog /> },
    { id: "categories", label: "Categorías", icon: <Folder /> },
    { id: "products", label: "Productos", icon: <Package /> },
    { id: "paymentMethods", label: "Métodos de Pago", icon: <DollarSign /> },
    { id: "customers", label: "Clientes", icon: <Users /> },
    { id: "qr", label: "Código QR", icon: <QrCode /> },
    { id: "subscription", label: "Suscripción", icon: <CalendarSync /> },
  ];
  const business = useSelector((state) => state.business.business);

  const handleItemClick = (itemId) => {
    onTabChange(itemId);
    if (window.innerWidth <= 768) {
      onClose();
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
        <ul className="admin-nav" style={{ width: "100%", marginLeft: "0px", textAlign: "left" }}>
          {menuItems.map((item) => (
            <li key={item.id} >
              <Button
              
                onClick={() => handleItemClick(item.id)}
                style={{
                  color: "white",
                  textDecoration: "none",
                  width: "250px",
            
                }}
                className={activeTab === item.id ? "active " : ""}
                disabled={item.id !== "business" && business.business_id === ""}
              >
                <span style={{ margin: "5px" }}>{item.icon}</span> {item.label}
              </Button>
            </li>
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
