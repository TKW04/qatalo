import { useEffect, useState } from "react";

import { IoMenu } from "react-icons/io5";

import AdminSidebar from "../components/Admin/AdminSidebar";
import Business from "../components/Admin/Tabs/Business";
import Categories from "../components/Admin/Tabs/Categories";
import Products from "../components/Admin/Tabs/Products";
import PaymentMethods from "../components/Admin/Tabs/PaymentMethods";
import Customers from "../components/Admin/Tabs/Customers";
import QrTab from "../components/Admin/Tabs/QrTab";
import Subscription from "../components/Admin/Tabs/Subscription";
import Password from "../components/Admin/Tabs/Password";

import { isNotValidToken, removeToken, setToken } from "../helpers/token";
import { getCurrentSession } from "../services/authenticate";

import Footer from "../components/Footer";
import "../styles/admin.css";

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
          <IoMenu
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
      <Footer />
    </>
  );
};

export default AdminDashboard;
