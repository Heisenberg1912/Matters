import { useEffect, useMemo, useState } from "react";
import PageLayout from "@/components/page-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { MapPin, Ruler, Home as HomeIcon, Calendar, Users, Thermometer } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useProject } from "@/context/ProjectContext";
import { useScheduleStore, useTeamStore } from "@/store";
import { mlApi } from "@/lib/api";

type WeatherDay = {
  date: string;
  dayOfWeek: string;
  weather: { condition: string; temp: number };
  workabilityScore: number;
};

const formatDate = (value?: string) => {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString();
};

export default function SiteDetails() {
  const { user } = useAuth();
  const { currentProject } = useProject();
  const phases = useScheduleStore((state) => state.phases);
  const overallProgress = useScheduleStore((state) => state.getOverallProgress());
  const teamMembers = useTeamStore((state) => state.members);

  const [weatherData, setWeatherData] = useState<WeatherDay[]>([]);
  const [weatherError, setWeatherError] = useState("");
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  useEffect(() => {
    const loadWeather = async () => {
      if (!currentProject) {
        setWeatherData([]);
        setWeatherError("");
        return;
      }
      const location =
        currentProject.location?.city ||
        currentProject.location?.address ||
        "Bhopal";
      setIsWeatherLoading(true);
      setWeatherError("");
      try {
        const response = await mlApi.getWeather(location);
        if (response.success && response.data) {
          setWeatherData(response.data.slice(0, 5));
        } else {
          setWeatherError(response.error || "Failed to load weather");
        }
      } catch (error) {
        setWeatherError(error instanceof Error ? error.message : "Failed to load weather");
      } finally {
        setIsWeatherLoading(false);
      }
    };

    loadWeather();
  }, [currentProject]);

  const activePhase = useMemo(
    () => phases.find((phase) => phase.tasks.some((task) => task.status !== "completed")) || phases[0],
    [phases]
  );

  const siteSpecifications = [
    { label: "Project Type", value: currentProject?.type || "Not set" },
    { label: "Status", value: currentProject?.status || "Not set" },
    { label: "Priority", value: currentProject?.priority || "Not set" },
    { label: "Current Stage", value: currentProject?.currentStage?.name || activePhase?.name || "Not set" },
    { label: "Overall Progress", value: `${currentProject?.progress?.percentage ?? overallProgress}%` },
    { label: "Budget", value: currentProject?.budget?.estimated ? `INR ${currentProject.budget.estimated.toLocaleString()}` : "Not set" },
    { label: "Start Date", value: formatDate(currentProject?.timeline?.startDate || currentProject?.startDate) },
    { label: "Target End Date", value: formatDate(currentProject?.timeline?.expectedEndDate || currentProject?.endDate) },
  ];

  const coordinates =
    currentProject?.location?.coordinates?.lat && currentProject?.location?.coordinates?.lng
      ? `${currentProject.location.coordinates.lat}, ${currentProject.location.coordinates.lng}`
      : "Coordinates not set";

  const addressLine = [
    currentProject?.location?.address,
    currentProject?.location?.city,
    currentProject?.location?.state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <PageLayout
      title="Site Details"
      contentClassName="px-4 xs:px-5 sm:px-6 md:px-10 lg:px-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        {!currentProject && (
          <Card className="mt-6 border border-[#242424] bg-[#101010] p-4 text-sm xs:text-base text-[#bdbdbd]">
            Select or create a project to view site details.
          </Card>
        )}

        <section className="mt-8 xs:mt-12 sm:mt-16">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {currentProject?.name || "Project Overview"}
          </h2>
          <Card className="mt-4 xs:mt-6 sm:mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-4 xs:p-6 sm:p-8 md:p-10">
            <div className="grid grid-cols-1 gap-6 xs:gap-8 sm:gap-10 lg:grid-cols-2">
              <div>
                <div className="flex items-start gap-3 xs:gap-4">
                  <MapPin size={24} className="mt-1 text-[#cfe0ad] shrink-0 xs:w-7 xs:h-7" strokeWidth={1.5} />
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] xs:tracking-[0.4em] text-[#bdbdbd]">Location</p>
                    <p className="mt-2 text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white break-words">{addressLine || "Not set"}</p>
                    <p className="mt-1 text-sm xs:text-base sm:text-lg md:text-xl text-[#bdbdbd]">
                      {currentProject?.location?.pincode || "Pincode not set"}
                    </p>
                    <p className="mt-2 text-xs xs:text-sm text-[#8a8a8a]">{coordinates}</p>
                  </div>
                </div>

                <div className="mt-6 xs:mt-8 sm:mt-10 space-y-4 xs:space-y-6">
                  <div className="flex items-center gap-3 xs:gap-4">
                    <Ruler size={20} className="text-[#cfe0ad] shrink-0 xs:w-6 xs:h-6" strokeWidth={1.5} />
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Project Type</p>
                      <p className="mt-1 text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white">{currentProject?.type || "Not set"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 xs:gap-4">
                    <HomeIcon size={20} className="text-[#cfe0ad] shrink-0 xs:w-6 xs:h-6" strokeWidth={1.5} />
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Status</p>
                      <p className="mt-1 text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white">{currentProject?.status || "Not set"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 xs:gap-4">
                    <Calendar size={20} className="text-[#cfe0ad] shrink-0 xs:w-6 xs:h-6" strokeWidth={1.5} />
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Timeline</p>
                      <p className="mt-1 text-sm xs:text-base sm:text-lg md:text-xl text-white">
                        {formatDate(currentProject?.timeline?.startDate || currentProject?.startDate)} - {formatDate(currentProject?.timeline?.expectedEndDate || currentProject?.endDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] xs:rounded-[26px] sm:rounded-[32px] border border-[#2a2a2a] bg-[#0a0a0a] p-4 xs:p-5 sm:p-6 md:p-8">
                <div className="space-y-4 xs:space-y-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Current Phase</p>
                    <p className="mt-2 text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-[#cfe0ad]">
                      {currentProject?.currentStage?.name || activePhase?.name || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Budget</p>
                    <p className="mt-2 text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white">
                      {currentProject?.budget?.estimated ? `INR ${currentProject.budget.estimated.toLocaleString()}` : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Progress</p>
                    <p className="mt-2 text-xl xs:text-2xl sm:text-3xl font-semibold text-white">
                      {currentProject?.progress?.percentage ?? overallProgress}%
                    </p>
                  </div>
                  <div className="border-t border-[#2a2a2a] pt-4 xs:pt-6">
                    <p className="text-xs uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Owner</p>
                    <p className="mt-2 text-sm xs:text-base sm:text-lg md:text-xl text-white">
                      {user?.name || "Owner"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-12 xs:mt-16 sm:mt-20">
          <div className="flex items-center gap-3 xs:gap-4">
            <Thermometer size={24} className="text-[#cfe0ad] shrink-0 xs:w-7 xs:h-7 sm:w-8 sm:h-8" strokeWidth={1.5} />
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Weather Forecast</h2>
          </div>
          {weatherError && (
            <Card className="mt-4 border border-red-500/40 bg-red-500/10 p-4 text-sm xs:text-base text-red-200">
              {weatherError}
            </Card>
          )}
          <div className="scroll-x-container mt-4 xs:mt-6 sm:mt-8 lg:grid lg:grid-cols-5 lg:overflow-visible">
            {isWeatherLoading && (
              <Card className="flex min-w-[160px] xs:min-w-[180px] sm:min-w-[200px] flex-col items-center rounded-[24px] xs:rounded-[30px] sm:rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-4 xs:p-5 sm:p-6 text-sm xs:text-base text-[#bdbdbd]">
                Loading forecast...
              </Card>
            )}
            {!isWeatherLoading && weatherData.length === 0 && (
              <Card className="flex min-w-[160px] xs:min-w-[180px] sm:min-w-[200px] flex-col items-center rounded-[24px] xs:rounded-[30px] sm:rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-4 xs:p-5 sm:p-6 text-sm xs:text-base text-[#bdbdbd]">
                Weather data unavailable.
              </Card>
            )}
            {weatherData.map((weather) => (
              <Card
                key={weather.date}
                className="flex min-w-[140px] xs:min-w-[160px] sm:min-w-[200px] flex-col items-center rounded-[24px] xs:rounded-[30px] sm:rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-4 xs:p-5 sm:p-6 snap-start shrink-0"
              >
                <p className="text-sm xs:text-base sm:text-lg font-semibold text-white">{weather.dayOfWeek}</p>
                <div className="my-2 xs:my-3 sm:my-4 text-2xl xs:text-3xl sm:text-4xl text-[#cfe0ad]">{Math.round(weather.workabilityScore * 100)}%</div>
                <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-[#cfe0ad]">{weather.weather.temp}C</p>
                <p className="mt-1 xs:mt-2 text-center text-xs xs:text-sm sm:text-base text-[#bdbdbd]">{weather.weather.condition}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12 xs:mt-16 sm:mt-20">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Site Specifications</h2>
          <Card className="mt-4 xs:mt-6 sm:mt-8 border border-[#2a2a2a] bg-[#0f0f0f] p-4 xs:p-6 sm:p-8 md:p-10">
            <div className="grid grid-cols-1 gap-x-8 xs:gap-x-10 sm:gap-x-12 gap-y-6 xs:gap-y-8 md:grid-cols-2">
              {siteSpecifications.map((spec) => (
                <div key={spec.label} className="border-b border-[#1f1f1f] pb-4 xs:pb-5 sm:pb-6 last:border-b-0">
                  <p className="text-xs uppercase tracking-[0.25em] xs:tracking-[0.35em] text-[#8a8a8a]">{spec.label}</p>
                  <p className="mt-2 text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white">{spec.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-12 xs:mt-16 sm:mt-20">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Site Map</h2>
          <Card className="mt-4 xs:mt-6 sm:mt-8 flex h-[280px] xs:h-[320px] sm:h-[400px] md:h-[500px] items-center justify-center rounded-[28px] xs:rounded-[36px] sm:rounded-[46px] border border-[#2a2a2a] bg-[#101010]">
            <div className="text-center px-4">
              <MapPin size={48} className="mx-auto text-[#cfe0ad] xs:w-14 xs:h-14 sm:w-16 sm:h-16" strokeWidth={1.5} />
              <p className="mt-4 xs:mt-5 sm:mt-6 text-base xs:text-lg sm:text-xl text-[#bdbdbd]">Interactive site map view</p>
              <button
                type="button"
                className="mt-4 xs:mt-5 sm:mt-6 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-6 xs:px-7 sm:px-8 py-2 xs:py-2.5 sm:py-3 text-sm xs:text-base font-semibold text-white transition hover:border-[#3a3a3a] touch-target focus-ring"
                onClick={() => {
                  if (!addressLine) {
                    return;
                  }
                  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}`;
                  window.open(url, "_blank");
                }}
              >
                Open in Maps
              </button>
            </div>
          </Card>
        </section>

        <section className="mt-12 xs:mt-16 sm:mt-20">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Team on Site</h2>
          <div className="mt-4 xs:mt-6 sm:mt-8 grid grid-cols-1 gap-4 xs:gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.length === 0 && (
              <Card className="rounded-[24px] xs:rounded-[30px] sm:rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-4 xs:p-5 sm:p-6 text-sm xs:text-base text-[#bdbdbd]">
                No team members assigned yet.
              </Card>
            )}
            {teamMembers.slice(0, 6).map((member) => (
              <Card
                key={member.id}
                className="rounded-[24px] xs:rounded-[30px] sm:rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-4 xs:p-5 sm:p-6 md:p-8"
              >
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-16 w-16 xs:h-18 xs:w-18 sm:h-20 sm:w-20 md:h-24 md:w-24 border-2 border-[#2a2a2a]">
                    <AvatarFallback className="text-xl xs:text-2xl sm:text-2xl md:text-3xl">
                      {member.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="mt-3 xs:mt-4 text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white">{member.name}</h3>
                  <p className="mt-1 xs:mt-2 text-sm xs:text-base text-[#bdbdbd]">{member.role}</p>
                  <div className="mt-3 xs:mt-4 flex items-center gap-2 text-xs xs:text-sm text-[#8a8a8a]">
                    <Users size={16} className="xs:w-[18px] xs:h-[18px]" />
                    <span>{member.status === "active" ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
