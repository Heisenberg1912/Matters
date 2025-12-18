import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/bottom-nav";
import PhoneShell from "@/components/phone-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MapPin, Ruler, Home as HomeIcon, Calendar, Users, Thermometer } from "lucide-react";

const siteInfo = {
  name: "Project Skyline",
  address: "Plot No. 245, Sector 12, Kolar Road",
  city: "Bhopal",
  state: "Madhya Pradesh",
  pincode: "462042",
  coordinates: "23.2599° N, 77.4126° E",
  area: "2,450 sq ft",
  plotSize: "3,200 sq ft",
  floors: "Basement + G+1",
  projectType: "Residential Construction",
  startDate: "Dec 1, 2025",
  expectedCompletion: "Dec 12, 2026",
  currentPhase: "Foundation & Structure",
  contractor: "Kumar Construction Ltd.",
  architect: "Design Atelier Studio",
  supervisor: "Rajesh Kumar"
};

const weatherData = [
  { day: "Today", temp: "25°C", condition: "Sunny", icon: "☀️" },
  { day: "Tomorrow", temp: "23°C", condition: "Partly Cloudy", icon: "⛅" },
  { day: "Thu", temp: "22°C", condition: "Rainy", icon: "🌧️" },
  { day: "Fri", temp: "24°C", condition: "Sunny", icon: "☀️" },
  { day: "Sat", temp: "26°C", condition: "Sunny", icon: "☀️" }
];

const siteSpecifications = [
  { label: "Foundation Type", value: "RCC Raft Foundation" },
  { label: "Structure Type", value: "RCC Frame Structure" },
  { label: "Wall Material", value: "Red Clay Bricks" },
  { label: "Roofing", value: "RCC Slab with waterproofing" },
  { label: "Water Supply", value: "Municipal + Borewell" },
  { label: "Electrical Load", value: "15 KW (Three Phase)" },
  { label: "Parking", value: "2 Car Podium Parking" },
  { label: "Compound Wall", value: "6 ft boundary wall" }
];

export default function SiteDetails() {
  const [mode, setMode] = useState<"construction" | "refurbish">("construction");
  const navigate = useNavigate();

  const menuItems = [
    { label: "Your Subscription", path: "/subscription" },
    { label: "Hire a Contractor", path: "/hire-contractor" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "News & Updates", path: "/news-updates" },
    { label: "Visit Builtattic", path: "/visit-builtattic" },
    { label: "Settings", path: "/settings" }
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
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Site Details</span>
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
            <div className="mx-auto w-full max-w-6xl">
              <section className="mt-16">
                <h2 className="text-4xl font-bold tracking-tight text-white">{siteInfo.name}</h2>
                <Card className="mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                  <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                    <div>
                      <div className="flex items-start gap-4">
                        <MapPin size={32} className="mt-1 text-[#cfe0ad]" strokeWidth={1.5} />
                        <div>
                          <p className="text-sm uppercase tracking-[0.4em] text-[#bdbdbd]">Location</p>
                          <p className="mt-2 text-2xl font-semibold text-white">{siteInfo.address}</p>
                          <p className="mt-1 text-xl text-[#bdbdbd]">{siteInfo.city}, {siteInfo.state} - {siteInfo.pincode}</p>
                          <p className="mt-2 text-base text-[#8a8a8a]">{siteInfo.coordinates}</p>
                        </div>
                      </div>

                      <div className="mt-10 space-y-6">
                        <div className="flex items-center gap-4">
                          <Ruler size={28} className="text-[#cfe0ad]" strokeWidth={1.5} />
                          <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Built-up Area</p>
                            <p className="mt-1 text-2xl font-semibold text-white">{siteInfo.area}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <HomeIcon size={28} className="text-[#cfe0ad]" strokeWidth={1.5} />
                          <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Plot Size</p>
                            <p className="mt-1 text-2xl font-semibold text-white">{siteInfo.plotSize}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Calendar size={28} className="text-[#cfe0ad]" strokeWidth={1.5} />
                          <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Timeline</p>
                            <p className="mt-1 text-xl text-white">{siteInfo.startDate} - {siteInfo.expectedCompletion}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[46px] border border-[#2a2a2a] bg-[#0a0a0a] p-8">
                      <div className="space-y-6">
                        <div>
                          <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Project Type</p>
                          <p className="mt-2 text-2xl font-semibold text-white">{siteInfo.projectType}</p>
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Configuration</p>
                          <p className="mt-2 text-2xl font-semibold text-white">{siteInfo.floors}</p>
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Current Phase</p>
                          <p className="mt-2 text-2xl font-semibold text-[#cfe0ad]">{siteInfo.currentPhase}</p>
                        </div>
                        <div className="border-t border-[#2a2a2a] pt-6">
                          <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Contractor</p>
                          <p className="mt-2 text-xl text-white">{siteInfo.contractor}</p>
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Architect</p>
                          <p className="mt-2 text-xl text-white">{siteInfo.architect}</p>
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Site Supervisor</p>
                          <p className="mt-2 text-xl text-white">{siteInfo.supervisor}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </section>

              <section className="mt-20">
                <div className="flex items-center gap-4">
                  <Thermometer size={36} className="text-[#cfe0ad]" strokeWidth={1.5} />
                  <h2 className="text-4xl font-bold tracking-tight text-white">Weather Forecast</h2>
                </div>
                <div className="mt-8 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory lg:grid lg:grid-cols-5 lg:overflow-visible">
                  {weatherData.map((weather) => (
                    <Card
                      key={weather.day}
                      className="flex min-w-[200px] flex-col items-center rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-6 snap-start"
                    >
                      <p className="text-lg font-semibold text-white">{weather.day}</p>
                      <div className="my-4 text-6xl">{weather.icon}</div>
                      <p className="text-3xl font-bold text-[#cfe0ad]">{weather.temp}</p>
                      <p className="mt-2 text-center text-base text-[#bdbdbd]">{weather.condition}</p>
                    </Card>
                  ))}
                </div>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Site Specifications</h2>
                <Card className="mt-8 border border-[#2a2a2a] bg-[#0f0f0f] p-10">
                  <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
                    {siteSpecifications.map((spec) => (
                      <div key={spec.label} className="border-b border-[#1f1f1f] pb-6 last:border-b-0">
                        <p className="text-sm uppercase tracking-[0.35em] text-[#8a8a8a]">{spec.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{spec.value}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Site Map</h2>
                <Card className="mt-8 flex h-[500px] items-center justify-center rounded-[46px] border border-[#2a2a2a] bg-[#101010]">
                  <div className="text-center">
                    <MapPin size={80} className="mx-auto text-[#cfe0ad]" strokeWidth={1.5} />
                    <p className="mt-6 text-2xl text-[#bdbdbd]">Interactive site map view</p>
                    <button
                      type="button"
                      className="mt-8 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-10 py-4 text-xl font-semibold text-white transition hover:border-[#3a3a3a]"
                    >
                      Load Map
                    </button>
                  </div>
                </Card>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Team on Site</h2>
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { name: "Rajesh Kumar", role: "Site Supervisor", team: "8 members" },
                    { name: "Amit Sharma", role: "Lead Electrician", team: "3 members" },
                    { name: "Vikram Patel", role: "Lead Plumber", team: "2 members" }
                  ].map((member) => (
                    <Card
                      key={member.name}
                      className="rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-8"
                    >
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 border-2 border-[#2a2a2a]">
                          <AvatarFallback className="text-3xl">
                            {member.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="mt-4 text-2xl font-semibold text-white">{member.name}</h3>
                        <p className="mt-2 text-lg text-[#bdbdbd]">{member.role}</p>
                        <div className="mt-4 flex items-center gap-2 text-base text-[#8a8a8a]">
                          <Users size={18} />
                          <span>{member.team}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            </div>
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
