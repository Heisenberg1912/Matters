import { useMemo, useState } from "react";
import BottomNav from "@/components/bottom-nav";
import PhoneShell from "@/components/phone-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const loadAsset = (path: string) => {
  try {
    return new URL(path, import.meta.url).href;
  } catch {
    return undefined;
  }
};

const planPlaceholder = loadAsset("../assets/placeholders/plan-placeholder.png");

const initialPlans = [
  {
    id: "plan-1",
    title: "Site layout - rev 01",
    date: "Dec 16, 2025",
    category: "Construction",
    typology: "Residential",
    regulations: "Local plan ref #1289",
    estimate: "12 months",
    details: "Basement + G+1, podium parking",
    startedAt: "Dec 01, 2025",
    location: "Bhopal, MP",
    deadline: "Dec 12, 2026",
    src: planPlaceholder
  },
  {
    id: "plan-2",
    title: "Interior layout - rev 02",
    date: "Dec 10, 2025",
    category: "Refurbish",
    typology: "Studio",
    regulations: "Ward 4 bylaws v3",
    estimate: "6 months",
    details: "Kitchen expansion + mezzanine study",
    startedAt: "Nov 24, 2025",
    location: "Indore, MP",
    deadline: "May 30, 2026",
    src: planPlaceholder
  }
];

export default function PlansDrawings() {
  const [mode, setMode] = useState<"construction" | "refurbish">("construction");
  const [index, setIndex] = useState(0);
  const plans = useMemo(() => initialPlans, []);
  const activePlan = plans[index] ?? plans[0];

  const go = (delta: number) => {
    setIndex((prev) => {
      const next = (prev + delta + plans.length) % plans.length;
      return next;
    });
  };

  return (
    <PhoneShell>
      <Sheet>
        <div className="flex h-full flex-col">
          <header className="flex items-center gap-10 rounded-b-[100px] border-b border-[#1f1f1f] bg-[#050505] px-24 py-16">
            <SheetTrigger asChild>
              <button type="button">
                <Avatar className="h-16 w-16 border-2 border-[#232323]">
                  <AvatarFallback>G</AvatarFallback>
                </Avatar>
              </button>
            </SheetTrigger>

            <div className="flex flex-col text-white">
              <span className="text-3xl font-semibold">Oh Hi, Guest!</span>
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Plans + Drawings</span>
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

          <div className="flex-1 overflow-y-auto px-24 pb-44">
            <div className="mx-auto w-full max-w-[980px]">
              <section className="mt-16 space-y-6">
                <h2 className="text-4xl font-bold tracking-tight text-white">Plans + Drawings</h2>
                <button
                  type="button"
                  className="flex h-[360px] w-full flex-col items-center justify-center rounded-[50px] border-2 border-dashed border-[#2a2a2a] bg-[#111] text-xl text-muted"
                >
                  <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#3a3a3a] text-5xl text-white">
                    +
                  </span>
                  Upload your Plan / Drawings here
                </button>
              </section>

              <section className="mt-20">
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-bold tracking-tight text-white">Uploaded Plans/Drawings</h2>
                  <div className="flex gap-4 text-2xl text-muted">
                    <button type="button" onClick={() => go(-1)} className="rounded-full border border-[#2a2a2a] px-4 py-1">‹</button>
                    <button type="button" onClick={() => go(1)} className="rounded-full border border-[#2a2a2a] px-4 py-1">›</button>
                  </div>
                </div>
                <Card className="mt-8 flex h-[520px] items-center justify-center overflow-hidden rounded-[46px] border border-[#2a2a2a] bg-[#101010]">
                  {activePlan?.src ? (
                    <img src={activePlan.src} alt={activePlan.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-[#1c1c1c]" />
                  )}
                </Card>
                <div className="mt-6 flex justify-center gap-3">
                  {plans.map((plan, dot) => (
                    <span
                      key={plan.id}
                      className={`h-3 w-3 rounded-full ${dot === index ? "bg-[var(--pill,#cfe0ad)]" : "bg-[#2a2a2a]"}`}
                    />
                  ))}
                </div>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Details</h2>
                <div className="mt-8 rounded-[50px] border border-[#2a2a2a] bg-[#0f0f0f] p-10">
                  <table className="w-full border-collapse text-xl text-muted">
                    <tbody>
                      {[
                        ["Title", activePlan?.title],
                        ["Date uploaded", activePlan?.date],
                        ["Category", activePlan?.category],
                        ["Typology", activePlan?.typology],
                        ["Local regulations", activePlan?.regulations],
                        ["Estimated time", activePlan?.estimate],
                        ["Project details", activePlan?.details],
                        ["Construction started at", activePlan?.startedAt],
                        ["Location", activePlan?.location],
                        ["Deadline", activePlan?.deadline]
                      ].map(([label, value]) => (
                        <tr key={label} className="border-t border-[#1f1f1f] first:border-t-0">
                          <td className="py-4 pr-8 text-left text-sm uppercase tracking-[0.35em] text-[#d4d4d4]">{label}</td>
                          <td className="py-4 text-right text-white">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>

          <BottomNav />
        </div>

        <SheetContent>
          <div className="space-y-10 text-2xl">
            {[
              "Your Subscription",
              "Hire a Contractor",
              "Privacy Policy",
              "News & Updates",
              "Visit Builtattic",
              "Settings"
            ].map((item) => (
              <p key={item} className="font-medium">
                {item}
              </p>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </PhoneShell>
  );
}
