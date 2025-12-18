import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BottomNav from "@/components/bottom-nav";
import PhoneShell from "@/components/phone-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AnimatedPage } from "@/components/AnimatedPage";
import { BudgetTrendChart } from "@/components/charts/BudgetTrendChart";
import { CategoryDonutChart } from "@/components/charts/CategoryDonutChart";
import { TrendingUp, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { useProjectStore, useBudgetStore, useScheduleStore, useTeamStore, useInventoryStore } from "@/store";
import { staggerContainer, listItem } from "@/lib/animations";

export default function Analytics() {
  const navigate = useNavigate();
  const mode = useProjectStore((state) => state.mode);
  const setMode = useProjectStore((state) => state.setMode);
  const project = useProjectStore((state) => state.project);

  const totalAllocated = useBudgetStore((state) => state.getTotalAllocated());
  const totalSpent = useBudgetStore((state) => state.getTotalSpent());
  const percentSpent = useBudgetStore((state) => state.getPercentSpent());
  const categories = useBudgetStore((state) => state.categories);
  const spendingHistory = useBudgetStore((state) => state.spendingHistory);

  const overallProgress = useScheduleStore((state) => state.getOverallProgress());
  const tasksByStatus = useScheduleStore((state) => state.getTasksByStatus());
  const upcomingMilestones = useScheduleStore((state) => state.getUpcomingMilestones());

  const activeMembersCount = useTeamStore((state) => state.getActiveMembersCount());
  const lowStockCount = useInventoryStore((state) => state.getLowStockCount());

  const menuItems = [
    { label: "Your Subscription", path: "/subscription" },
    { label: "Hire a Contractor", path: "/hire-contractor" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "News & Updates", path: "/news-updates" },
    { label: "Visit Builtattic", path: "/visit-builtattic" },
    { label: "Settings", path: "/settings" }
  ];

  // Prepare chart data
  const chartData = spendingHistory.slice(-30); // Last 30 days
  const categoryChartData = categories.map(cat => ({
    name: cat.name,
    value: cat.spent,
    color: cat.color
  }));

  // KPI data
  const kpis = [
    {
      id: 1,
      label: "Budget Spent",
      value: `${percentSpent}%`,
      subValue: `₹${(totalSpent / 1000).toFixed(0)}K / ₹${(totalAllocated / 1000).toFixed(0)}K`,
      icon: TrendingUp,
      color: "#cfe0ad"
    },
    {
      id: 2,
      label: "Project Progress",
      value: `${overallProgress}%`,
      subValue: `${tasksByStatus.completed} of ${tasksByStatus.completed + tasksByStatus.in_progress + tasksByStatus.pending} tasks done`,
      icon: CheckCircle2,
      color: "#4ade80"
    },
    {
      id: 3,
      label: "Team Size",
      value: activeMembersCount,
      subValue: "Active members",
      icon: Users,
      color: "#b8d4f1"
    },
    {
      id: 4,
      label: "Low Stock Items",
      value: lowStockCount,
      subValue: "Need reorder",
      icon: AlertCircle,
      color: "#f3c5a8"
    }
  ];

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
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Analytics Dashboard</span>
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
                {/* KPI Cards */}
                <section className="mt-16">
                  <h2 className="text-4xl font-bold tracking-tight text-white">Key Metrics</h2>
                  <motion.div
                    className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    {kpis.map((kpi) => (
                      <motion.div key={kpi.id} variants={listItem}>
                        <Card className="flex flex-col rounded-[34px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-8">
                          <div className="flex items-center justify-between">
                            <kpi.icon size={32} style={{ color: kpi.color }} strokeWidth={1.5} />
                          </div>
                          <div className="mt-6">
                            <div className="text-6xl font-black text-white">{kpi.value}</div>
                            <p className="mt-2 text-sm uppercase tracking-[0.3em] text-[#bdbdbd]">{kpi.label}</p>
                            <p className="mt-2 text-base text-[#8a8a8a]">{kpi.subValue}</p>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </section>

                {/* Budget Trend Chart */}
                <section className="mt-20">
                  <h2 className="text-4xl font-bold tracking-tight text-white">Budget Trend</h2>
                  <Card className="mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                    <div className="mb-6">
                      <h3 className="text-2xl font-semibold text-white">Spending Over Time</h3>
                      <p className="mt-2 text-lg text-[#bdbdbd]">Last 30 days expenditure tracking</p>
                    </div>
                    <BudgetTrendChart data={chartData} />
                  </Card>
                </section>

                {/* Category Breakdown Chart */}
                <section className="mt-20">
                  <h2 className="text-4xl font-bold tracking-tight text-white">Category Breakdown</h2>
                  <Card className="mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                    <div className="mb-6">
                      <h3 className="text-2xl font-semibold text-white">Spending by Category</h3>
                      <p className="mt-2 text-lg text-[#bdbdbd]">Distribution of expenses across categories</p>
                    </div>
                    <CategoryDonutChart data={categoryChartData} />
                  </Card>
                </section>

                {/* Upcoming Milestones */}
                <section className="mt-20">
                  <h2 className="text-4xl font-bold tracking-tight text-white">Upcoming Milestones</h2>
                  <motion.div
                    className="mt-8 space-y-4"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    {upcomingMilestones.map((milestone) => (
                      <motion.div key={milestone.id} variants={listItem}>
                        <Card className="border border-[#2a2a2a] bg-[#101010] p-8">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-2xl font-semibold text-white">{milestone.name}</h3>
                              <p className="mt-2 text-lg text-[#bdbdbd]">Target date: {milestone.date}</p>
                            </div>
                            <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
                              milestone.completed ? 'bg-[#4ade80]/20' : 'bg-[#6a6a6a]/20'
                            }`}>
                              {milestone.completed ? (
                                <CheckCircle2 size={32} className="text-[#4ade80]" />
                              ) : (
                                <AlertCircle size={32} className="text-[#6a6a6a]" />
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </section>

                {/* Project Summary */}
                <section className="mt-20">
                  <h2 className="text-4xl font-bold tracking-tight text-white">Project Summary</h2>
                  <Card className="mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      <div>
                        <h3 className="text-2xl font-semibold text-white">{project.name}</h3>
                        <p className="mt-2 text-lg text-[#bdbdbd]">{project.category}</p>
                        <div className="mt-6 space-y-4">
                          <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Start Date</p>
                            <p className="mt-1 text-xl text-white">{project.startDate}</p>
                          </div>
                          <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Target End Date</p>
                            <p className="mt-1 text-xl text-white">{project.targetEndDate}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="text-center">
                          <div className="text-9xl font-black text-[#cfe0ad]">{project.progress}%</div>
                          <p className="mt-4 text-2xl text-[#bdbdbd]">Overall Progress</p>
                        </div>
                      </div>
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
