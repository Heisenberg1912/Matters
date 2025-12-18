import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/bottom-nav";
import PhoneShell from "@/components/phone-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, Shield, Eye, Lock, Database, Mail, UserCheck } from "lucide-react";

const privacySections = [
  {
    id: "1",
    title: "Information We Collect",
    icon: <Database size={32} className="text-[#cfe0ad]" />,
    content: [
      "Personal Information: Name, email address, phone number, and profile photo when you create an account.",
      "Project Data: Construction project details, budgets, schedules, inventory, contractor information, and uploaded documents.",
      "Usage Data: How you interact with the app, including pages visited, features used, and time spent on the platform.",
      "Device Information: Device type, operating system, browser type, and IP address.",
      "Location Data: GPS coordinates for site visits and geo-tagged photos (with your permission)."
    ]
  },
  {
    id: "2",
    title: "How We Use Your Information",
    icon: <Eye size={32} className="text-[#b8d4f1]" />,
    content: [
      "To provide and maintain the MATTERS construction management platform.",
      "To process your transactions and manage your subscription.",
      "To send you important updates about your projects and account.",
      "To improve our services through analytics and user feedback.",
      "To provide customer support and respond to your inquiries.",
      "To detect and prevent fraud, security incidents, and illegal activities.",
      "To comply with legal obligations and enforce our Terms of Service."
    ]
  },
  {
    id: "3",
    title: "Data Storage & Security",
    icon: <Lock size={32} className="text-[#f3c5a8]" />,
    content: [
      "Your data is stored securely on encrypted servers with industry-standard security protocols.",
      "We use SSL/TLS encryption for all data transmission between your device and our servers.",
      "Project data is backed up regularly to prevent data loss.",
      "Access to your data is restricted to authorized personnel only.",
      "We implement multi-factor authentication and regular security audits.",
      "Sensitive information like payment details are handled by PCI-compliant payment processors."
    ]
  },
  {
    id: "4",
    title: "Data Sharing",
    icon: <UserCheck size={32} className="text-[#e8b3d4]" />,
    content: [
      "We DO NOT sell your personal information to third parties.",
      "Project data is shared only with team members you invite to collaborate.",
      "Contractor information is visible only to project owners who need to hire services.",
      "We may share data with service providers who help us operate the platform (hosting, analytics, payment processing).",
      "We may disclose information if required by law or to protect our rights and safety.",
      "Anonymous, aggregated data may be used for industry research and insights."
    ]
  },
  {
    id: "5",
    title: "Your Rights",
    icon: <Shield size={32} className="text-[#d4e8b3]" />,
    content: [
      "Access: Request a copy of all personal data we hold about you.",
      "Correction: Update or correct inaccurate information in your profile.",
      "Deletion: Request deletion of your account and associated data (subject to legal retention requirements).",
      "Export: Download your project data in a portable format (JSON, CSV, PDF).",
      "Opt-out: Unsubscribe from marketing emails at any time.",
      "Data Portability: Transfer your data to another service provider.",
      "Withdraw Consent: Revoke permissions for location access or photo uploads."
    ]
  },
  {
    id: "6",
    title: "Cookies & Tracking",
    icon: <Eye size={32} className="text-[#cfe0ad]" />,
    content: [
      "We use cookies to remember your preferences and keep you logged in.",
      "Analytics cookies help us understand how users interact with the app.",
      "You can disable cookies in your browser settings, but this may affect functionality.",
      "We use local storage to cache data for offline access.",
      "Third-party services (Google Analytics, payment processors) may set their own cookies."
    ]
  }
];

const contactInfo = {
  email: "privacy@builtattic.com",
  address: "BuildAttic Technologies Pvt Ltd, Bhopal, Madhya Pradesh, India",
  phone: "+91 98765 43210",
  lastUpdated: "December 18, 2025"
};

export default function PrivacyPolicy() {
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
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Privacy Policy</span>
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
                  <Shield size={64} className="text-[#cfe0ad]" strokeWidth={1.5} />
                  <div>
                    <h2 className="text-4xl font-bold tracking-tight text-white">Your Privacy Matters</h2>
                    <p className="mt-2 text-xl text-[#bdbdbd]">
                      We are committed to protecting your personal information and your right to privacy.
                    </p>
                  </div>
                </div>

                <Card className="mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                  <p className="text-xl leading-relaxed text-[#bdbdbd]">
                    This Privacy Policy explains how MATTERS collects, uses, stores, and protects your personal information
                    when you use our construction management platform. By using MATTERS, you agree to the practices described
                    in this policy.
                  </p>
                  <p className="mt-6 text-lg text-[#8a8a8a]">
                    Last updated: <span className="font-semibold text-white">{contactInfo.lastUpdated}</span>
                  </p>
                </Card>
              </section>

              <section className="mt-20">
                <h3 className="text-4xl font-bold tracking-tight text-white">Privacy Sections</h3>
                <div className="mt-8 space-y-8">
                  {privacySections.map((section) => (
                    <Card
                      key={section.id}
                      className="border border-[#2a2a2a] bg-[#101010] p-8"
                    >
                      <div className="flex items-start gap-6">
                        <div className="rounded-full border border-[#2a2a2a] bg-[#0c0c0c] p-4">
                          {section.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-2xl font-semibold text-white">{section.title}</h4>
                          <ul className="mt-6 space-y-4">
                            {section.content.map((item, idx) => (
                              <li key={idx} className="flex gap-4 text-lg text-[#bdbdbd]">
                                <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#cfe0ad]" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>

              <section className="mt-20">
                <h3 className="text-4xl font-bold tracking-tight text-white">Data Retention</h3>
                <Card className="mt-8 border border-[#242424] bg-[#101010] p-10">
                  <p className="text-xl leading-relaxed text-[#bdbdbd]">
                    We retain your personal information for as long as your account is active or as needed to provide you services.
                    After account deletion, we may retain certain information for legal compliance, dispute resolution, and
                    enforcement of our agreements.
                  </p>
                  <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-[34px] border border-[#2a2a2a] bg-[#0c0c0c] p-6 text-center">
                      <p className="text-6xl font-black text-[#cfe0ad]">30</p>
                      <p className="mt-2 text-lg text-[#bdbdbd]">Days after deletion request</p>
                      <p className="mt-1 text-sm text-[#8a8a8a]">Personal data removed</p>
                    </div>
                    <div className="rounded-[34px] border border-[#2a2a2a] bg-[#0c0c0c] p-6 text-center">
                      <p className="text-6xl font-black text-[#b8d4f1]">90</p>
                      <p className="mt-2 text-lg text-[#bdbdbd]">Days in backups</p>
                      <p className="mt-1 text-sm text-[#8a8a8a]">Then permanently deleted</p>
                    </div>
                    <div className="rounded-[34px] border border-[#2a2a2a] bg-[#0c0c0c] p-6 text-center">
                      <p className="text-6xl font-black text-[#f3c5a8]">7</p>
                      <p className="mt-2 text-lg text-[#bdbdbd]">Years for tax records</p>
                      <p className="mt-1 text-sm text-[#8a8a8a]">Legal requirement</p>
                    </div>
                  </div>
                </Card>
              </section>

              <section className="mt-20">
                <h3 className="text-4xl font-bold tracking-tight text-white">Children's Privacy</h3>
                <Card className="mt-8 border border-[#242424] bg-[#101010] p-10">
                  <p className="text-xl leading-relaxed text-[#bdbdbd]">
                    MATTERS is not intended for use by children under the age of 18. We do not knowingly collect personal
                    information from children. If you believe a child has provided us with personal information, please contact
                    us immediately and we will delete it.
                  </p>
                </Card>
              </section>

              <section className="mt-20">
                <h3 className="text-4xl font-bold tracking-tight text-white">Contact Us</h3>
                <Card className="mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                  <p className="text-xl text-[#bdbdbd]">
                    If you have any questions about this Privacy Policy or how we handle your data, please contact us:
                  </p>
                  <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="flex items-center gap-4">
                      <Mail size={32} className="text-[#cfe0ad]" />
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Email</p>
                        <p className="mt-1 text-xl text-white">{contactInfo.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Shield size={32} className="text-[#b8d4f1]" />
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Phone</p>
                        <p className="mt-1 text-xl text-white">{contactInfo.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 border-t border-[#2a2a2a] pt-8">
                    <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Address</p>
                    <p className="mt-2 text-xl text-white">{contactInfo.address}</p>
                  </div>
                </Card>
              </section>

              <section className="mt-20">
                <h3 className="text-4xl font-bold tracking-tight text-white">Updates to This Policy</h3>
                <Card className="mt-8 border border-[#242424] bg-[#101010] p-10">
                  <p className="text-xl leading-relaxed text-[#bdbdbd]">
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
                    Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy
                    Policy periodically for any changes.
                  </p>
                  <div className="mt-8 flex items-center justify-between rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-8 py-4">
                    <span className="text-xl text-[#bdbdbd]">Version 1.0</span>
                    <span className="text-xl font-semibold text-[#cfe0ad]">{contactInfo.lastUpdated}</span>
                  </div>
                </Card>
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
