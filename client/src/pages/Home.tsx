import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneShell from "@/components/phone-shell";
import PageHeader from "@/components/page-header";
import SideMenu from "@/components/side-menu";
import ProgressRing from "@/components/progress-ring";
import { Fab } from "@/components/fab";
import NotificationsSheet from "@/components/notifications-sheet";
import QuickAddSheet from "@/components/quick-add-sheet";
import { Card } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { useNotifications } from "@/hooks/use-notifications";
import { usePersistentNotifications } from "@/context/NotificationContext";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useSwipe } from "@/hooks/use-swipe";
import { useProject } from "@/context/ProjectContext";
import { useScheduleStore } from "@/store";
import { useWeather } from "@/hooks/use-weather";
import { useProjectInsights, getFormattedDate, getWeatherIcon } from "@/hooks/use-project-insights";
import {
  Skeleton,
  SkeletonStageSlider,
  SkeletonProgressStats,
  SkeletonInsightCard,
  SkeletonResourceCard
} from "@/components/ui/skeleton";

import ideationMedal from "../assets/placeholders/medals/ideation.png";
import surveyMedal from "../assets/placeholders/medals/survey.png";
import planningMedal from "../assets/placeholders/medals/planning.png";
import procurementMedal from "../assets/placeholders/medals/procurement.png";
import foundationMedal from "../assets/placeholders/medals/foundation.png";
import structuralMedal from "../assets/placeholders/medals/structural.png";
import enclosureMedal from "../assets/placeholders/medals/enclosure.png";
import mepMedal from "../assets/placeholders/medals/mep.png";
import finishingMedal from "../assets/placeholders/medals/finishing.png";
import resourceOne from "../assets/placeholders/resource-1.jpg";
import resourceTwo from "../assets/placeholders/resource-2.jpg";
import resourceThree from "../assets/placeholders/resource-3.jpg";
import resourceFour from "../assets/placeholders/resource-4.jpg";
import resourceFive from "../assets/placeholders/resource-5.jpg";
import resourceSix from "../assets/placeholders/resource-6.jpg";

type StageSlide = {
  title: string;
  copy: string;
  image: string;
  progress?: number;
  taskSummary?: { completed: number; total: number };
};

const defaultStageSlides: StageSlide[] = [
  {
    title: "IDEATION",
    copy: "Project created, requirements captured, and goals aligned.",
    image: ideationMedal
  },
  {
    title: "SURVEY",
    copy: "Site measurements, soil checks, and constraints documented.",
    image: surveyMedal
  },
  {
    title: "PLANNING",
    copy: "Drawings, scope, and schedule aligned before execution.",
    image: planningMedal
  },
  {
    title: "PROCUREMENT",
    copy: "Materials and vendors locked with lead times confirmed.",
    image: procurementMedal
  },
  {
    title: "FOUNDATION",
    copy: "Excavation, footing, and base work underway.",
    image: foundationMedal
  },
  {
    title: "STRUCTURAL",
    copy: "Columns, beams, and slab progress tracked.",
    image: structuralMedal
  },
  {
    title: "ENCLOSURE",
    copy: "Walls, roof, and openings closed for weatherproofing.",
    image: enclosureMedal
  },
  {
    title: "MEP",
    copy: "Mechanical, electrical, and plumbing routes coordinated.",
    image: mepMedal
  },
  {
    title: "FINISHING",
    copy: "Interiors, fixtures, and final quality checks completed.",
    image: finishingMedal
  }
];

const stageMeta = [
  { keywords: ["ideation"], slide: defaultStageSlides[0] },
  { keywords: ["survey"], slide: defaultStageSlides[1] },
  { keywords: ["planning"], slide: defaultStageSlides[2] },
  { keywords: ["procurement", "purchase"], slide: defaultStageSlides[3] },
  { keywords: ["foundation"], slide: defaultStageSlides[4] },
  { keywords: ["structural"], slide: defaultStageSlides[5] },
  { keywords: ["enclosure", "wall", "roof"], slide: defaultStageSlides[6] },
  { keywords: ["mep", "mechanical", "electrical", "plumbing", "hvac"], slide: defaultStageSlides[7] },
  { keywords: ["finish", "finishing", "interior"], slide: defaultStageSlides[8] },
];



export default function Home() {
  const [stageIndex, setStageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [weatherInsightIndex, setWeatherInsightIndex] = useState(0);
  const [projectInsightIndex, setProjectInsightIndex] = useState(0);
  const { currentProject } = useProject();

  // Get project location for weather data
  const projectLocation = currentProject?.location?.city || currentProject?.location?.address || 'Delhi';

  // Fetch weather data
  const { weather, insights: weatherInsights, isLoading: weatherLoading } = useWeather(projectLocation);

  // Get dynamic project insights
  const { insights: projectInsights } = useProjectInsights(currentProject);

  // Swipe handlers for insight cards (must be at top level)
  const cycleWeatherInsight = (delta: number) => {
    if (weatherInsights.length === 0) return;
    setWeatherInsightIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return weatherInsights.length - 1;
      if (next >= weatherInsights.length) return 0;
      return next;
    });
  };
  const cycleProjectInsight = (delta: number) => {
    if (projectInsights.length === 0) return;
    setProjectInsightIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return projectInsights.length - 1;
      if (next >= projectInsights.length) return 0;
      return next;
    });
  };
  const { bind: swipeWeatherInsight } = useSwipe({
    onSwipedLeft: () => cycleWeatherInsight(1),
    onSwipedRight: () => cycleWeatherInsight(-1),
    threshold: 20,
  });
  const { bind: swipeProjectInsight } = useSwipe({
    onSwipedLeft: () => cycleProjectInsight(1),
    onSwipedRight: () => cycleProjectInsight(-1),
    threshold: 20,
  });

  // Select raw state to avoid infinite loops from calling getters in selectors
  const schedulePhases = useScheduleStore((state) => state.phases);

  // Compute values using useMemo to prevent recalculation on every render
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

  const navigate = useNavigate();
  const scheduleStageSlides = useMemo(() => {
    if (schedulePhases.length === 0) return [];
    return schedulePhases.map((phase) => {
      const matched = stageMeta.find((meta) =>
        meta.keywords.some((keyword) => phase.name.toLowerCase().includes(keyword))
      );
      const totalTasks = phase.tasks.length;
      const completedTasks = phase.tasks.filter((task) => task.status === "completed").length;
      const progress = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : phase.progress || 0;

      return {
        title: matched?.slide.title || phase.name.toUpperCase(),
        copy: matched?.slide.copy || "Keep this phase on track with consistent updates.",
        image: matched?.slide.image || planningMedal,
        progress,
        taskSummary: { completed: completedTasks, total: totalTasks },
      };
    });
  }, [schedulePhases]);

  const stageSlides = scheduleStageSlides.length > 0 ? scheduleStageSlides : defaultStageSlides;
  const currentStage = stageSlides[stageIndex];
  const { showToast } = useNotifications();
  const { notifications: persistentNotifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = usePersistentNotifications();
  const progressPercent = currentProject?.progress?.percentage ?? overallProgress;
  const tasksTotal = tasksByStatus.completed + tasksByStatus.in_progress + tasksByStatus.pending;

  // Transform persistent notifications to the format expected by NotificationsSheet
  const notificationsForSheet = persistentNotifications.map(n => ({
    id: n.id,
    title: n.title,
    message: n.message,
    time: n.time || getRelativeTime(n.createdAt),
    unread: !n.read,
  }));

  function getRelativeTime(date: Date) {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString();
  }

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (scheduleStageSlides.length === 0) return;
    const activeIndex = scheduleStageSlides.findIndex((stage) => (stage.progress ?? 0) < 100);
    setStageIndex(activeIndex >= 0 ? activeIndex : 0);
  }, [scheduleStageSlides]);

  useEffect(() => {
    if (stageSlides.length === 0) return;
    setStageIndex((prev) => Math.min(prev, stageSlides.length - 1));
  }, [stageSlides.length]);


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
      { title: "Site Gallery", img: resourceFour, onClick: () => navigate("/site-gallery") },
      { title: "Schedule", img: resourceFive, onClick: () => navigate("/schedule") },
      { title: "Customer Care", img: resourceSix, onClick: () => navigate("/customer-care") }
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
            notifications={notificationsForSheet}
            onNotificationClick={(notification) => {
              markAsRead(notification.id.toString());
            }}
            onMarkAllAsRead={markAllAsRead}
            onClearAll={clearNotifications}
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
                        {currentStage.progress !== undefined && (
                          <div className="mt-2 xs:mt-3 flex items-center justify-center gap-2 text-[0.6rem] xs:text-xs sm:text-sm text-[#8a8a8a]">
                            <span>{currentStage.progress}% complete</span>
                            {currentStage.taskSummary && currentStage.taskSummary.total > 0 && (
                              <span>{currentStage.taskSummary.completed}/{currentStage.taskSummary.total} tasks</span>
                            )}
                          </div>
                        )}

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
                              key={idx}
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

              {/* Daily Insights Section */}
              <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-16">
                <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Daily Insights</h2>
                {isLoading || weatherLoading ? (
                  <div className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 gap-3 xs:gap-4 sm:gap-6 md:grid-cols-2">
                    <SkeletonInsightCard />
                    <SkeletonInsightCard />
                  </div>
                ) : (
                  <div className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 gap-3 xs:gap-4 sm:gap-6 md:grid-cols-2">
                    {/* Weather Insights Card */}
                    <div
                      className="relative flex h-auto min-h-[260px] xs:min-h-[300px] sm:min-h-[400px] md:min-h-[500px] lg:h-[600px] flex-col rounded-[16px] xs:rounded-[24px] sm:rounded-[34px] md:rounded-[46px] border border-[#1f1f1f] bg-[#101010] p-4 xs:p-5 sm:p-7 md:p-10 text-white animate-fade-in select-none"
                      style={{ touchAction: 'pan-y' }}
                      {...swipeWeatherInsight()}
                    >
                      {/* Navigation arrows */}
                      {weatherInsights.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => cycleWeatherInsight(-1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 xs:w-10 xs:h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                            aria-label="Previous insight"
                          >
                            <svg className="w-4 h-4 xs:w-5 xs:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => cycleWeatherInsight(1)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 xs:w-10 xs:h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                            aria-label="Next insight"
                          >
                            <svg className="w-4 h-4 xs:w-5 xs:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </>
                      )}
                      <p className="text-[0.55rem] xs:text-[0.6rem] sm:text-xs md:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] sm:tracking-[0.4em] text-[#cfd5f3]">
                        {weather ? `${weather.location} | ${weather.temperature}°C` : 'Weather'}
                      </p>
                      <h3
                        key={`weather-title-${weatherInsightIndex}`}
                        className="mt-2 xs:mt-3 sm:mt-4 md:mt-6 text-sm xs:text-base sm:text-xl md:text-2xl lg:text-3xl font-semibold leading-tight animate-slide-in"
                      >
                        {weatherInsights[weatherInsightIndex]?.title || 'Weather insight'}
                      </h3>
                      <p
                        key={`weather-desc-${weatherInsightIndex}`}
                        className="mt-1.5 xs:mt-2 sm:mt-3 md:mt-4 text-[0.65rem] xs:text-xs sm:text-sm md:text-base lg:text-lg text-[#d7d7d7] animate-slide-in"
                        style={{ animationDelay: '50ms' }}
                      >
                        {weatherInsights[weatherInsightIndex]?.description || 'No weather-related recommendations right now.'}
                      </p>
                      <div className="mt-auto pt-3 xs:pt-4 sm:pt-5 md:pt-6 overflow-hidden rounded-[12px] xs:rounded-[16px] sm:rounded-[24px] md:rounded-[32px] border border-[#242424]">
                        {/* Weather visual card */}
                        <div className="h-24 xs:h-32 sm:h-44 md:h-56 lg:h-72 w-full bg-gradient-to-br from-[#87CEEB] via-[#98D8C8] to-[#F7DC6F] flex flex-col items-start justify-between p-3 xs:p-4 sm:p-6 md:p-8">
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 xs:p-3 sm:p-4 text-[#1a1a1a]">
                            <p className="text-[0.5rem] xs:text-[0.55rem] sm:text-xs opacity-80">
                              {weather?.description || 'Loading weather...'}
                            </p>
                          </div>
                          <div className="flex items-end justify-between w-full">
                            <div className="text-[#1a1a1a]">
                              <span className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-light">
                                {weather?.temperature ?? '--'}
                              </span>
                              <span className="text-lg xs:text-xl sm:text-2xl align-top">°</span>
                              <div className="text-[0.5rem] xs:text-[0.55rem] sm:text-xs mt-1 opacity-80">
                                {getFormattedDate()}
                                <br />
                                <span className="flex items-center gap-1">
                                  <svg className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                  </svg>
                                  {weather?.location || projectLocation}
                                </span>
                              </div>
                            </div>
                            <span className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl">
                              {weather ? getWeatherIcon(weather.icon) : '🌤️'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 xs:mt-4 sm:mt-5 md:mt-6 flex justify-center gap-1 xs:gap-1.5 sm:gap-2">
                        {weatherInsights.length > 0 ? weatherInsights.map((_, idx) => (
                          <button
                            key={`weather-dot-${idx}`}
                            type="button"
                            onClick={() => setWeatherInsightIndex(idx)}
                            className={`h-1 w-1 xs:h-1.5 xs:w-1.5 sm:h-2 sm:w-2 rounded-full transition-colors ${idx === weatherInsightIndex ? "bg-[var(--pill,#cfe0ad)]" : "bg-[#2a2a2a]"}`}
                          />
                        )) : [0, 1, 2].map((dot) => (
                          <span
                            key={`weather-dot-${dot}`}
                            className={`h-1 w-1 xs:h-1.5 xs:w-1.5 sm:h-2 sm:w-2 rounded-full ${dot === 0 ? "bg-[var(--pill,#cfe0ad)]" : "bg-[#2a2a2a]"}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Project Insights Card */}
                    <div
                      className="relative flex h-auto min-h-[260px] xs:min-h-[300px] sm:min-h-[400px] md:min-h-[500px] lg:h-[600px] flex-col rounded-[16px] xs:rounded-[24px] sm:rounded-[34px] md:rounded-[46px] border border-[#1f1f1f] bg-[#101010] p-4 xs:p-5 sm:p-7 md:p-10 text-white animate-fade-in select-none"
                      style={{ animationDelay: '150ms', touchAction: 'pan-y' }}
                      {...swipeProjectInsight()}
                    >
                      {/* Navigation arrows */}
                      {projectInsights.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => cycleProjectInsight(-1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 xs:w-10 xs:h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                            aria-label="Previous insight"
                          >
                            <svg className="w-4 h-4 xs:w-5 xs:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => cycleProjectInsight(1)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 xs:w-10 xs:h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                            aria-label="Next insight"
                          >
                            <svg className="w-4 h-4 xs:w-5 xs:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </>
                      )}
                      <p
                        key={`project-badge-${projectInsightIndex}`}
                        className="text-[0.55rem] xs:text-[0.6rem] sm:text-xs md:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] sm:tracking-[0.4em] text-[#cfd5f3] animate-slide-in"
                      >
                        {projectInsights[projectInsightIndex]?.badge || 'Did you know?'}
                      </p>
                      <h3
                        key={`project-title-${projectInsightIndex}`}
                        className="mt-2 xs:mt-3 sm:mt-4 md:mt-6 text-sm xs:text-base sm:text-xl md:text-2xl lg:text-3xl font-semibold leading-tight animate-slide-in"
                        style={{ animationDelay: '50ms' }}
                      >
                        {projectInsights[projectInsightIndex]?.title || 'Project insight'}
                      </h3>
                      <p
                        key={`project-desc-${projectInsightIndex}`}
                        className="mt-1.5 xs:mt-2 sm:mt-3 md:mt-4 text-[0.65rem] xs:text-xs sm:text-sm md:text-base lg:text-lg text-[#d7d7d7] animate-slide-in"
                        style={{ animationDelay: '100ms' }}
                      >
                        {projectInsights[projectInsightIndex]?.description || 'Keep tracking your progress for personalized insights.'}
                      </p>
                      <div
                        key={`project-pattern-${projectInsightIndex}`}
                        className="mt-auto pt-3 xs:pt-4 sm:pt-5 md:pt-6 overflow-hidden rounded-[12px] xs:rounded-[16px] sm:rounded-[24px] md:rounded-[32px] border border-[#242424] animate-fade-in-scale"
                      >
                        {/* Abstract pattern based on insight type */}
                        <div className={`h-24 xs:h-32 sm:h-44 md:h-56 lg:h-72 w-full relative overflow-hidden transition-all duration-500 ${
                          projectInsights[projectInsightIndex]?.type === 'warning'
                            ? 'bg-gradient-to-br from-[#F39C12] via-[#E74C3C] to-[#9B59B6]'
                            : projectInsights[projectInsightIndex]?.type === 'success'
                            ? 'bg-gradient-to-br from-[#2ECC71] via-[#1ABC9C] to-[#3498DB]'
                            : 'bg-gradient-to-br from-[#E67E22] via-[#D35400] to-[#C0392B]'
                        }`}>
                          {/* Decorative waves */}
                          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
                            <path d="M0,150 Q100,50 200,150 T400,150 L400,300 L0,300 Z" fill="rgba(255,255,255,0.1)" />
                            <path d="M0,180 Q100,100 200,180 T400,180 L400,300 L0,300 Z" fill="rgba(255,255,255,0.1)" />
                            <path d="M0,210 Q100,150 200,210 T400,210 L400,300 L0,300 Z" fill="rgba(255,255,255,0.15)" />
                            <path d="M0,240 Q100,180 200,240 T400,240 L400,300 L0,300 Z" fill="rgba(139,90,43,0.3)" />
                          </svg>
                          {/* Type indicator */}
                          <div className="absolute top-3 right-3 xs:top-4 xs:right-4 sm:top-6 sm:right-6">
                            <span className={`text-2xl xs:text-3xl sm:text-4xl md:text-5xl transition-transform duration-300 inline-block ${
                              projectInsights[projectInsightIndex]?.type === 'warning' ? 'drop-shadow-lg animate-bounce-subtle' : ''
                            }`}>
                              {projectInsights[projectInsightIndex]?.type === 'warning' && '⚠️'}
                              {projectInsights[projectInsightIndex]?.type === 'success' && '✅'}
                              {projectInsights[projectInsightIndex]?.type === 'tip' && '💡'}
                              {projectInsights[projectInsightIndex]?.type === 'info' && '💡'}
                              {!projectInsights[projectInsightIndex]?.type && '💡'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 xs:mt-4 sm:mt-5 md:mt-6 flex justify-center gap-1 xs:gap-1.5 sm:gap-2">
                        {projectInsights.length > 0 ? projectInsights.map((_, idx) => (
                          <button
                            key={`project-dot-${idx}`}
                            type="button"
                            onClick={() => setProjectInsightIndex(idx)}
                            className={`h-1 w-1 xs:h-1.5 xs:w-1.5 sm:h-2 sm:w-2 rounded-full transition-colors ${idx === projectInsightIndex ? "bg-[var(--pill,#cfe0ad)]" : "bg-[#2a2a2a]"}`}
                          />
                        )) : [0, 1, 2].map((dot) => (
                          <span
                            key={`project-dot-${dot}`}
                            className={`h-1 w-1 xs:h-1.5 xs:w-1.5 sm:h-2 sm:w-2 rounded-full ${dot === 0 ? "bg-[var(--pill,#cfe0ad)]" : "bg-[#2a2a2a]"}`}
                          />
                        ))}
                      </div>
                    </div>
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
                        className="relative h-[100px] xs:h-[120px] sm:h-[160px] md:h-[200px] lg:h-[220px] xl:h-[250px] overflow-hidden rounded-[12px] xs:rounded-[16px] sm:rounded-[24px] md:rounded-[34px] border border-[#2a2a2a] bg-[#151515] text-left shadow-[0_4px_16px_rgba(0,0,0,0.2)] sm:shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition active:scale-[0.98] hover:scale-[1.01] animate-fade-in"
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

          <Fab label="Quick add" onClick={() => setQuickAddOpen(true)}>
            +
          </Fab>
          <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
        </div>

        {/* Side Menu */}
        <SideMenu />
      </Sheet>
    </PhoneShell>
  );
}
