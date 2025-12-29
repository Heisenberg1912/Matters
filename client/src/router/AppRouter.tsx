import { BrowserRouter, Route, Routes, useLocation, Outlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "@/pages/Home";
import PlansDrawings from "@/pages/PlansDrawings";
import Splash from "@/pages/Splash";
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
import Login from "@/pages/Login";
import LoginSuccess from "@/pages/LoginSuccess";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import ProtectedRoute from "@/router/ProtectedRoute";
import AppLayout from "@/components/app-layout";

// Customer pages
import CustomerDashboard from "@/pages/customer/Dashboard";
import PostJob from "@/pages/customer/PostJob";
import ViewBids from "@/pages/customer/ViewBids";
import ProgressTracking from "@/pages/customer/ProgressTracking";
import CustomerJobDetails from "@/pages/customer/JobDetails";

// Contractor pages
import ContractorDashboard from "@/pages/contractor/ContractorDashboard";
import AvailableJobs from "@/pages/contractor/AvailableJobs";
import JobDetails from "@/pages/contractor/JobDetails";
import MyBids from "@/pages/contractor/MyBids";
import MyAssignments from "@/pages/contractor/MyAssignments";
import SubmitProgress from "@/pages/contractor/SubmitProgress";
import Earnings from "@/pages/contractor/Earnings";
import ContractorProfile from "@/pages/contractor/ContractorProfile";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import UserManagement from "@/pages/admin/UserManagement";
import ProjectOversight from "@/pages/admin/ProjectOversight";
import ContractorVerification from "@/pages/admin/ContractorVerification";
import TicketManagement from "@/pages/admin/TicketManagement";
import SystemAnalytics from "@/pages/admin/SystemAnalytics";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes - no bottom nav */}
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-success" element={<LoginSuccess />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />

        {/* Protected routes with bottom nav */}
        <Route element={<AppLayout />}>
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

          {/* Customer Routes */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute roles={["user", "admin", "superadmin"]}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/post-job"
            element={
              <ProtectedRoute roles={["user", "admin", "superadmin"]}>
                <PostJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/bids"
            element={
              <ProtectedRoute roles={["user", "admin", "superadmin"]}>
                <ViewBids />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/progress"
            element={
              <ProtectedRoute roles={["user", "admin", "superadmin"]}>
                <ProgressTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/jobs/:jobId"
            element={
              <ProtectedRoute roles={["user", "admin", "superadmin"]}>
                <CustomerJobDetails />
              </ProtectedRoute>
            }
          />

          {/* Contractor Routes */}
          <Route
            path="/contractor/dashboard"
            element={
              <ProtectedRoute roles={["contractor", "admin", "superadmin"]}>
                <ContractorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contractor/jobs"
            element={
              <ProtectedRoute roles={["contractor", "admin", "superadmin"]}>
                <AvailableJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contractor/jobs/:jobId"
            element={
              <ProtectedRoute roles={["contractor", "admin", "superadmin"]}>
                <JobDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contractor/bids"
            element={
              <ProtectedRoute roles={["contractor", "admin", "superadmin"]}>
                <MyBids />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contractor/assignments"
            element={
              <ProtectedRoute roles={["contractor", "admin", "superadmin"]}>
                <MyAssignments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contractor/progress"
            element={
              <ProtectedRoute roles={["contractor", "admin", "superadmin"]}>
                <SubmitProgress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contractor/earnings"
            element={
              <ProtectedRoute roles={["contractor", "admin", "superadmin"]}>
                <Earnings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contractor/profile"
            element={
              <ProtectedRoute roles={["contractor", "admin", "superadmin"]}>
                <ContractorProfile />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <ProjectOversight />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contractors"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <ContractorVerification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tickets"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <TicketManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <SystemAnalytics />
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
        </Route>
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
