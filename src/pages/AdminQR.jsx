import QrViewer2 from "../components/QrViewer2";
import "../styles/admin.css";
import { useSelector } from "react-redux";

const AdminQR = () => {
  const business = useSelector((state) => state.business.business);

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
        <QrViewer2 />
      </div>
    </div>
  );
};

export default AdminQR;
