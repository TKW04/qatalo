import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import AdminDashboard from "./pages/AdminDashboard";
import AdminQR from "./pages/AdminQR";
import Register from "./pages/User/Register";
import Login from "./pages/User/Login";
import Payment from "./pages/Payment";
import { NotificationProvider } from "./components/UI/NotificationProvider";

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          {/* <Route path="/demo/catalog/:slug" element={<CatalogPublicDemo />} />
          <Route path="/demo/admin" element={<AdminDemoDashboard />} />
          <Route path="/demo/admin/qr" element={<AdminQR />} /> */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;
