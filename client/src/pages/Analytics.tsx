import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageLayout from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { BudgetTrendChart } from "@/components/charts/BudgetTrendChart";
import { CategoryDonutChart } from "@/components/charts/CategoryDonutChart";
import { TrendingUp, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { useBudgetStore, useScheduleStore, useTeamStore, useInventoryStore } from "@/store";
import { staggerContainer, listItem } from "@/lib/animations";
import { useProject } from "@/context/ProjectContext";
import { projectsApi } from "@/lib/api";

export default function Analytics() {
  const { currentProject } = useProject();
  const [stats, setStats] = useState<null | {
    stages: { total: number; completed: number; inProgress: number; pending: number };
    progress: number;
    budget: { estimated: number; spent: number; utilization: number };
    timeline: { startDate?: string; expectedEndDate?: string; daysRemaining?: number | null };
    metrics: { totalUploads: number; totalBills: number; completedStages: number };
  }>(null);
  const [statsError, setStatsError] = useState("");

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
  const budgetAllocated = stats?.budget.estimated ?? totalAllocated;
  const budgetSpent = stats?.budget.spent ?? totalSpent;
  const budgetPercent = stats?.budget.utilization ?? percentSpent;
  const progressValue = stats?.progress ?? overallProgress;
  const tasksTotal = tasksByStatus.completed + tasksByStatus.in_progress + tasksByStatus.pending;
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  const summaryStart = stats?.timeline.startDate || currentProject?.startDate || "";
  const summaryEnd = stats?.timeline.expectedEndDate || currentProject?.endDate || "";
  const summaryProgress = currentProject?.progress?.percentage ?? progressValue ?? 0;

  useEffect(() => {
    const loadStats = async () => {
      if (!currentProject?._id) {
        setStats(null);
        setStatsError("");
        return;
      }
      try {
        const response = await projectsApi.getStats(currentProject._id);
        if (response.success && response.data) {
          setStats(response.data);
          setStatsError("");
        } else {
          setStatsError(response.error || "Failed to load project stats");
        }
      } catch (error) {
        setStatsError(error instanceof Error ? error.message : "Failed to load project stats");
      }
    };

    loadStats();
  }, [currentProject?._id]);

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
      value: `${budgetPercent}%`,
      subValue: `${formatCurrency(budgetSpent)} / ${formatCurrency(budgetAllocated)}`,
      icon: TrendingUp,
      color: "#cfe0ad"
    },
    {
      id: 2,
      label: "Project Progress",
      value: `${progressValue}%`,
      subValue: tasksTotal > 0
        ? `${tasksByStatus.completed} of ${tasksTotal} tasks done`
        : `${stats?.stages.completed || 0} of ${stats?.stages.total || 0} stages done`,
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
    <PageLayout
      title="Analytics Dashboard"
      contentClassName="px-4 xs:px-5 sm:px-6 md:px-10 lg:px-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        {/* KPI Cards */}
        <section className="mt-8 xs:mt-12 sm:mt-16">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Key Metrics</h2>
          {!currentProject && (
            <Card className="mt-4 border border-[#242424] bg-[#101010] p-4 text-sm xs:text-base text-[#bdbdbd]">
              Select or create a project to view analytics.
            </Card>
          )}
          {statsError && (
            <Card className="mt-4 border border-red-500/40 bg-red-500/10 p-4 text-sm xs:text-base text-red-200">
              {statsError}
            </Card>
          )}
          <motion.div
            className="mt-4 xs:mt-6 sm:mt-8 grid grid-cols-2 gap-3 xs:gap-4 sm:gap-6 lg:grid-cols-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {kpis.map((kpi) => (
              <motion.div key={kpi.id} variants={listItem}>
                <Card className="flex flex-col rounded-[20px] xs:rounded-[28px] sm:rounded-[34px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-4 xs:p-5 sm:p-8">
                  <div className="flex items-center justify-between">
                    <kpi.icon size={24} style={{ color: kpi.color }} strokeWidth={1.5} className="xs:w-7 xs:h-7 sm:w-8 sm:h-8" />
                  </div>
                  <div className="mt-3 xs:mt-4 sm:mt-6">
                    <div className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black text-white">{kpi.value}</div>
                    <p className="mt-1 xs:mt-2 text-xs xs:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#bdbdbd]">{kpi.label}</p>
                    <p className="mt-1 xs:mt-2 text-xs xs:text-sm sm:text-base text-[#8a8a8a] truncate">{kpi.subValue}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Budget Trend Chart */}
        <section className="mt-12 xs:mt-16 sm:mt-20">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Budget Trend</h2>
          <Card className="mt-4 xs:mt-6 sm:mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-4 xs:p-6 sm:p-10">
            <div className="mb-4 xs:mb-6">
              <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold text-white">Spending Over Time</h3>
              <p className="mt-1 xs:mt-2 text-sm xs:text-base sm:text-lg text-[#bdbdbd]">Last 30 days expenditure tracking</p>
            </div>
            <div className="h-[200px] xs:h-[250px] sm:h-[300px]">
              <BudgetTrendChart data={chartData} />
            </div>
          </Card>
        </section>

        {/* Category Breakdown Chart */}
        <section className="mt-12 xs:mt-16 sm:mt-20">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Category Breakdown</h2>
          <Card className="mt-4 xs:mt-6 sm:mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-4 xs:p-6 sm:p-10">
            <div className="mb-4 xs:mb-6">
              <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold text-white">Spending by Category</h3>
              <p className="mt-1 xs:mt-2 text-sm xs:text-base sm:text-lg text-[#bdbdbd]">Distribution of expenses across categories</p>
            </div>
            <div className="h-[250px] xs:h-[300px] sm:h-[350px]">
              <CategoryDonutChart data={categoryChartData} />
            </div>
          </Card>
        </section>

        {/* Upcoming Milestones */}
        <section className="mt-12 xs:mt-16 sm:mt-20">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Upcoming Milestones</h2>
          <motion.div
            className="mt-4 xs:mt-6 sm:mt-8 space-y-3 xs:space-y-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {upcomingMilestones.length === 0 && (
              <Card className="border border-[#2a2a2a] bg-[#101010] p-4 xs:p-6 text-sm xs:text-base text-[#bdbdbd]">
                No milestones scheduled yet.
              </Card>
            )}
            {upcomingMilestones.map((milestone) => (
              <motion.div key={milestone.id} variants={listItem}>
                <Card className="border border-[#2a2a2a] bg-[#101010] p-4 xs:p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold text-white truncate">{milestone.name}</h3>
                      <p className="mt-1 xs:mt-2 text-sm xs:text-base sm:text-lg text-[#bdbdbd]">Target date: {milestone.date}</p>
                    </div>
                    <div className={`flex h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full shrink-0 ${
                      milestone.completed ? 'bg-[#4ade80]/20' : 'bg-[#6a6a6a]/20'
                    }`}>
                      {milestone.completed ? (
                        <CheckCircle2 size={24} className="text-[#4ade80] xs:w-7 xs:h-7 sm:w-8 sm:h-8" />
                      ) : (
                        <AlertCircle size={24} className="text-[#6a6a6a] xs:w-7 xs:h-7 sm:w-8 sm:h-8" />
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Project Summary */}
        <section className="mt-12 xs:mt-16 sm:mt-20">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Project Summary</h2>
          <Card className="mt-4 xs:mt-6 sm:mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-4 xs:p-6 sm:p-10">
            <div className="grid grid-cols-1 gap-6 xs:gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold text-white">
                  {currentProject?.name || "Select a project"}
                </h3>
                <p className="mt-1 xs:mt-2 text-sm xs:text-base sm:text-lg text-[#bdbdbd]">
                  {currentProject?.type || currentProject?.status || "Project overview"}
                </p>
                <div className="mt-4 xs:mt-6 space-y-3 xs:space-y-4">
                  <div>
                    <p className="text-xs xs:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Start Date</p>
                    <p className="mt-1 text-base xs:text-lg sm:text-xl text-white">
                      {summaryStart ? new Date(summaryStart).toLocaleDateString() : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs xs:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Target End Date</p>
                    <p className="mt-1 text-base xs:text-lg sm:text-xl text-white">
                      {summaryEnd ? new Date(summaryEnd).toLocaleDateString() : "Not set"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-center">
                  <div className="text-6xl xs:text-7xl sm:text-8xl lg:text-9xl font-black text-[#cfe0ad]">
                    {Math.round(summaryProgress)}%
                  </div>
                  <p className="mt-2 xs:mt-4 text-base xs:text-lg sm:text-2xl text-[#bdbdbd]">Overall Progress</p>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </PageLayout>
  );
}
