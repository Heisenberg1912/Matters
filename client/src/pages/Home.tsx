import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/bottom-nav";
import PhoneShell from "@/components/phone-shell";
import ProgressRing from "@/components/progress-ring";
import { Fab } from "@/components/fab";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useNotifications } from "@/hooks/use-notifications";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useSwipe } from "@/hooks/use-swipe";

const loadAsset = (path: string) => {
  try {
    return new URL(path, import.meta.url).href;
  } catch {
    return undefined;
  }
};

const stageImg = loadAsset("../assets/placeholders/stage-ideation.png");
const insightWeather = loadAsset("../assets/placeholders/insight-weather.png");
const insightFact = loadAsset("../assets/placeholders/insight-fact.png");
const resourceOne = loadAsset("../assets/placeholders/resource-1.jpg");
const resourceTwo = loadAsset("../assets/placeholders/resource-2.jpg");
const resourceThree = loadAsset("../assets/placeholders/resource-3.jpg");

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
    badge: "Bhopal | 25°",
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

export default function Home() {
  const [mode, setMode] = useState<"construction" | "refurbish">("construction");
  const [stageIndex, setStageIndex] = useState(0);
  const navigate = useNavigate();
  const currentStage = stageSlides[stageIndex];
  const { showToast } = useNotifications();

  const menuItems = [
    { label: "Your Subscription", path: "/subscription" },
    { label: "Hire a Contractor", path: "/hire-contractor" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "News & Updates", path: "/news-updates" },
    { label: "Visit Builtattic", path: "/visit-builtattic" },
    { label: "Settings", path: "/settings" }
  ];

  const { bind: swipeStage } = useSwipe({
    onSwipedLeft: () => cycleStage(1),
    onSwipedRight: () => cycleStage(-1)
  });

  const { isRefreshing, pullDistance, bind: pullBind } = usePullToRefresh(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
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
      { title: "Customer Care", img: resourceThree, onClick: () => navigate("/customer-care") },
      { title: "Analytics", img: resourceOne, onClick: () => navigate("/analytics") },
      { title: "Team Management", img: resourceTwo, onClick: () => navigate("/team") },
      { title: "Documents", img: resourceThree, onClick: () => navigate("/documents") },
      { title: "Reports", img: resourceOne, onClick: () => navigate("/reports") }
    ],
    [navigate]
  );

  return (
    <PhoneShell>
      <Sheet>
        <div className="flex h-full flex-col">
          {/* Header - Mobile Optimized */}
          <header className="flex flex-col gap-3 xs:gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6 rounded-b-[30px] xs:rounded-b-[40px] sm:rounded-b-[50px] md:rounded-b-[60px] border-b border-[#1f1f1f] bg-[#050505] px-4 py-4 xs:px-5 xs:py-5 sm:px-6 sm:py-8 md:px-10 md:py-10 lg:px-24 lg:py-16">
            <div className="flex items-center gap-3 xs:gap-4 sm:gap-6">
              <SheetTrigger asChild>
                <button type="button" className="shrink-0">
                  <Avatar className="h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 border-2 border-[#232323]">
                    <AvatarFallback className="text-sm xs:text-base sm:text-lg md:text-xl">G</AvatarFallback>
                  </Avatar>
                </button>
              </SheetTrigger>

              <div className="flex flex-col text-white min-w-0 flex-1">
                <span className="text-base xs:text-lg sm:text-2xl md:text-3xl font-semibold truncate">Oh Hi, Guest!</span>
                <span className="text-[0.6rem] xs:text-xs sm:text-sm uppercase tracking-[0.15em] xs:tracking-[0.25em] sm:tracking-[0.35em] text-[#c7c7c7] truncate">Project Skyline</span>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex rounded-full border border-[#2a2a2a] bg-[#0c0c0c] p-1 xs:p-1.5 sm:p-2 text-[0.65rem] xs:text-xs sm:text-sm md:text-base font-semibold sm:ml-auto self-start sm:self-auto w-fit">
              {(["construction", "refurbish"] as const).map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => setMode(state)}
                  className={`rounded-full px-2.5 py-1 xs:px-3 xs:py-1.5 sm:px-4 sm:py-2 md:px-6 transition active:scale-95 ${
                    mode === state ? "bg-[var(--pill,#cfe0ad)] text-black" : "text-white"
                  }`}
                >
                  <span className="hidden sm:inline">{state.toUpperCase()}</span>
                  <span className="sm:hidden">{state === "construction" ? "BUILD" : "REFURB"}</span>
                </button>
              ))}
            </div>
          </header>

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
              <section className="mt-4 xs:mt-6 sm:mt-10 md:mt-16">
                <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Current Progress</h2>
                <Card className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-3 xs:p-4 sm:p-6 md:p-8 lg:p-10">
                  <div className="grid grid-cols-1 gap-3 xs:gap-4 sm:gap-6 md:gap-8 lg:grid-cols-2">
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
                          ‹
                        </button>
                        <span className="text-[0.55rem] xs:text-[0.6rem] sm:text-xs tracking-[0.15em] xs:tracking-[0.25em] sm:tracking-[0.4em] text-[#dcdcdc] text-center px-1 xs:px-2">{currentStage.title}</span>
                        <button
                          type="button"
                          onClick={() => cycleStage(1)}
                          className="flex h-7 w-7 xs:h-8 xs:w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-full border border-[#2a2a2a] text-base xs:text-lg sm:text-xl md:text-2xl active:scale-95 transition"
                          aria-label="Next stage"
                        >
                          ›
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
                          <ProgressRing value={5} size={80} strokeWidth={8} className="xs:hidden" />
                          <ProgressRing value={5} size={100} strokeWidth={10} className="hidden xs:block sm:hidden" />
                          <ProgressRing value={5} size={140} strokeWidth={12} className="hidden sm:block md:hidden" />
                          <ProgressRing value={5} size={180} strokeWidth={14} className="hidden md:block lg:hidden" />
                          <ProgressRing value={5} size={240} strokeWidth={18} className="hidden lg:block" />
                        </div>
                        <div className="text-xs xs:text-sm sm:text-base md:text-xl lg:text-2xl text-[#d9dfcd] text-center xs:text-left">
                          <p>100% of your inventory and budget unused</p>
                        </div>
                      </div>

                      <div className="mt-3 xs:mt-4 sm:mt-6 text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-[140px] xl:text-[160px] font-black leading-none text-white text-center xs:text-left">0%</div>
                      <p className="text-[0.65rem] xs:text-xs sm:text-sm md:text-lg lg:text-xl text-[#b9b9b9] text-center xs:text-left">Downloading this app is the first step.</p>

                      <div className="mt-4 xs:mt-5 sm:mt-8 md:mt-10 h-3 xs:h-4 sm:h-5 md:h-6 rounded-full border border-[#2a2a2a] bg-[#0d0d0d]">
                        <div className="h-full w-[5%] rounded-full bg-[var(--pill,#cfe0ad)]" />
                      </div>
                    </div>
                  </div>
                </Card>
              </section>

              {/* Daily Insights Section */}
              <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-20">
                <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Daily Insights</h2>
                <div className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 gap-3 xs:gap-4 sm:gap-6 md:grid-cols-2">
                  {insightCards.map((card) => (
                    <div
                      key={card.id}
                      className="flex h-auto min-h-[260px] xs:min-h-[300px] sm:min-h-[400px] md:min-h-[500px] lg:h-[600px] flex-col rounded-[16px] xs:rounded-[24px] sm:rounded-[34px] md:rounded-[46px] border border-[#1f1f1f] bg-[#101010] p-4 xs:p-5 sm:p-7 md:p-10 text-white"
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
              </section>

              {/* Resources Section */}
              <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-20">
                <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Resources</h2>
                <div className="mt-3 xs:mt-4 sm:mt-6 md:mt-10 grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3">
                  {resources.map((resource) => (
                    <button
                      key={resource.title}
                      type="button"
                      onClick={resource.onClick}
                      className="relative h-[120px] xs:h-[150px] sm:h-[220px] md:h-[300px] lg:h-[380px] xl:h-[430px] overflow-hidden rounded-[12px] xs:rounded-[16px] sm:rounded-[24px] md:rounded-[34px] border border-[#2a2a2a] bg-[#151515] text-left shadow-[0_4px_16px_rgba(0,0,0,0.2)] sm:shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition active:scale-[0.98] hover:scale-[1.01]"
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
              </section>
            </div>
          </div>

          <Fab label="Quick add" onClick={() => showToast({ type: "info", message: "Quick action", description: "Add a new update" })}>
            +
          </Fab>
          <BottomNav />
        </div>

        {/* Side Menu Sheet */}
        <SheetContent>
          <div className="space-y-5 xs:space-y-6 sm:space-y-8 md:space-y-10 text-base xs:text-lg sm:text-xl md:text-2xl pt-6 xs:pt-8 sm:pt-10">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="w-full text-left font-medium transition hover:text-[#cfe0ad] active:scale-[0.98]"
              >
                {item.label}
              </button>
            ))}
            <div className="mt-10 xs:mt-14 sm:mt-20 md:mt-24 flex items-center gap-3 xs:gap-4 sm:gap-5 md:gap-6 rounded-[24px] xs:rounded-[32px] sm:rounded-[40px] md:rounded-[50px] border border-[#1f1f1f] bg-[#0a0a0a] p-4 xs:p-5 sm:p-6 md:p-8">
              <Avatar className="h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 md:h-16 md:w-16">
                <AvatarFallback>G</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold">Guest #0102</p>
                <p className="text-[0.65rem] xs:text-xs sm:text-sm text-muted">View Profile</p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </PhoneShell>
  );
}
