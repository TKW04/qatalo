import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import AdminDashboard from "./pages/AdminDashboard";
import AdminQR from "./pages/AdminQR";
import Register from "./pages/User/Register";
import Login from "./pages/User/Login";
import Payment from "./pages/Payment";
import CatalogPublic from "./pages/CatalogPublic";
import { NotificationProvider } from "./components/UI/NotificationProvider";
import PaymentValidation from "./pages/PaymentValidation";
import TermsAndConditions from "./pages/TermsAndConditions";

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/terms-and-conditions"
            element={<TermsAndConditions />}
          />
          <Route path="/catalog/:slug" element={<CatalogPublic />} />
          <Route path="/admin/qr" element={<AdminQR />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/payment" element={<Payment />} />
          <Route
            path="/paymentValidation/:customer_id/"
            element={<PaymentValidation />}
          />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;
