import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import SSOCallback from "@/pages/SSOCallback";
import Home from "@/pages/Home";
import PlansDrawings from "@/pages/PlansDrawings";
import Splash from "@/pages/Splash";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";
import AcceptInvite from "@/pages/AcceptInvite";
import Budget from "@/pages/Budget";
import Inventory from "@/pages/Inventory";
import Contractor from "@/pages/Contractor";
import SiteDetails from "@/pages/SiteDetails";
import ContractorChat from "@/pages/ContractorChat";
import SiteGallery from "@/pages/SiteGallery";
import Schedule from "@/pages/Schedule";
import CustomerCare from "@/pages/CustomerCare";
import Settings from "@/pages/Settings";
import YourSubscription from "@/pages/YourSubscription";
import HireContractor from "@/pages/HireContractor";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import NewsUpdates from "@/pages/NewsUpdates";
import VisitBuiltattic from "@/pages/VisitBuiltattic";
import Analytics from "@/pages/Analytics";
import TeamManagement from "@/pages/TeamManagement";
import Documents from "@/pages/Documents";
import Reports from "@/pages/Reports";
import Terms from "@/pages/Terms";
import ProtectedRoute from "@/router/ProtectedRoute";
import PublicRoute from "@/router/PublicRoute";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Splash />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route path="/sso-callback" element={<SSOCallback />} />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <PublicRoute>
              <VerifyEmail />
            </PublicRoute>
          }
        />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <TeamManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/budget"
          element={
            <ProtectedRoute>
              <Budget />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contractor"
          element={
            <ProtectedRoute>
              <Contractor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans-drawings"
          element={
            <ProtectedRoute>
              <PlansDrawings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/site-details"
          element={
            <ProtectedRoute>
              <SiteDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contractor-chat"
          element={
            <ProtectedRoute>
              <ContractorChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/site-gallery"
          element={
            <ProtectedRoute>
              <SiteGallery />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <Schedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-care"
          element={
            <ProtectedRoute>
              <CustomerCare />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription"
          element={
            <ProtectedRoute>
              <YourSubscription />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hire-contractor"
          element={
            <ProtectedRoute>
              <HireContractor />
            </ProtectedRoute>
          }
        />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route
          path="/news-updates"
          element={
            <ProtectedRoute>
              <NewsUpdates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/visit-builtattic"
          element={
            <ProtectedRoute>
              <VisitBuiltattic />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
