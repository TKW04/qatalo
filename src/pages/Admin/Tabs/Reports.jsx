import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTokenInfo } from "../../../helpers/token";
import { fetchCustomers } from "../../../services/customersApi";
import SellReport from "../../../components/SellReport";
import ProductReport from "../../../components/ProductReport";
import CustomerReport  from "../../../components/Customerreport";
import { PageHeader, Tabs, TabPanel, SkeletonKpis, SkeletonChart } from "../../../components/admin";
import styles from "./Reports.module.css";

const REPORT_TABS = [
  { id: "general", label: "General" },
  { id: "product", label: "Por producto" },
  { id: "customer", label: "Clientes" },
];

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

  return (
    <div>
      <PageHeader title="Reportes" description="Ventas, productos y clientes según tus órdenes." />

      <Tabs idPrefix="reports" label="Tipo de reporte" items={REPORT_TABS} value={tab} onChange={setTab} />

      {isLoading ? (
        <div className={styles.loading}>
          <SkeletonKpis label="Cargando reportes..." />
          <SkeletonChart label="Cargando gráfico..." />
        </div>
      ) : (
        <>
          <TabPanel idPrefix="reports" id="general" value={tab}><SellReport customers={customers} /></TabPanel>
          <TabPanel idPrefix="reports" id="product" value={tab}><ProductReport customers={customers} /></TabPanel>
          <TabPanel idPrefix="reports" id="customer" value={tab}><CustomerReport customers={customers} /></TabPanel>
        </>
      )}
    </div>
  );
};

export default Reports;
