import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/bottom-nav";
import PhoneShell from "@/components/phone-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Star, MapPin, Briefcase, ArrowLeft, Search } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";

const availableContractors = [
  {
    id: "c1",
    name: "Deepak Mehta",
    role: "Senior Mason",
    company: "BuildPro Services",
    rating: 4.9,
    reviews: 234,
    location: "Bhopal, MP",
    experience: "15 years",
    specialties: ["Brickwork", "Plastering", "Tiling"],
    hourlyRate: 2500,
    availability: "Available Now"
  },
  {
    id: "c2",
    name: "Priya Sharma",
    role: "Architect",
    company: "Design Innovations",
    rating: 4.8,
    reviews: 189,
    location: "Indore, MP",
    experience: "10 years",
    specialties: ["Residential Design", "3D Modeling", "Permits"],
    hourlyRate: 3500,
    availability: "Available from Jan 1"
  },
  {
    id: "c3",
    name: "Arjun Singh",
    role: "Electrician",
    company: "Spark & Wire Co.",
    rating: 4.7,
    reviews: 156,
    location: "Bhopal, MP",
    experience: "12 years",
    specialties: ["Wiring", "Solar Installation", "Smart Home"],
    hourlyRate: 2000,
    availability: "Available Now"
  },
  {
    id: "c4",
    name: "Meena Patel",
    role: "Interior Designer",
    company: "Decor Dreams",
    rating: 4.9,
    reviews: 201,
    location: "Bhopal, MP",
    experience: "8 years",
    specialties: ["Modern Design", "Space Planning", "Color Consulting"],
    hourlyRate: 3000,
    availability: "Available Now"
  },
  {
    id: "c5",
    name: "Ramesh Gupta",
    role: "Plumber",
    company: "Flow Masters",
    rating: 4.6,
    reviews: 143,
    location: "Indore, MP",
    experience: "14 years",
    specialties: ["Piping", "Water Filtration", "Drainage"],
    hourlyRate: 1800,
    availability: "Available from Dec 25"
  },
  {
    id: "c6",
    name: "Sanjay Kumar",
    role: "Carpenter",
    company: "Wood Craft Pro",
    rating: 4.8,
    reviews: 178,
    location: "Bhopal, MP",
    experience: "11 years",
    specialties: ["Custom Furniture", "Doors", "Flooring"],
    hourlyRate: 2200,
    availability: "Available Now"
  }
];

const specialties = ["All", "Brickwork", "Electrical", "Plumbing", "Carpentry", "Design", "Tiling"];

export default function HireContractor() {
  const [mode, setMode] = useState<"construction" | "refurbish">("construction");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const filteredContractors = availableContractors.filter(contractor => {
    const matchesSpecialty = selectedSpecialty === "All" ||
      contractor.specialties.some(s => s.includes(selectedSpecialty));
    const matchesSearch = contractor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contractor.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contractor.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

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
            <button onClick={() => navigate(-1)} className="text-white hover:text-[#cfe0ad]">
              <ArrowLeft size={24} />
            </button>

            <SheetTrigger asChild>
              <button type="button">
                <Avatar className="h-16 w-16 border-2 border-[#232323]">
                  <AvatarFallback>G</AvatarFallback>
                </Avatar>
              </button>
            </SheetTrigger>

            <div className="flex flex-col text-white">
              <span className="text-3xl font-semibold">Oh Hi, Guest!</span>
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Hire a Contractor</span>
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

          <div className="flex-1 overflow-y-auto px-6 pb-32 md:px-10 lg:px-24">
            <div className="mx-auto w-full max-w-6xl">
              <section className="mt-16">
                <h2 className="text-4xl font-bold tracking-tight text-white">Find Your Perfect Contractor</h2>

                {/* Search Bar */}
                <div className="mt-8 relative">
                  <Search size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#8a8a8a]" />
                  <input
                    type="text"
                    placeholder="Search by name, role, or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-full border border-[#2a2a2a] bg-[#0c0c0c] py-5 pl-16 pr-6 text-xl text-white placeholder-[#6a6a6a] outline-none focus:border-[#cfe0ad]"
                  />
                </div>

                {/* Specialty Filter */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {specialties.map((specialty) => (
                    <button
                      key={specialty}
                      onClick={() => setSelectedSpecialty(specialty)}
                      className={`rounded-full border px-6 py-3 text-lg font-semibold transition ${
                        selectedSpecialty === specialty
                          ? "border-[#cfe0ad] bg-[#cfe0ad] text-black"
                          : "border-[#2a2a2a] bg-[#0c0c0c] text-white hover:border-[#3a3a3a]"
                      }`}
                    >
                      {specialty}
                    </button>
                  ))}
                </div>
              </section>

              <section className="mt-16">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-white">
                    {filteredContractors.length} Contractors Available
                  </h3>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                  {filteredContractors.map((contractor) => (
                    <Card
                      key={contractor.id}
                      className="cursor-pointer rounded-[34px] border border-[#2a2a2a] bg-[#101010] p-8 transition hover:border-[#cfe0ad]"
                    >
                      <div className="flex items-start gap-6">
                        <Avatar className="h-20 w-20 border-2 border-[#2a2a2a]">
                          <AvatarFallback className="text-2xl">
                            {contractor.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="text-2xl font-semibold text-white">{contractor.name}</h4>
                          <p className="mt-1 text-lg text-[#bdbdbd]">{contractor.role}</p>
                          <p className="text-base text-[#8a8a8a]">{contractor.company}</p>

                          <div className="mt-4 flex items-center gap-2">
                            <Star size={20} className="fill-[#cfe0ad] text-[#cfe0ad]" />
                            <span className="text-xl font-semibold text-white">{contractor.rating}</span>
                            <span className="text-base text-[#8a8a8a]">({contractor.reviews})</span>
                          </div>

                          <div className="mt-4 flex items-center gap-2 text-[#bdbdbd]">
                            <MapPin size={16} />
                            <span>{contractor.location}</span>
                            <span>•</span>
                            <Briefcase size={16} />
                            <span>{contractor.experience}</span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {contractor.specialties.map((specialty) => (
                              <span
                                key={specialty}
                                className="rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-3 py-1 text-sm text-white"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>

                          <div className="mt-6 flex items-center justify-between">
                            <div>
                              <p className="text-sm text-[#8a8a8a]">Starting from</p>
                              <p className="text-2xl font-bold text-[#cfe0ad]">₹{contractor.hourlyRate}/hr</p>
                            </div>
                            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${
                              contractor.availability === "Available Now"
                                ? "bg-[#4ade80]/10 text-[#4ade80]"
                                : "bg-[#b8d4f1]/10 text-[#b8d4f1]"
                            }`}>
                              {contractor.availability}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="mt-6 w-full rounded-full bg-[#cfe0ad] py-4 text-lg font-semibold text-black transition hover:bg-[#d4e4b8]"
                            onClick={() => showToast({ type: 'success', message: `Sending hire request to ${contractor.name}` })}
                          >
                            Send Hire Request
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {filteredContractors.length === 0 && (
                  <div className="mt-16 text-center">
                    <p className="text-2xl text-[#bdbdbd]">No contractors found matching your criteria</p>
                    <button
                      onClick={() => {
                        setSelectedSpecialty("All");
                        setSearchQuery("");
                      }}
                      className="mt-6 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-8 py-4 text-xl font-semibold text-white transition hover:border-[#cfe0ad]"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
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
