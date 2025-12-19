import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/bottom-nav";
import PhoneShell from "@/components/phone-shell";
import PageHeader from "@/components/page-header";
import SideMenu from "@/components/side-menu";
import ProgressRing from "@/components/progress-ring";
import { Fab } from "@/components/fab";
import NotificationsSheet from "@/components/notifications-sheet";
import { Card } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { useNotifications } from "@/hooks/use-notifications";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useSwipe } from "@/hooks/use-swipe";
import { useAuth } from "@/context/AuthContext";
import { useProject } from "@/context/ProjectContext";
import { useBudgetStore, useScheduleStore, useTeamStore } from "@/store";
import {
  Skeleton,
  SkeletonStageSlider,
  SkeletonProgressStats,
  SkeletonInsightCard,
  SkeletonResourceCard
} from "@/components/ui/skeleton";
import {
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Droplets,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  Camera,
  MessageSquare,
  Package
} from "lucide-react";

import stageImg from "../assets/placeholders/stage-ideation.png";
import insightWeather from "../assets/placeholders/insight-weather.png";
import insightFact from "../assets/placeholders/insight-fact.png";
import resourceOne from "../assets/placeholders/resource-1.jpg";
import resourceTwo from "../assets/placeholders/resource-2.jpg";
import resourceThree from "../assets/placeholders/resource-3.jpg";

const stageSlides = [
  {
    title: "IDEATION STAGE",
    copy: "App downloaded, project created, category locked.",
    image: stageImg
  },
  {
    title: "BUDGET STAGE",
    copy: "Finalize the bill of quantities so every team shares the same spend plan.",
    image: stageImg
  },
  {
    title: "SITE PREP",
    copy: "Upload surveys and confirm contractor availability to begin excavation.",
    image: stageImg
  }
];

const insightCards = [
  {
    id: "weather",
    badge: "Bhopal | 25C",
    title: "Weather insight #1",
    text: "Curing slab of upper floor should be done today to get optimal sunlight.",
    image: insightWeather
  },
  {
    id: "fact",
    badge: "Did you know?",
    title: "Your site progress indicates you don't need more masons.",
    text: "Stick with the current crew to avoid budget overruns.",
    image: insightFact
  }
];

const recentActivities = [
  { id: 1, type: "upload", user: "Rajesh K.", action: "uploaded 3 site photos", time: "2 min ago", icon: Camera },
  { id: 2, type: "message", user: "Suresh V.", action: "sent a message in Contractor Chat", time: "15 min ago", icon: MessageSquare },
  { id: 3, type: "document", user: "You", action: "added Floor Plan Rev-02", time: "1 hour ago", icon: FileText },
  { id: 4, type: "inventory", user: "Amit S.", action: "updated cement inventory", time: "2 hours ago", icon: Package },
  { id: 5, type: "task", user: "You", action: "completed Foundation inspection", time: "3 hours ago", icon: CheckCircle2 }
];

const mockNotifications = [
  { id: 1, title: "Budget Alert", message: "Cement costs exceeded estimate by 5%", time: "5m", unread: true },
  { id: 2, title: "New Message", message: "Rajesh Kumar sent you a message", time: "20m", unread: true },
  { id: 3, title: "Task Completed", message: "Foundation work marked complete", time: "1h", unread: false },
  { id: 4, title: "Weather Warning", message: "Rain expected tomorrow afternoon", time: "2h", unread: false }
];

const weatherData = {
  location: "Bhopal, MP",
  temp: 28,
  condition: "Partly Cloudy",
  humidity: 45,
  wind: 12,
  forecast: [
    { day: "Today", high: 32, low: 22, icon: Sun },
    { day: "Tue", high: 30, low: 21, icon: Cloud },
    { day: "Wed", high: 28, low: 20, icon: CloudRain },
    { day: "Thu", high: 31, low: 22, icon: Sun }
  ]
};

export default function Home() {
  const [stageIndex, setStageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user } = useAuth();
  const { currentProject } = useProject();

  // Select raw state to avoid infinite loops from calling getters in selectors
  const budgetCategories = useBudgetStore((state) => state.categories);
  const schedulePhases = useScheduleStore((state) => state.phases);
  const teamMembers = useTeamStore((state) => state.members);

  // Compute values using useMemo to prevent recalculation on every render
  const totalAllocated = useMemo(() =>
    budgetCategories.reduce((sum, cat) => sum + cat.allocated, 0),
    [budgetCategories]
  );
  const totalSpent = useMemo(() =>
    budgetCategories.reduce((sum, cat) => sum + cat.spent, 0),
    [budgetCategories]
  );
  const tasksByStatus = useMemo(() => {
    const allTasks = schedulePhases.flatMap((phase) => phase.tasks);
    return {
      completed: allTasks.filter((t) => t.status === 'completed').length,
      in_progress: allTasks.filter((t) => t.status === 'in_progress').length,
      pending: allTasks.filter((t) => t.status === 'pending').length,
    };
  }, [schedulePhases]);
  const overallProgress = useMemo(() => {
    if (schedulePhases.length === 0) return 0;
    const total = schedulePhases.reduce((sum, phase) => sum + (phase.progress || 0), 0);
    return Math.round(total / schedulePhases.length);
  }, [schedulePhases]);
  const activeMembersCount = useMemo(() =>
    teamMembers.filter((m) => m.status === 'active').length,
    [teamMembers]
  );

  const navigate = useNavigate();
  const currentStage = stageSlides[stageIndex];
  const { showToast } = useNotifications();
  const progressPercent = currentProject?.progress?.percentage ?? overallProgress;
  const tasksTotal = tasksByStatus.completed + tasksByStatus.in_progress + tasksByStatus.pending;
  const deadline = currentProject?.timeline?.expectedEndDate || currentProject?.endDate;
  const daysLeft = deadline
    ? Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const quickStats = [
    {
      label: "Budget Spent",
      value: formatCurrency(totalSpent),
      subtext: `of ${formatCurrency(totalAllocated)}`,
      icon: DollarSign,
      color: "#cfe0ad",
    },
    {
      label: "Tasks Done",
      value: `${tasksByStatus.completed}`,
      subtext: `of ${tasksTotal} total`,
      icon: CheckCircle2,
      color: "#a8d5ba",
    },
    {
      label: "Days Left",
      value: daysLeft !== null ? `${daysLeft}` : "TBD",
      subtext: "until deadline",
      icon: Calendar,
      color: "#f0c674",
    },
    {
      label: "Team Size",
      value: `${activeMembersCount}`,
      subtext: "active members",
      icon: Users,
      color: "#8fbcbb",
    },
  ];

  const unreadCount = mockNotifications.filter(n => n.unread).length;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);


  const { bind: swipeStage } = useSwipe({
    onSwipedLeft: () => cycleStage(1),
    onSwipedRight: () => cycleStage(-1)
  });

  const { isRefreshing, pullDistance, bind: pullBind } = usePullToRefresh(async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    showToast({ type: "success", message: "Feed refreshed" });
  });

  const cycleStage = (delta: number) => {
    setStageIndex((prev) => {
      const total = stageSlides.length;
      return (prev + delta + total) % total;
    });
  };

  const resources = useMemo(
    () => [
      { title: "Plans + Drawings", img: resourceOne, onClick: () => navigate("/plans-drawings") },
      { title: "Site Details", img: resourceTwo, onClick: () => navigate("/site-details") },
      { title: "Contractor Chat", img: resourceThree, onClick: () => navigate("/contractor-chat") },
      { title: "Site Gallery", img: resourceTwo, onClick: () => navigate("/site-gallery") },
      { title: "Schedule", img: resourceOne, onClick: () => navigate("/schedule") },
      { title: "Customer Care", img: resourceThree, onClick: () => navigate("/customer-care") }
    ],
    [navigate]
  );

  return (
    <PhoneShell>
      <Sheet>
        <div className="flex h-full flex-col">
          {/* Header */}
          <PageHeader
            showNotifications
            notificationCount={unreadCount}
            onNotificationClick={() => setNotificationsOpen(true)}
          />

          {/* Notifications Sheet (mobile-friendly) */}
          <NotificationsSheet
            open={notificationsOpen}
            onOpenChange={setNotificationsOpen}
            notifications={mockNotifications}
          />

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto px-3 xs:px-4 sm:px-6 md:px-10 lg:px-24 pb-20 xs:pb-24 sm:pb-28 md:pb-32 touch-scroll" {...pullBind}>
            <div className="mx-auto w-full max-w-6xl">
              {/* Pull to Refresh Indicator */}
              <div
                className="flex items-center justify-center text-xs xs:text-sm font-semibold text-[#cfe0ad] transition"
                style={{ opacity: pullDistance > 0 ? 1 : 0, height: pullDistance > 0 ? 24 : 0 }}
              >
                {isRefreshing ? "Refreshing..." : "Pull to refresh"}
              </div>

              {/* Weather Widget */}
              <section className="mt-4 xs:mt-6 sm:mt-8">
                {isLoading ? (
                  <Skeleton className="h-28 xs:h-32 sm:h-36 w-full rounded-2xl" />
                ) : (
                  <Card className="border border-[#242424] bg-gradient-to-br from-[#1a2a1a] to-[#0a150a] p-3 xs:p-4 sm:p-5 rounded-2xl xs:rounded-3xl overflow-hidden animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 xs:gap-4">
                        <div className="p-2 xs:p-3 rounded-full bg-[#cfe0ad]/10">
                          <Sun className="h-6 w-6 xs:h-8 xs:w-8 text-[#cfe0ad]" />
                        </div>
                        <div>
                          <p className="text-[0.65rem] xs:text-xs text-[#888] uppercase tracking-wider">{weatherData.location}</p>
                          <p className="text-2xl xs:text-3xl sm:text-4xl font-bold text-white">{weatherData.temp}C</p>
                          <p className="text-xs xs:text-sm text-[#aaa]">{weatherData.condition}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 xs:gap-2 text-right">
                        <div className="flex items-center gap-1 xs:gap-2 text-[0.65rem] xs:text-xs text-[#888]">
                          <Droplets className="h-3 w-3 xs:h-4 xs:w-4" />
                          <span>{weatherData.humidity}%</span>
                        </div>
                        <div className="flex items-center gap-1 xs:gap-2 text-[0.65rem] xs:text-xs text-[#888]">
                          <Wind className="h-3 w-3 xs:h-4 xs:w-4" />
                          <span>{weatherData.wind} km/h</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 xs:mt-4 pt-3 xs:pt-4 border-t border-[#2a2a2a] flex justify-between">
                      {weatherData.forecast.map((day) => (
                        <div key={day.day} className="text-center">
                          <p className="text-[0.6rem] xs:text-xs text-[#888]">{day.day}</p>
                          <day.icon className="h-4 w-4 xs:h-5 xs:w-5 mx-auto my-1 text-[#cfe0ad]" />
                          <p className="text-[0.6rem] xs:text-xs text-white">{day.high}C</p>
                          <p className="text-[0.55rem] xs:text-[0.65rem] text-[#666]">{day.low}C</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </section>

              {/* Quick Stats */}
              <section className="mt-4 xs:mt-6 sm:mt-8">
                <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white mb-3 xs:mb-4">Quick Stats</h2>
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-24 xs:h-28 sm:h-32 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4 md:grid-cols-4">
                    {quickStats.map((stat, idx) => (
                      <Card
                        key={stat.label}
                        className={`border border-[#242424] bg-[#101010] p-3 xs:p-4 rounded-xl xs:rounded-2xl animate-fade-in`}
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <stat.icon className="h-4 w-4 xs:h-5 xs:w-5" style={{ color: stat.color }} />
                          <span className="text-[0.6rem] xs:text-xs text-[#888] uppercase tracking-wider">{stat.label}</span>
                        </div>
                        <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                        <p className="text-[0.6rem] xs:text-xs text-[#666]">{stat.subtext}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </section>

              {/* Current Progress Section */}
              <section className="mt-4 xs:mt-6 sm:mt-10 md:mt-12">
                <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Current Progress</h2>
                <Card className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-3 xs:p-4 sm:p-6 md:p-8 lg:p-10">
                  {isLoading ? (
                    <div className="grid grid-cols-1 gap-3 xs:gap-4 sm:gap-6 md:gap-8 lg:grid-cols-2">
                      <SkeletonStageSlider />
                      <SkeletonProgressStats />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 xs:gap-4 sm:gap-6 md:gap-8 lg:grid-cols-2 animate-fade-in">
                      {/* Stage Slider */}
                      <div
                        className="flex flex-col rounded-[16px] xs:rounded-[20px] sm:rounded-[30px] md:rounded-[40px] border border-[#1f1f1f] bg-[#050505] p-3 xs:p-4 sm:p-6 md:p-8 lg:p-10"
                        {...swipeStage()}
                      >
                        <div className="flex items-center justify-between text-[#bdbdbd]">
                          <button
                            type="button"
                            onClick={() => cycleStage(-1)}
                            className="flex h-7 w-7 xs:h-8 xs:w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-full border border-[#2a2a2a] text-base xs:text-lg sm:text-xl md:text-2xl active:scale-95 transition"
                            aria-label="Previous stage"
                          >
                            {'<'}
                          </button>
                          <span className="text-[0.55rem] xs:text-[0.6rem] sm:text-xs tracking-[0.15em] xs:tracking-[0.25em] sm:tracking-[0.4em] text-[#dcdcdc] text-center px-1 xs:px-2">{currentStage.title}</span>
                          <button
                            type="button"
                            onClick={() => cycleStage(1)}
                            className="flex h-7 w-7 xs:h-8 xs:w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-full border border-[#2a2a2a] text-base xs:text-lg sm:text-xl md:text-2xl active:scale-95 transition"
                            aria-label="Next stage"
                          >
                            {'>'}
                          </button>
                        </div>

                        <p className="mt-2 xs:mt-3 sm:mt-4 md:mt-6 text-center text-xs xs:text-sm sm:text-base md:text-lg text-[#cacaca]">{currentStage.copy}</p>

                        <div className="mt-4 xs:mt-5 sm:mt-8 md:mt-10 flex flex-1 items-center justify-center">
                          {currentStage.image ? (
                            <img
                              src={currentStage.image}
                              alt="Stage"
                              className="h-28 w-28 xs:h-36 xs:w-36 sm:h-48 sm:w-48 md:h-60 md:w-60 lg:h-72 lg:w-72 rounded-full border border-[#2f2f2f] object-cover"
                            />
                          ) : (
                            <div className="h-28 w-28 xs:h-36 xs:w-36 sm:h-48 sm:w-48 md:h-60 md:w-60 lg:h-72 lg:w-72 rounded-full bg-[#1b1b1b]" />
                          )}
                        </div>

                        <div className="mt-4 xs:mt-5 sm:mt-8 md:mt-10 flex justify-center gap-1.5 xs:gap-2 sm:gap-3">
                          {stageSlides.map((slide, idx) => (
                            <span
                              key={slide.title}
                              className={`h-1.5 w-1.5 xs:h-2 xs:w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 rounded-full transition ${idx === stageIndex ? "bg-[var(--pill,#cfe0ad)]" : "bg-[#2a2a2a]"}`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Progress Stats */}
                      <div className="flex flex-col rounded-[16px] xs:rounded-[24px] sm:rounded-[40px] md:rounded-[50px] lg:rounded-[60px] border border-[#1f1f1f] bg-[#050505] p-3 xs:p-4 sm:p-6 md:p-8 lg:p-10">
                        <div className="flex flex-col xs:flex-row items-center gap-3 xs:gap-4 sm:gap-6 md:gap-10">
                          <div className="shrink-0">
                            <ProgressRing value={progressPercent} size={80} strokeWidth={8} className="xs:hidden" />
                            <ProgressRing value={progressPercent} size={100} strokeWidth={10} className="hidden xs:block sm:hidden" />
                            <ProgressRing value={progressPercent} size={140} strokeWidth={12} className="hidden sm:block md:hidden" />
                            <ProgressRing value={progressPercent} size={180} strokeWidth={14} className="hidden md:block lg:hidden" />
                            <ProgressRing value={progressPercent} size={240} strokeWidth={18} className="hidden lg:block" />
                          </div>
                          <div className="text-xs xs:text-sm sm:text-base md:text-xl lg:text-2xl text-[#d9dfcd] text-center xs:text-left">
                            <p>
                              {tasksTotal > 0
                                ? `${tasksByStatus.completed} of ${tasksTotal} tasks completed`
                                : "Add tasks to start tracking progress"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 xs:mt-4 sm:mt-6 text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-[140px] xl:text-[160px] font-black leading-none text-white text-center xs:text-left">
                          {Math.round(progressPercent)}%
                        </div>
                        <p className="text-[0.65rem] xs:text-xs sm:text-sm md:text-lg lg:text-xl text-[#b9b9b9] text-center xs:text-left">
                          {currentProject ? "Project progress updates in real time." : "Select a project to begin tracking."}
                        </p>

                        <div className="mt-4 xs:mt-5 sm:mt-8 md:mt-10 h-3 xs:h-4 sm:h-5 md:h-6 rounded-full border border-[#2a2a2a] bg-[#0d0d0d]">
                          <div
                            className="h-full rounded-full bg-[var(--pill,#cfe0ad)]"
                            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </section>

              {/* Recent Activity Feed */}
              <section className="mt-4 xs:mt-6 sm:mt-10 md:mt-12">
                <div className="flex items-center justify-between mb-3 xs:mb-4">
                  <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white">Recent Activity</h2>
                  <button className="text-[0.65rem] xs:text-xs text-[#cfe0ad] font-semibold hover:underline">
                    View All
                  </button>
                </div>
                {isLoading ? (
                  <div className="space-y-2 xs:space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 xs:h-18 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <Card className="border border-[#242424] bg-[#101010] rounded-xl xs:rounded-2xl overflow-hidden animate-fade-in">
                    {recentActivities.map((activity, idx) => (
                      <div
                        key={activity.id}
                        className={`flex items-center gap-3 p-3 xs:p-4 ${idx !== recentActivities.length - 1 ? "border-b border-[#1a1a1a]" : ""} hover:bg-[#151515] transition cursor-pointer`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="p-2 rounded-full bg-[#1a1a1a] shrink-0">
                          <activity.icon className="h-4 w-4 xs:h-5 xs:w-5 text-[#cfe0ad]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs xs:text-sm text-white">
                            <span className="font-semibold">{activity.user}</span>{" "}
                            <span className="text-[#888]">{activity.action}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[#666] shrink-0">
                          <Clock className="h-3 w-3" />
                          <span className="text-[0.6rem] xs:text-xs">{activity.time}</span>
                        </div>
                      </div>
                    ))}
                  </Card>
                )}
              </section>

              {/* Daily Insights Section */}
              <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-16">
                <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Daily Insights</h2>
                {isLoading ? (
                  <div className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 gap-3 xs:gap-4 sm:gap-6 md:grid-cols-2">
                    <SkeletonInsightCard />
                    <SkeletonInsightCard />
                  </div>
                ) : (
                  <div className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 gap-3 xs:gap-4 sm:gap-6 md:grid-cols-2">
                    {insightCards.map((card, idx) => (
                      <div
                        key={card.id}
                        className="flex h-auto min-h-[260px] xs:min-h-[300px] sm:min-h-[400px] md:min-h-[500px] lg:h-[600px] flex-col rounded-[16px] xs:rounded-[24px] sm:rounded-[34px] md:rounded-[46px] border border-[#1f1f1f] bg-[#101010] p-4 xs:p-5 sm:p-7 md:p-10 text-white animate-fade-in"
                        style={{ animationDelay: `${idx * 150}ms` }}
                      >
                        <p className="text-[0.55rem] xs:text-[0.6rem] sm:text-xs md:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] sm:tracking-[0.4em] text-[#cfd5f3]">{card.badge}</p>
                        <h3 className="mt-2 xs:mt-3 sm:mt-4 md:mt-6 text-sm xs:text-base sm:text-xl md:text-2xl lg:text-3xl font-semibold leading-tight">{card.title}</h3>
                        <p className="mt-1.5 xs:mt-2 sm:mt-3 md:mt-4 text-[0.65rem] xs:text-xs sm:text-sm md:text-base lg:text-lg text-[#d7d7d7]">{card.text}</p>
                        <div className="mt-auto pt-3 xs:pt-4 sm:pt-5 md:pt-6 overflow-hidden rounded-[12px] xs:rounded-[16px] sm:rounded-[24px] md:rounded-[32px] border border-[#242424]">
                          {card.image ? (
                            <img src={card.image} alt={card.title} className="h-24 xs:h-32 sm:h-44 md:h-56 lg:h-72 w-full object-cover" />
                          ) : (
                            <div className="h-24 xs:h-32 sm:h-44 md:h-56 lg:h-72 w-full bg-[#1b1b1b]" />
                          )}
                        </div>
                        <div className="mt-3 xs:mt-4 sm:mt-5 md:mt-6 flex justify-center gap-1 xs:gap-1.5 sm:gap-2">
                          {[0, 1, 2].map((dot) => (
                            <span
                              key={`${card.id}-${dot}`}
                              className={`h-1 w-1 xs:h-1.5 xs:w-1.5 sm:h-2 sm:w-2 rounded-full ${dot === 0 ? "bg-[var(--pill,#cfe0ad)]" : "bg-[#2a2a2a]"}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Resources Section */}
              <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-16">
                <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Resources</h2>
                {isLoading ? (
                  <div className="mt-3 xs:mt-4 sm:mt-6 md:mt-10 grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <SkeletonResourceCard key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 xs:mt-4 sm:mt-6 md:mt-10 grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3">
                    {resources.map((resource, idx) => (
                      <button
                        key={resource.title}
                        type="button"
                        onClick={resource.onClick}
                        className="relative h-[120px] xs:h-[150px] sm:h-[220px] md:h-[300px] lg:h-[380px] xl:h-[430px] overflow-hidden rounded-[12px] xs:rounded-[16px] sm:rounded-[24px] md:rounded-[34px] border border-[#2a2a2a] bg-[#151515] text-left shadow-[0_4px_16px_rgba(0,0,0,0.2)] sm:shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition active:scale-[0.98] hover:scale-[1.01] animate-fade-in"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        {resource.img ? (
                          <img src={resource.img} alt={resource.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-[#1b1b1b]" />
                        )}
                        <span className="absolute inset-x-2 xs:inset-x-3 sm:inset-x-4 md:inset-x-6 bottom-2 xs:bottom-3 sm:bottom-5 md:bottom-8 text-[0.65rem] xs:text-xs sm:text-base md:text-xl lg:text-2xl xl:text-3xl font-semibold text-white drop-shadow-lg line-clamp-2">
                          {resource.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>

          <Fab label="Quick add" onClick={() => showToast({ type: "info", message: "Quick action", description: "Add a new update" })}>
            +
          </Fab>
          <BottomNav />
        </div>

        {/* Side Menu */}
        <SideMenu />
      </Sheet>
    </PhoneShell>
  );
}
