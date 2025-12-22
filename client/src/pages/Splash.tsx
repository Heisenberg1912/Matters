import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PhoneShell from "@/components/phone-shell";
import splashLogo from "../assets/branding/splash-logo.png";
import { useAuth } from "@/context/AuthContext";

export default function Splash() {
  const navigate = useNavigate();
  const { isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return () => undefined;
    }

    const t = setTimeout(() => navigate("/home"), 800);
    return () => clearTimeout(t);
  }, [isLoading, navigate]);

  return (
    <PhoneShell className="items-center justify-center bg-[radial-gradient(circle_at_top,#0f160f_0%,#050505_55%,#020202_100%)]">
      <div className="relative flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 xs:h-28 xs:w-28 sm:h-32 sm:w-32 rounded-full bg-[#cfe0ad]/10 blur-2xl animate-breathe-ring motion-reduce:animate-none" />
          <div className="absolute h-36 w-36 xs:h-44 xs:w-44 sm:h-52 sm:w-52 rounded-full bg-[#cfe0ad]/5 blur-3xl animate-breathe-ring animation-delay-200 motion-reduce:animate-none" />
          <div className="relative rounded-[22px] xs:rounded-[26px] sm:rounded-[30px] border border-[#1e1e1e] bg-[#060606] p-4 xs:p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-breathe motion-reduce:animate-none">
            <img
              src={splashLogo}
              alt="MATTERS x builtattic"
              className="h-auto w-[200px] xs:w-[240px] sm:w-[300px] md:w-[340px] object-contain"
            />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2 text-[0.55rem] xs:text-[0.6rem] sm:text-xs uppercase tracking-[0.45em] text-[#9ea29a]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cfe0ad] animate-pulse-glow motion-reduce:animate-none" />
          <span>Loading</span>
        </div>
      </div>
    </PhoneShell>
  );
}
