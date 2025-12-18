import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PhoneShell from "@/components/phone-shell";
import splashLogo from "../assets/branding/splash-logo.svg";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/home"), 1000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <PhoneShell className="items-center justify-center bg-black">
      {splashLogo ? (
        <img src={splashLogo} alt="MATTERS" className="w-[240px]" />
      ) : (
        <div className="text-3xl font-bold tracking-[0.4em]">MATTERS</div>
      )}
    </PhoneShell>
  );
}
