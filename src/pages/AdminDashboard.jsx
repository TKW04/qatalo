import { useEffect, useState } from "react";

import { Menu } from "lucide-react";

import AdminSidebar from "../components/AdminSidebar";
import Business from "../components/Tabs/Business";
import Categories from "../components/Tabs/Categories";
import Products from "../components/Tabs/Products";
import PaymentMethods from "../components/Tabs/PaymentMethods";
import QrTab from "../components/Tabs/QrTab";

import { isNotValidToken, removeToken, setToken } from "../helpers/token";
import { getCurrentSession } from "../services/authenticate";

import Customers from "../components/Tabs/Customers";

import Subscription from "../components/Tabs/Subscription";
import Password from "../components/Tabs/Password";

import "../styles/admin.css";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("business");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const notValidToken = isNotValidToken();

  useEffect(() => {
    if (notValidToken) {
      getCurrentSession()
        .then((data) => {
          setToken(data.idToken.jwtToken);
          window.location.reload();
        })
        .catch(() => {
          removeToken();
          window.location.href = "/login";
        });
    }
  }, [notValidToken]);

  return (
    <>
      <div className="admin-layout">
        <button
          className="mobile-sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <Menu
            color="white"
            size={20}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          />
        </button>

        <AdminSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="admin-main">
          {activeTab === "business" && <Business />}

          {activeTab === "categories" && (
            <Categories setActiveTab={setActiveTab} />
          )}

          {activeTab === "products" && <Products setActiveTab={setActiveTab} />}
          {activeTab === "paymentMethods" && (
            <PaymentMethods setActiveTab={setActiveTab} />
          )}
          {activeTab === "customers" && (
            <Customers setActiveTab={setActiveTab} />
          )}
          {activeTab === "qr" && <QrTab setActiveTab={setActiveTab} />}
          {activeTab === "subscription" && (
            <Subscription setActiveTab={setActiveTab} />
          )}
          {activeTab === "changepassword" && (
            <Password setActiveTab={setActiveTab} />
          )}
        </main>
      </div>
      <footer>
          <div className="container">
            <p>
              <Link
                target="_blank"
                to="/terms-and-conditions"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                Términos de Servicio
              </Link>{" | "}
              <Link
                target="_blank"
                to="/privacy-policy"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                Política de Privacidad
              </Link>
              {" | "}
              <Link
                target="_blank"
                to="/refund-policy"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                Política de Reembolso
              </Link>
            </p>
            <p>&copy; 2025 Qatalo. Todos los derechos reservados.</p>
          </div>
        </footer>
    </>
  );
};

export default AdminDashboard;
