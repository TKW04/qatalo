import { useEffect, useState } from "react";
import { IoMenu } from "react-icons/io5";

import AdminSidebar from "./AdminSidebar";
import Business from "./Tabs/Business";
import Categories from "./Tabs/Categories";
import Products from "./Tabs/Products";
import PaymentMethods from "./Tabs/PaymentMethods";
import Customers from "./Tabs//Customers";
import QrTab from "./Tabs/QrTab";
import Subscription from "./Tabs/Subscription";
import Password from "./Tabs/Password";

import { isNotValidToken, removeToken, setToken } from "../../helpers/token";
import { getCurrentSession } from "../../services/authenticate";
import userpoolMerchants from "../../services/userpoolMerchants"; // Inyectamos el pool correcto

import Footer from "../../components/Footer";
import styles from "./AdminDashboard.module.css"; // CSS Module

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("business");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const notValidToken = isNotValidToken();

  useEffect(() => {
    if (notValidToken) {
      // Le pasamos explícitamente el pool de Merchants
      getCurrentSession(userpoolMerchants)
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
      <div className={styles.adminLayout}>
        <button
          className={styles.sidebarToggle}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <IoMenu color="white" size={24} />
        </button>

        <AdminSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className={`${styles.adminMain} ${!sidebarOpen ? styles.adminMainClose : ""}`}>
          {activeTab === "business" && <Business />}
          {activeTab === "categories" && <Categories setActiveTab={setActiveTab} />}
          {activeTab === "products" && <Products setActiveTab={setActiveTab} />}
          {activeTab === "paymentMethods" && <PaymentMethods setActiveTab={setActiveTab} />}
          {activeTab === "customers" && <Customers setActiveTab={setActiveTab} />}
          {activeTab === "qr" && <QrTab setActiveTab={setActiveTab} />}
          {activeTab === "subscription" && <Subscription setActiveTab={setActiveTab} />}
          {activeTab === "changepassword" && <Password setActiveTab={setActiveTab} />}
        </main>
      </div>
      <Footer />
    </>
  );
};

export default AdminDashboard;