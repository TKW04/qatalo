import { Cog, Package, House, DollarSign, Star, KeyRound } from "lucide-react";
import "../pages/Landing.css";

const LandingSidebar = ({ onClose }) => {
  const menuItems = [
    { href: "#inicio", label: "Inicio", icon: <House /> },
    { href: "#caracteristicas", label: "Características", icon: <Cog /> },
    { href: "#como-funciona", label: "Cómo Funciona", icon: <Package /> },
    {
      href: "#planes-precios",
      label: "Planes y Precios",
      icon: <DollarSign />,
    },
    { href: "/register", label: "Comenzar Gratis", icon: <Star /> },
    { href: "/login", label: "Iniciar Sesión", icon: <KeyRound /> },
  ];

  return (
    <aside>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(17, 63, 103, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          backdropFilter: "blur(4px)",
        }}
      >
        <div
          className="justify-content-end align-items-center"
          style={{
            width: "280px",
            height: "455px",
            zIndex: 1001,
            background:
              "linear-gradient(135deg, var(--color-navy) 0%, var(--color-blue) 100%)",
            position: "absolute",
            top: "100px",
            right: "15px",
            borderRadius: "10px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            textAlign: "center",
          }}
        >
          {menuItems.map((item) => (
            <div
              key={item.label}
              className="flex-auto flex align-items-center justify-content-center font-bold  px-5 py-3 border-round "
            >
              <a
                href={item.href}
                className="menu-btn flex-auto flex align-items-center justify-content-center gap-1"
                onClick={onClose}
              >
                {item.icon} {item.label}
              </a>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default LandingSidebar;
