import { useEffect, useState } from "react";

import AdminSidebar from "../components/AdminSidebar";
import Business from "../components/Tabs/Business";
import Categories from "../components/Tabs/Categories";
import Products from "../components/Tabs/Products";
import PaymentMethods from "../components/Tabs/PaymentMethods";

import { isNotValidToken, removeToken, setToken } from "../helpers/token";
import { getCurrentSession } from "../services/authenticate";

import "../styles/admin.css";
import Customers from "../components/Tabs/Customers";

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
    <div className="admin-layout">
      <button
        className="mobile-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        ☰
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
        {activeTab === "paymentMethods" && <PaymentMethods setActiveTab={setActiveTab} />}
        {activeTab === "customers" && <Customers setActiveTab={setActiveTab} />}
        {activeTab === "qr" && (
          <div>
            <div className="admin-header">
              <h1>Código QR</h1>
              <p>Genera y descarga el código QR de tu catálogo</p>
            </div>

            <div className="admin-card">
              <div style={{ textAlign: "center" }}>
                <p style={{ marginBottom: "2rem", color: "#666" }}>
                  Comparte este código QR para que tus clientes accedan a tu
                  catálogo
                </p>
                <div className="form-actions">
                  <a
                    href="/admin/qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    Ver QR del Catálogo
                  </a>
                  <a
                    // href={`/catalog/${business.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                  >
                    Ver Catálogo Público
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
