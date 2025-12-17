import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/bottom-nav";
import PhoneShell from "@/components/phone-shell";
import ProgressRing from "@/components/progress-ring";
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

  const cycleStage = (delta: number) => {
    setStageIndex((prev) => {
      const total = stageSlides.length;
      return (prev + delta + total) % total;
    });
  };

  const resources = useMemo(
    () => [
      { title: "Plans + Drawings", img: resourceOne, onClick: () => navigate("/plans-drawings") },
      { title: "Site Details", img: resourceTwo },
      { title: "Contractor Chat", img: resourceThree },
      { title: "Site Gallery", img: resourceTwo },
      { title: "Schedule", img: resourceOne },
      { title: "Customer Care", img: resourceThree }
    ],
    [navigate]
  );

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
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Project Skyline</span>
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
              <section className="mt-16">
              <h2 className="text-4xl font-bold tracking-tight text-white">Current Progress</h2>
              <Card className="mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                <div className="grid grid-cols-2 gap-8">
                  <div className="flex flex-col rounded-[60px] border border-[#1f1f1f] bg-[#050505] p-10">
                    <div className="flex items-center justify-between text-[#bdbdbd]">
                      <button
                        type="button"
                        onClick={() => cycleStage(-1)}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2a2a2a]"
                        aria-label="Previous stage"
                      >
                        ‹
                      </button>
                      <span className="text-xs tracking-[0.4em] text-[#dcdcdc]">{currentStage.title}</span>
                      <button
                        type="button"
                        onClick={() => cycleStage(1)}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2a2a2a]"
                        aria-label="Next stage"
                      >
                        ›
                      </button>
                    </div>

                    <p className="mt-6 text-center text-lg text-[#cacaca]">{currentStage.copy}</p>

                    <div className="mt-10 flex flex-1 items-center justify-center">
                      {currentStage.image ? (
                        <img
                          src={currentStage.image}
                          alt="Stage"
                          className="h-72 w-72 rounded-full border border-[#2f2f2f] object-cover"
                        />
                      ) : (
                        <div className="h-72 w-72 rounded-full bg-[#1b1b1b]" />
                      )}
                    </div>

                    <div className="mt-10 flex justify-center gap-3">
                      {stageSlides.map((slide, idx) => (
                        <span
                          key={slide.title}
                          className={`h-3 w-3 rounded-full ${idx === stageIndex ? "bg-[var(--pill,#cfe0ad)]" : "bg-[#2a2a2a]"}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col rounded-[60px] border border-[#1f1f1f] bg-[#050505] p-10">
                    <div className="flex items-center gap-10">
                      <ProgressRing value={5} size={240} strokeWidth={18} />
                      <div className="text-2xl text-[#d9dfcd]">
                        <p>100% of your inventory and budget unused</p>
                      </div>
                    </div>

                    <div className="mt-6 text-[160px] font-black leading-none text-white">0%</div>
                    <p className="text-xl text-[#b9b9b9]">Downloading this app is the first step.</p>

                    <div className="mt-10 h-6 rounded-full border border-[#2a2a2a] bg-[#0d0d0d]">
                      <div className="h-full w-[5%] rounded-full bg-[var(--pill,#cfe0ad)]" />
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            <section className="mt-20">
              <h2 className="text-4xl font-bold tracking-tight text-white">Daily Insights</h2>
              <div className="mt-8 grid grid-cols-2 gap-8">
                {insightCards.map((card) => (
                  <div
                    key={card.id}
                    className="flex h-[600px] flex-col rounded-[46px] border border-[#1f1f1f] bg-[#101010] p-10 text-white"
                  >
                    <p className="text-sm uppercase tracking-[0.4em] text-[#cfd5f3]">{card.badge}</p>
                    <h3 className="mt-6 text-3xl font-semibold leading-tight">{card.title}</h3>
                    <p className="mt-4 text-lg text-[#d7d7d7]">{card.text}</p>
                    <div className="mt-auto overflow-hidden rounded-[32px] border border-[#242424]">
                      {card.image ? (
                        <img src={card.image} alt={card.title} className="h-72 w-full object-cover" />
                      ) : (
                        <div className="h-72 w-full bg-[#1b1b1b]" />
                      )}
                    </div>
                    <div className="mt-6 flex justify-center gap-2">
                      {[0, 1, 2].map((dot) => (
                        <span
                          key={`${card.id}-${dot}`}
                          className={`h-2 w-2 rounded-full ${dot === 0 ? "bg-[var(--pill,#cfe0ad)]" : "bg-[#2a2a2a]"}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Resources</h2>
                <div className="mt-10 grid grid-cols-3 gap-8">
                  {resources.map((resource) => (
                    <button
                      key={resource.title}
                      type="button"
                      onClick={resource.onClick}
                      className="relative h-[430px] overflow-hidden rounded-[34px] border border-[#2a2a2a] bg-[#151515] text-left shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition hover:scale-[1.01]"
                    >
                      {resource.img ? (
                        <img src={resource.img} alt={resource.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-[#1b1b1b]" />
                      )}
                      <span className="absolute inset-x-6 bottom-8 text-3xl font-semibold text-white drop-shadow-lg">
                        {resource.title}
                      </span>
                    </button>
                  ))}
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
            <div className="mt-24 flex items-center gap-6 rounded-[50px] border border-[#1f1f1f] bg-[#0a0a0a] p-8">
              <Avatar className="h-16 w-16">
                <AvatarFallback>G</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold">Guest #0102</p>
                <p className="text-sm text-muted">View Profile</p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </PhoneShell>
  );
}
