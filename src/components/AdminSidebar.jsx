import { Link } from "react-router-dom";
import {
  Cog,
  Folder,
  Package,
  QrCode,
  House,
  DollarSign,
  Users,
  CirclePower,
} from "lucide-react";
import { Image } from "primereact/image";
import { logout } from "../services/authenticate";

const AdminSidebar = ({ activeTab, onTabChange, isOpen, onClose, isDemo }) => {
  const menuItems = [
    { id: "business", label: "Configuración", icon: <Cog /> },
    { id: "categories", label: "Categorías", icon: <Folder /> },
    { id: "products", label: "Productos", icon: <Package /> },
    { id: "paymentMethods", label: "Métodos de Pago", icon: <DollarSign /> },
    { id: "customers", label: "Clientes", icon: <Users /> },
    { id: "qr", label: "Código QR", icon: <QrCode /> },
  ];

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
        <ul className="admin-nav" style={{ width: "100%", marginLeft: "0px" }}>
          {menuItems.map((item) => (
            <li key={item.id}>
              <Link
                onClick={() => handleItemClick(item.id)}
                style={{ color: "white", textDecoration: "none" }}
                className={activeTab === item.id ? "active " : ""}
              >
                <span style={{ margin: "5px" }}>{item.icon}</span> {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              onClick={() => logout()}
              style={{ color: "white", textDecoration: "none" }}
            >
              <span style={{ margin: "5px" }}>
                <CirclePower />
              </span>{" "}
              Cerrar sesión
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
