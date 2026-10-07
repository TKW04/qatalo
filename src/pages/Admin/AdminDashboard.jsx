import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";

import AdminSidebar from "./AdminSidebar";
import Business from "./Tabs/Business";
import Categories from "./Tabs/Categories";
import Products from "./Tabs/Products";
import PaymentMethods from "./Tabs/PaymentMethods";
import Customers from "./Tabs/Customers";
import Offers from "./Tabs/Offers";
import Reports from "./Tabs/Reports";
import QrTab from "./Tabs/QrTab";
import Subscription from "./Tabs/Subscription";
import Password from "./Tabs/Password";
import Orders from "./Tabs/Orders";
import WelcomeModal from "./WelcomeModal";

import { isNotValidToken, removeToken, setToken, getTokenInfo } from "../../helpers/token";
import { getCurrentSession } from "../../services/authenticate";
import userpoolMerchants from "../../services/userpoolMerchants";
import { fetchBusinessData } from "../../services/businessApi";
import FeatureSuggestionButton from "../../components/Featuresuggestionbutton/FeatureSuggestionButton";

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

  // Menú móvil: Esc cierra, bloquea el scroll del fondo y devuelve el foco a la hamburguesa
  const toggleRef = useRef(null);
  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        toggleRef.current?.focus();
      }
    };
    const prevOverflow = document.body.style.overflow;
    if (window.innerWidth <= 992) document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [sidebarOpen]);

  return (
    <>
      <div className={styles.adminLayout}>
        <header className={styles.mobileBar}>
          <button
            ref={toggleRef}
            type="button"
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
          <img
            src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo.png"
            alt="Qatalo"
            className={styles.mobileLogo}
            width="88"
            height="28"
          />
        </header>

        <div
          className={`${styles.backdrop} ${sidebarOpen ? styles.backdropVisible : ""}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        <AdminSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => {
            setSidebarOpen(false);
            toggleRef.current?.focus({ preventScroll: true });
          }}
        />

        <main className={styles.adminMain}>
          {activeTab === "business" && <Business />}
          {activeTab === "categories" && <Categories setActiveTab={setActiveTab} />}
          {activeTab === "products" && <Products setActiveTab={setActiveTab} />}
          {activeTab === "paymentMethods" && <PaymentMethods setActiveTab={setActiveTab} />}
          {activeTab === "customers" && <Customers setActiveTab={setActiveTab} />}
          {activeTab === "orders" && <Orders />}
          {activeTab === "offers" && <Offers />}
          {activeTab === "reports" && <Reports />}
          {activeTab === "qr" && <QrTab setActiveTab={setActiveTab} />}
          {activeTab === "subscription" && <Subscription setActiveTab={setActiveTab} />}
          {activeTab === "changepassword" && <Password setActiveTab={setActiveTab} />}
        </main>
      </div>

      {showWelcome && (
        <WelcomeModal onClose={() => setWelcomeDismissed(true)} />
      )}
      <FeatureSuggestionButton />
    </>
  );
};

export default AdminDashboard;