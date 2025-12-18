import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "@/pages/Home";
import PlansDrawings from "@/pages/PlansDrawings";
import Splash from "@/pages/Splash";
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

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Splash />} />
        <Route path="/home" element={<Home />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/team" element={<TeamManagement />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/contractor" element={<Contractor />} />
        <Route path="/plans-drawings" element={<PlansDrawings />} />
        <Route path="/site-details" element={<SiteDetails />} />
        <Route path="/contractor-chat" element={<ContractorChat />} />
        <Route path="/site-gallery" element={<SiteGallery />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/customer-care" element={<CustomerCare />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/subscription" element={<YourSubscription />} />
        <Route path="/hire-contractor" element={<HireContractor />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/news-updates" element={<NewsUpdates />} />
        <Route path="/visit-builtattic" element={<VisitBuiltattic />} />
        <Route path="*" element={<Home />} />
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
