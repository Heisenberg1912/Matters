import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "@/pages/Home";
import PlansDrawings from "@/pages/PlansDrawings";
import Splash from "@/pages/Splash";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/home" element={<Home />} />
        <Route path="/plans-drawings" element={<PlansDrawings />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
