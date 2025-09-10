import { useEffect, useState } from "react";

import AdminSidebar from "../components/AdminSidebar";
import Business from "../components/Tabs/Business";
import Categories from "../components/Tabs/Categories";
import Products from "../components/Tabs/Products";
import PaymentMethods from "../components/Tabs/PaymentMethods";
import QrTab from "../components/Tabs/QrTab";

import { isNotValidToken, removeToken, setToken } from "../helpers/token";
import { getCurrentSession } from "../services/authenticate";

import "../styles/admin.css";
import Customers from "../components/Tabs/Customers";
import { Menu } from "lucide-react";

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
        {activeTab === "customers" && <Customers setActiveTab={setActiveTab} />}
        {activeTab === "qr" && (
          <QrTab setActiveTab={setActiveTab} />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
