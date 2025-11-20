import { useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "primereact/button";
import { TbWorld } from "react-icons/tb";

import QrViewer from "../../QrViewer";
import adminStyles from "../Admin.module.css";


const QrTab = () => {
  const business = useSelector((state) => state.business.business);
  const [showQR, setShowQR] = useState(false);
  return (
    <div>
      <div className={adminStyles.adminHeader}>
        <h1>Código QR</h1>
        <p>Genera y descarga el código QR de tu catálogo</p>
      </div>

      <div className={adminStyles.adminCard}>
        <div style={{ textAlign: "center" }}>
          <p
            style={{ marginBottom: "2rem", color: "white", fontSize: "1.2rem" }}
          >
            Comparte este código QR para que tus clientes accedan a tu catálogo
          </p>
          <div className="form-actions">
            <Button
              onClick={() => setShowQR(!showQR)}
              label={showQR ? "Ocultar Código QR" : "Mostrar Código QR"}
              className="btn btn-primary"
            />
            <Button
              className="btn btn-outline"
              icon={<TbWorld size={20} />}
              label="Ver Catálogo Público"
              onClick={() => {
                window.open(`/catalog/${business.slug}`, "_blank");
              }}
            />
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        {showQR && <QrViewer />}
      </div>
    </div>
  );
};

export default QrTab;
