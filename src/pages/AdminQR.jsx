import { useEffect, useState } from "react";
import { getBusinessData } from "../services/storage";
import QrViewer from "../components/QrViewer";
import "../styles/admin.css";

function AdminQR() {
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    setBusiness(getBusinessData());
  }, []);

  if (!business) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: "1rem" }}>Cargando...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fafafa",
        padding: "2rem 0",
      }}
    >
      <div className="container">
        <QrViewer business={business} isDemo={true} />
      </div>
    </div>
  );
}

export default AdminQR;
