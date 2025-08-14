import { Link } from "react-router-dom";
import { Library, Cog, Folder, Package, QrCode, House } from "lucide-react";

const AdminSidebar = ({ activeTab, onTabChange, isOpen, onClose, isDemo }) => {
  const menuItems = [
    { id: "business", label: "Configuración", icon: <Cog /> },
    { id: "categories", label: "Categorías", icon: <Folder /> },
    { id: "products", label: "Productos", icon: <Package /> },
    { id: "qr", label: "Código QR", icon: <QrCode /> },
  ];

  const handleItemClick = (itemId) => {
    onTabChange(itemId);
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
      <h2 style={{ marginRight: isOpen ? "20px" : "" }}>
        <Library /> Qatalo - Admin
      </h2>
      <nav>
        <ul className="admin-nav">
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
          {isDemo && (
            <li>
              <Link to="/" style={{ color: "white", textDecoration: "none" }}>
                <House /> Ir al inicio
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
