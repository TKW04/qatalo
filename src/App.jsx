import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import CatalogPublicDemo from "./pages/demo/CatalogPublicDemo";
import AdminDemoDashboard from "./pages/demo/AdminDemoDashboard";
import AdminQR from "./pages/AdminQR";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/demo/catalog/:slug" element={<CatalogPublicDemo />} />
        <Route path="/demo/admin" element={<AdminDemoDashboard />} />
        <Route path="/demo/admin/qr" element={<AdminQR />} />
      </Routes>
    </Router>
  );
}

export default App;
