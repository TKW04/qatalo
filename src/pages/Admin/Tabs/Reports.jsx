import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Loading from "../../../components/UI/Loading";
import { getTokenInfo } from "../../../helpers/token";
import { fetchCustomers } from "../../../services/customersApi";
import SellReport from "../../../components/SellReport";
import ProductReport from "../../../components/ProductReport";
import adminStyles from "../AdminDashboard.module.css";
import styles from "./Reports.module.css";

const Reports = () => {
  const auth = getTokenInfo();
  const tenantId = auth?.sub;
  const [tab, setTab] = useState("general");

  // misma queryKey que Customers.jsx → caché compartido, sin doble fetch
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", tenantId],
    queryFn: fetchCustomers,
    enabled: !!tenantId,
    retry: false,
  });

  if (isLoading) return <Loading message="Cargando reportes..." />;

  return (
    <div>
      <div className={adminStyles.adminHeader}>
        <h1>Reportes</h1>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "general" ? styles.tabActive : ""}`}
          onClick={() => setTab("general")}
        >
          Reporte general
        </button>
        <button
          className={`${styles.tab} ${tab === "product" ? styles.tabActive : ""}`}
          onClick={() => setTab("product")}
        >
          Por producto
        </button>
      </div>

      {tab === "general" ? (
        <SellReport customers={customers} />
      ) : (
        <ProductReport customers={customers} />
      )}
    </div>
  );
};

export default Reports;