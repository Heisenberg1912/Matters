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
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useSwipe } from "@/hooks/use-swipe";
import { useProject } from "@/context/ProjectContext";
import { useScheduleStore } from "@/store";
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
import insightWeather from "../assets/placeholders/insight-weather.png";
import insightFact from "../assets/placeholders/insight-fact.png";
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

const mockNotifications = [
  { id: 1, title: "Budget Alert", message: "Cement costs exceeded estimate by 5%", time: "5m", unread: true },
  { id: 2, title: "New Message", message: "Rajesh Kumar sent you a message", time: "20m", unread: true },
  { id: 3, title: "Task Completed", message: "Foundation work marked complete", time: "1h", unread: false },
  { id: 4, title: "Weather Warning", message: "Rain expected tomorrow afternoon", time: "2h", unread: false }
];

export default function Home() {
  const [stageIndex, setStageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { currentProject } = useProject();

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
  const progressPercent = currentProject?.progress?.percentage ?? overallProgress;
  const tasksTotal = tasksByStatus.completed + tasksByStatus.in_progress + tasksByStatus.pending;

  const unreadCount = mockNotifications.filter(n => n.unread).length;

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
                        className="relative h-[80px] xs:h-[100px] sm:h-[130px] md:h-[160px] lg:h-[180px] xl:h-[200px] overflow-hidden rounded-[12px] xs:rounded-[16px] sm:rounded-[24px] md:rounded-[34px] border border-[#2a2a2a] bg-[#151515] text-left shadow-[0_4px_16px_rgba(0,0,0,0.2)] sm:shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition active:scale-[0.98] hover:scale-[1.01] animate-fade-in"
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
