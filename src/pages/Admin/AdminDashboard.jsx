import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IoMenu } from "react-icons/io5";

import AdminSidebar from "./AdminSidebar";
import Business from "./Tabs/Business";
import Categories from "./Tabs/Categories";
import Products from "./Tabs/Products";
import PaymentMethods from "./Tabs/PaymentMethods";
import Customers from "./Tabs/Customers";
import QrTab from "./Tabs/QrTab";
import Subscription from "./Tabs/Subscription";
import Password from "./Tabs/Password";
import WelcomeModal from "./WelcomeModal";

import { isNotValidToken, removeToken, setToken, getTokenInfo } from "../../helpers/token";
import { getCurrentSession } from "../../services/authenticate";
import userpoolMerchants from "../../services/userpoolMerchants";
import { fetchBusinessData } from "../../services/businessApi";

import Footer from "../../components/Footer";
import styles from "./AdminDashboard.module.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("business");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  const notValidToken = isNotValidToken();
  const auth = getTokenInfo();
  const tenantId = auth?.sub;

  useEffect(() => {
    if (notValidToken) {
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

  // queryKey idéntico al de AdminSidebar → caché compartido, sin doble fetch
  const { data: business, isSuccess } = useQuery({
    queryKey: ["business", tenantId],
    queryFn: fetchBusinessData,
    enabled: !!tenantId && !notValidToken,
    retry: false,
  });

  const status = auth?.["custom:transaction_status"];
  const subscribed = status === "trialing" || status === "active";
  const hasBusiness = !!business?.business_id;

  // Solo cuando tiene suscripción activa pero aún no creó el negocio
  const showWelcome = isSuccess && subscribed && !hasBusiness && !welcomeDismissed;

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

      {showWelcome && (
        <WelcomeModal onClose={() => setWelcomeDismissed(true)} />
      )}
    </>
  );
};

export default AdminDashboard;