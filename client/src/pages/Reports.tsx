import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BottomNav from "@/components/bottom-nav";
import PhoneShell from "@/components/phone-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AnimatedPage } from "@/components/AnimatedPage";
import { FileText, Download, FileBarChart, TrendingUp, Users, Package } from "lucide-react";
import { useProjectStore, useReportStore } from "@/store";
import { staggerContainer, listItem } from "@/lib/animations";

export default function Reports() {
  const navigate = useNavigate();
  const mode = useProjectStore((state) => state.mode);
  const setMode = useProjectStore((state) => state.setMode);
  const reports = useReportStore((state) => state.reports);
  const reportTypes = useReportStore((state) => state.getReportTypes());
  const recentReports = useReportStore((state) => state.getRecentReports());

  const menuItems = [
    { label: "Your Subscription", path: "/subscription" },
    { label: "Hire a Contractor", path: "/hire-contractor" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "News & Updates", path: "/news-updates" },
    { label: "Visit Builtattic", path: "/visit-builtattic" },
    { label: "Settings", path: "/settings" }
  ];

  const typeIcons = {
    budget: TrendingUp,
    progress: FileBarChart,
    contractor: Users,
    inventory: Package,
    weekly: FileText
  };

  return (
    <PhoneShell>
      <Sheet>
        <div className="flex h-full flex-col">
          <header className="flex flex-wrap items-center gap-6 rounded-b-[60px] border-b border-[#1f1f1f] bg-[#050505] px-6 py-10 md:flex-nowrap md:px-10 lg:px-24 lg:py-16">
            <SheetTrigger asChild>
              <button type="button">
                <Avatar className="h-16 w-16 border-2 border-[#232323]">
                  <AvatarFallback>G</AvatarFallback>
                </Avatar>
              </button>
            </SheetTrigger>

            <div className="flex flex-col text-white">
              <span className="text-3xl font-semibold">Oh Hi, Guest!</span>
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Reports</span>
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

          <div className="flex-1 overflow-y-auto px-6 md:px-10 lg:px-24 pb-32">
            <AnimatedPage>
              <div className="mx-auto w-full max-w-6xl">
                {/* Report Templates */}
                <section className="mt-16">
                  <h2 className="text-4xl font-bold tracking-tight text-white">Report Templates</h2>
                  <p className="mt-4 text-xl text-[#bdbdbd]">Generate comprehensive reports for your project</p>
                  <motion.div
                    className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    {reportTypes.map((template) => {
                      const Icon = typeIcons[template.type];
                      return (
                        <motion.div key={template.type} variants={listItem}>
                          <Card className="flex flex-col rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-8 transition hover:border-[#cfe0ad]">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#cfe0ad]/10">
                              <Icon size={32} className="text-[#cfe0ad]" strokeWidth={1.5} />
                            </div>
                            <h3 className="mt-6 text-2xl font-semibold text-white">{template.name}</h3>
                            <p className="mt-3 text-base text-[#bdbdbd] flex-1">{template.description}</p>
                            <button className="mt-6 flex items-center justify-center gap-2 rounded-full border border-[#cfe0ad] bg-[#cfe0ad]/10 px-6 py-3 text-lg font-semibold text-[#cfe0ad] transition hover:bg-[#cfe0ad] hover:text-black">
                              <FileText size={20} />
                              Generate Report
                            </button>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </section>

                {/* Recent Reports */}
                <section className="mt-20">
                  <h2 className="text-4xl font-bold tracking-tight text-white">Recent Reports</h2>
                  <motion.div
                    className="mt-8 space-y-4"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    {recentReports.map((report) => {
                      const Icon = typeIcons[report.type];
                      return (
                        <motion.div key={report.id} variants={listItem}>
                          <Card className="border border-[#2a2a2a] bg-[#101010] p-8 transition hover:border-[#3a3a3a]">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#b8d4f1]/10">
                                  <Icon size={24} className="text-[#b8d4f1]" strokeWidth={1.5} />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-xl font-semibold text-white">{report.name}</h3>
                                  <div className="mt-1 flex items-center gap-4 text-sm text-[#8a8a8a]">
                                    <span className="uppercase tracking-[0.2em]">{report.type}</span>
                                    <span>•</span>
                                    <span>Generated on {report.generatedDate}</span>
                                  </div>
                                  {report.description && (
                                    <p className="mt-2 text-base text-[#bdbdbd]">{report.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <button className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#2a2a2a] hover:border-[#cfe0ad] transition">
                                  <FileText size={20} className="text-white" />
                                </button>
                                <button className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#2a2a2a] hover:border-[#cfe0ad] transition">
                                  <Download size={20} className="text-white" />
                                </button>
                              </div>
                            </div>

                            {/* Show some data preview */}
                            {report.data && (
                              <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                  {Object.entries(report.data).slice(0, 4).map(([key, value]) => (
                                    <div key={key}>
                                      <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">{key}</p>
                                      <p className="mt-1 text-xl font-semibold text-white">{String(value)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </section>

                {/* Export Options */}
                <section className="mt-20">
                  <h2 className="text-4xl font-bold tracking-tight text-white">Export Options</h2>
                  <Card className="mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <button className="flex items-center gap-4 rounded-[24px] border border-[#2a2a2a] bg-[#0c0c0c] p-8 transition hover:border-[#cfe0ad]">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#f87171]/10">
                          <FileText size={32} className="text-[#f87171]" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-2xl font-semibold text-white">Export as PDF</h3>
                          <p className="mt-1 text-base text-[#8a8a8a]">Professional format</p>
                        </div>
                      </button>

                      <button className="flex items-center gap-4 rounded-[24px] border border-[#2a2a2a] bg-[#0c0c0c] p-8 transition hover:border-[#cfe0ad]">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#4ade80]/10">
                          <FileBarChart size={32} className="text-[#4ade80]" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-2xl font-semibold text-white">Export as Excel</h3>
                          <p className="mt-1 text-base text-[#8a8a8a]">Data analysis ready</p>
                        </div>
                      </button>
                    </div>
                  </Card>
                </section>
              </div>
            </AnimatedPage>
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
