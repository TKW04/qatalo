import { useQuery } from "@tanstack/react-query";
import { TbWorld } from "react-icons/tb";

import { getTokenInfo } from "../../../helpers/token";
import { fetchBusinessData } from "../../../services/businessApi";
import QrViewer from "../../../components/QrViewer";
import adminStyles from "../AdminDashboard.module.css";

const QrTab = () => {
  const auth = getTokenInfo();
  const tenantId = auth?.sub;
  const { data: business } = useQuery({
    queryKey: ["business", tenantId],
    queryFn: fetchBusinessData,
    enabled: !!tenantId,
    retry: false,
  });

  return (
    <div>
      <div className={adminStyles.adminHeader}>
        <h1>Código QR</h1>
        <p>Genera, descarga e imprime el código QR de tu catálogo</p>
      </div>

      <div className={adminStyles.adminCard} style={{ textAlign: "center" }}>
        <p style={{ marginBottom: "1.5rem" }}>
          Comparte este código para que tus clientes accedan a tu catálogo
        </p>

        <QrViewer />

        <div style={{ marginTop: "1.5rem" }}>
          <button
            type="button"
            onClick={() => business?.slug && window.open(`/catalog/${business.slug}`, "_blank")}
            style={{
              display: "inline-flex", alignItems: "center", gap: ".5rem",
              padding: ".7rem 1.4rem", borderRadius: "10px",
              border: "1px solid #34699a", background: "transparent",
              color: "#34699a", fontWeight: 600, cursor: "pointer",
            }}
          >
            <TbWorld size={20} /> Ver catálogo público
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrTab;