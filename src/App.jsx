import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";

import Register from "./pages/User/Register";
import Login from "./pages/User/Login";
import ForgotPassword from "./pages/User/ForgotPassword";

import AdminDashboard from "./pages/Admin/AdminDashboard";
// import Payment from "./pages/Payment";
// import CatalogPublic from "./pages/CatalogPublic";
// import PaymentValidation from "./pages/PaymentValidation";

// import NotFoundPage from "./pages/NotFoundPage";
// import ResetPassword from "./pages/User/ResetPassword";
import TermsAndConditions from "./pages/Footer/TermsAndConditions";
import PrivacyNotice from "./pages/Footer/PrivacyNotice";
import RefundPolicy from "./pages/Footer/RefundPolicy";

import { NotificationProvider } from "./components/UI/NotificationProvider";


function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/termsandconditions"
            element={<TermsAndConditions />}
          />
          <Route
            path="/privacypolicy"
            element={<PrivacyNotice />}
          />
          <Route path="/refundpolicy" element={<RefundPolicy />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* 
          

          <Route path="/catalog/:slug" element={<CatalogPublic />} />
          
          
          
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/payment" element={<Payment />} />
          <Route
            path="/paymentValidation/:customer_id/"
            element={<PaymentValidation />}
          />
          
          <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;
