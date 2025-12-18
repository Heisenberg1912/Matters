import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/bottom-nav";
import PhoneShell from "@/components/phone-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CheckCircle2, Crown, CreditCard, Calendar, ArrowLeft } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 0,
    period: "Free Forever",
    features: [
      "1 Active Project",
      "5 Contractors",
      "Basic Budget Tracking",
      "10GB Storage",
      "Email Support"
    ],
    current: false
  },
  {
    id: "pro",
    name: "Professional",
    price: 999,
    period: "per month",
    features: [
      "5 Active Projects",
      "Unlimited Contractors",
      "Advanced Budget Analytics",
      "100GB Storage",
      "Priority Support",
      "Offline Mode",
      "Export Reports"
    ],
    current: true,
    popular: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 2499,
    period: "per month",
    features: [
      "Unlimited Projects",
      "Unlimited Contractors",
      "AI-Powered Insights",
      "1TB Storage",
      "24/7 Phone Support",
      "Multi-user Collaboration",
      "Custom Integrations",
      "Dedicated Account Manager"
    ],
    current: false
  }
];

const billingHistory = [
  { id: "1", date: "Dec 1, 2025", amount: 999, status: "Paid", invoice: "INV-2025-12-001" },
  { id: "2", date: "Nov 1, 2025", amount: 999, status: "Paid", invoice: "INV-2025-11-001" },
  { id: "3", date: "Oct 1, 2025", amount: 999, status: "Paid", invoice: "INV-2025-10-001" }
];

export default function YourSubscription() {
  const [mode, setMode] = useState<"construction" | "refurbish">("construction");
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const currentPlan = plans.find(p => p.current) || plans[0];

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
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Your Subscription</span>
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
                <h2 className="text-4xl font-bold tracking-tight text-white">Current Plan</h2>
                <Card className="mt-8 border border-[#cfe0ad] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <Crown size={32} className="text-[#cfe0ad]" />
                        <h3 className="text-3xl font-bold text-white">{currentPlan.name}</h3>
                      </div>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-6xl font-black text-[#cfe0ad]">₹{currentPlan.price}</span>
                        <span className="text-2xl text-[#bdbdbd]">{currentPlan.period}</span>
                      </div>
                      <div className="mt-8 space-y-3">
                        {currentPlan.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-3">
                            <CheckCircle2 size={20} className="text-[#cfe0ad]" />
                            <span className="text-xl text-white">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-10 flex gap-4">
                    <button
                      type="button"
                      className="flex-1 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] py-5 text-xl font-semibold text-white transition hover:border-[#cfe0ad]"
                      onClick={() => showToast({ type: 'info', message: 'Manage plan options' })}
                    >
                      Manage Plan
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-full bg-[#cfe0ad] py-5 text-xl font-semibold text-black transition hover:bg-[#d4e4b8]"
                      onClick={() => showToast({ type: 'info', message: 'Cancel subscription' })}
                    >
                      Cancel Subscription
                    </button>
                  </div>
                </Card>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Available Plans</h2>
                <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
                  {plans.map((plan) => (
                    <Card
                      key={plan.id}
                      className={`rounded-[34px] border p-8 ${
                        plan.current
                          ? "border-[#cfe0ad] bg-gradient-to-b from-[#161616] to-[#070707]"
                          : "border-[#2a2a2a] bg-[#101010]"
                      }`}
                    >
                      {plan.popular && (
                        <div className="mb-4 inline-block rounded-full bg-[#cfe0ad] px-4 py-1 text-sm font-semibold text-black">
                          Most Popular
                        </div>
                      )}
                      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-5xl font-black text-white">₹{plan.price}</span>
                        {plan.price > 0 && <span className="text-lg text-[#bdbdbd]">/{plan.period}</span>}
                      </div>
                      <div className="mt-8 space-y-3">
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-[#cfe0ad]" />
                            <span className="text-base text-[#bdbdbd]">{feature}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        className={`mt-8 w-full rounded-full py-4 text-lg font-semibold transition ${
                          plan.current
                            ? "bg-[#2a2a2a] text-[#8a8a8a] cursor-not-allowed"
                            : "bg-[#cfe0ad] text-black hover:bg-[#d4e4b8]"
                        }`}
                        disabled={plan.current}
                        onClick={() => showToast({ type: 'success', message: `Upgrading to ${plan.name}` })}
                      >
                        {plan.current ? "Current Plan" : "Upgrade"}
                      </button>
                    </Card>
                  ))}
                </div>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Billing History</h2>
                <Card className="mt-8 border border-[#2a2a2a] bg-[#0f0f0f] p-10">
                  <div className="space-y-6">
                    {billingHistory.map((bill, idx) => (
                      <div
                        key={bill.id}
                        className={`flex items-center justify-between py-6 ${
                          idx !== 0 ? "border-t border-[#1f1f1f]" : ""
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <Calendar size={24} className="text-[#cfe0ad]" />
                          <div>
                            <p className="text-xl font-semibold text-white">{bill.invoice}</p>
                            <p className="text-base text-[#bdbdbd]">{bill.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">₹{bill.amount}</p>
                            <p className="text-sm text-[#4ade80]">{bill.status}</p>
                          </div>
                          <button
                            type="button"
                            className="rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-6 py-3 text-lg font-semibold text-white transition hover:border-[#cfe0ad]"
                            onClick={() => showToast({ type: 'info', message: 'Downloading invoice' })}
                          >
                            <CreditCard size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Usage Statistics</h2>
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Active Projects", value: "1/5", max: "5" },
                    { label: "Contractors", value: "4", max: "Unlimited" },
                    { label: "Storage Used", value: "2.4GB", max: "100GB" },
                    { label: "Days Remaining", value: "22", max: "30" }
                  ].map((stat) => (
                    <Card
                      key={stat.label}
                      className="flex flex-col items-center justify-center rounded-[34px] border border-[#242424] bg-[#101010] p-8"
                    >
                      <div className="text-5xl font-black text-[#cfe0ad]">{stat.value}</div>
                      <p className="mt-2 text-base text-[#8a8a8a]">of {stat.max}</p>
                      <p className="mt-2 text-xl text-white">{stat.label}</p>
                    </Card>
                  ))}
                </div>
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
