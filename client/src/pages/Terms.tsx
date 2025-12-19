import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/bottom-nav";
import PhoneShell from "@/components/phone-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, FileText } from "lucide-react";

const sections = [
  {
    title: "Account Responsibilities",
    content: [
      "Provide accurate registration details and keep your profile updated.",
      "Maintain the confidentiality of your login credentials.",
      "Notify us immediately if you suspect unauthorized access."
    ],
  },
  {
    title: "Project Data",
    content: [
      "You retain ownership of project data and files you upload.",
      "You grant Matters permission to process data to deliver the service.",
      "Do not upload content that violates laws or third-party rights."
    ],
  },
  {
    title: "Payments & Subscriptions",
    content: [
      "Subscription fees are billed per the selected plan.",
      "Late or failed payments may result in limited access.",
      "You may cancel your subscription at any time."
    ],
  },
  {
    title: "Acceptable Use",
    content: [
      "Use the platform for lawful construction management purposes.",
      "Do not attempt to disrupt services or bypass security controls.",
      "Respect team member privacy and project confidentiality."
    ],
  },
  {
    title: "Service Availability",
    content: [
      "We aim for high availability but do not guarantee uninterrupted access.",
      "Scheduled maintenance windows will be communicated when possible.",
      "We may update features to improve performance and security."
    ],
  },
];

export default function Terms() {
  const [mode, setMode] = useState<"construction" | "refurbish">("construction");
  const navigate = useNavigate();

  const menuItems = [
    { label: "Your Subscription", path: "/subscription" },
    { label: "Hire a Contractor", path: "/hire-contractor" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "News & Updates", path: "/news-updates" },
    { label: "Visit Builtattic", path: "/visit-builtattic" },
    { label: "Settings", path: "/settings" }
  ];

  return (
    <PhoneShell>
      <Sheet>
        <div className="flex h-full flex-col">
          <header className="flex flex-wrap items-center gap-6 rounded-b-[60px] border-b border-[#1f1f1f] bg-[#050505] px-6 py-10 md:flex-nowrap md:px-10 lg:px-24 lg:py-16">
            <button onClick={() => navigate(-1)} className="text-white hover:text-[#cfe0ad]">
              <ArrowLeft size={24} />
            </button>

            <SheetTrigger asChild>
              <button type="button">
                <Avatar className="h-16 w-16 border-2 border-[#232323]">
                  <AvatarFallback>G</AvatarFallback>
                </Avatar>
              </button>
            </SheetTrigger>

            <div className="flex flex-col text-white">
              <span className="text-3xl font-semibold">Oh Hi, Guest!</span>
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Terms of Service</span>
            </div>

            <div className="ml-auto flex rounded-full border border-[#2a2a2a] bg-[#0c0c0c] p-2 text-base font-semibold">
              {(["construction", "refurbish"] as const).map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => setMode(state)}
                  className={`rounded-full px-6 py-2 transition ${
                    mode === state ? "bg-[var(--pill,#cfe0ad)] text-black" : "text-white"
                  }`}
                >
                  {state.toUpperCase()}
                </button>
              ))}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 pb-32 md:px-10 lg:px-24">
            <div className="mx-auto w-full max-w-6xl">
              <section className="mt-16">
                <div className="flex items-center gap-6">
                  <FileText size={64} className="text-[#cfe0ad]" strokeWidth={1.5} />
                  <div>
                    <h2 className="text-4xl font-bold tracking-tight text-white">Terms of Service</h2>
                    <p className="mt-2 text-xl text-[#bdbdbd]">
                      Please read these terms carefully before using the Matters platform.
                    </p>
                  </div>
                </div>

                <Card className="mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                  <p className="text-xl leading-relaxed text-[#bdbdbd]">
                    By creating an account or using Matters, you agree to these Terms of Service.
                    If you do not agree, please discontinue use of the platform.
                  </p>
                  <p className="mt-6 text-lg text-[#8a8a8a]">
                    Last updated: <span className="font-semibold text-white">December 18, 2025</span>
                  </p>
                </Card>
              </section>

              <section className="mt-20 space-y-8">
                {sections.map((section) => (
                  <Card key={section.title} className="border border-[#2a2a2a] bg-[#101010] p-8">
                    <h3 className="text-2xl font-semibold text-white">{section.title}</h3>
                    <ul className="mt-6 space-y-4">
                      {section.content.map((item) => (
                        <li key={item} className="flex gap-4 text-lg text-[#bdbdbd]">
                          <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#cfe0ad]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </section>
            </div>
          </div>

          <BottomNav />
        </div>

        <SheetContent>
          <div className="space-y-10 text-2xl">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="w-full text-left font-medium transition hover:text-[#cfe0ad]"
              >
                {item.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </PhoneShell>
  );
}
