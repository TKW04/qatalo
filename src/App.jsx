import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";

import Register from "./pages/User/Register";
import Login from "./pages/User/Login";
import ForgotPassword from "./pages/User/ForgotPassword";

import AdminDashboard from "./pages/Admin/AdminDashboard";
import Payment from "./pages/Payment";
import Thanks from "./pages/Thanks";
import CatalogPublic from "./pages/CatalogPublic";

import ResetPassword from "./pages/User/ResetPassword";
import TermsAndConditions from "./pages/Footer/TermsAndConditions";
import PrivacyNotice from "./pages/Footer/PrivacyNotice";
import RefundPolicy from "./pages/Footer/RefundPolicy";
import { NotificationProvider } from "./components/UI/NotificationProvider";
import NotFoundPage from "./pages/NotFoundPage";
import RootPanel from "./pages/Root/RootPanel";
import { getTokenInfo } from "./helpers/token";


function App() {
  const groups = getTokenInfo()?.["cognito:groups"] || [];
  const isRoot = groups.includes("root");

  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          {isRoot && (
            <Route
              path="/root"
              element={<RootPanel />}
            />
          )}
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
          <Route path="/catalog/:slug" element={<CatalogPublic />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/thanks" element={<Thanks />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;
