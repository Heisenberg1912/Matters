import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/bottom-nav";
import PhoneShell from "@/components/phone-shell";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Star, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { staggerContainer, listItem, scaleIn, slideUp, cardHover } from "@/lib/animations";

const contractors = [
  {
    id: "1",
    name: "Rajesh Kumar",
    role: "Lead Mason",
    company: "Kumar Construction",
    rating: 4.8,
    reviews: 127,
    status: "active",
    phone: "+91 98765 43210",
    email: "rajesh@kumar.com",
    location: "Bhopal, MP",
    joinedDate: "Nov 15, 2025",
    specialties: ["Brickwork", "Plastering", "Foundation"],
    currentTask: "First floor slab construction",
    availability: "Full-time",
    cost: "₹1,800/day"
  },
  {
    id: "2",
    name: "Amit Sharma",
    role: "Electrician",
    company: "Bright Spark Electricals",
    rating: 4.9,
    reviews: 89,
    status: "active",
    phone: "+91 98765 43211",
    email: "amit@brightspark.com",
    location: "Bhopal, MP",
    joinedDate: "Dec 1, 2025",
    specialties: ["Wiring", "Panel Installation", "Lighting"],
    currentTask: "Ground floor electrical layout",
    availability: "Part-time",
    cost: "₹2,200/day"
  },
  {
    id: "3",
    name: "Vikram Patel",
    role: "Plumber",
    company: "FlowMaster Plumbing",
    rating: 4.7,
    reviews: 64,
    status: "active",
    phone: "+91 98765 43212",
    email: "vikram@flowmaster.com",
    location: "Indore, MP",
    joinedDate: "Nov 20, 2025",
    specialties: ["Piping", "Drainage", "Fixtures"],
    currentTask: "Bathroom rough-in work",
    availability: "Full-time",
    cost: "₹1,900/day"
  },
  {
    id: "4",
    name: "Suresh Verma",
    role: "Carpenter",
    company: "Woodcraft Masters",
    rating: 4.6,
    reviews: 52,
    status: "scheduled",
    phone: "+91 98765 43213",
    email: "suresh@woodcraft.com",
    location: "Bhopal, MP",
    joinedDate: "Dec 5, 2025",
    specialties: ["Formwork", "Doors", "Windows"],
    currentTask: "Not yet assigned",
    availability: "Available from Dec 20",
    cost: "₹2,000/day"
  }
];

export default function Contractor() {
  const [mode, setMode] = useState<"construction" | "refurbish">("construction");
  const [selectedContractor, setSelectedContractor] = useState(contractors[0]);
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
    <AnimatedPage>
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
                <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Contractor Management</span>
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
                <h2 className="text-4xl font-bold tracking-tight text-white">Active Contractors</h2>
                <motion.div
                  className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {contractors.map((contractor) => (
                    <motion.div
                      key={contractor.id}
                      variants={listItem}
                      whileHover={cardHover}
                    >
                      <Card
                        className={`cursor-pointer border bg-[#101010] p-8 transition ${
                          selectedContractor.id === contractor.id
                            ? "border-[#cfe0ad]"
                            : "border-[#2a2a2a] hover:border-[#3a3a3a]"
                        }`}
                        onClick={() => setSelectedContractor(contractor)}
                      >
                      <div className="flex items-start gap-6">
                        <Avatar className="h-20 w-20 border-2 border-[#2a2a2a]">
                          <AvatarFallback className="text-2xl">
                            {contractor.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="text-2xl font-semibold text-white">{contractor.name}</h3>
                          <p className="mt-1 text-lg text-[#bdbdbd]">{contractor.role}</p>
                          <p className="text-base text-[#8a8a8a]">{contractor.company}</p>
                          <div className="mt-4 flex items-center gap-2">
                            <Star size={20} className="fill-[#cfe0ad] text-[#cfe0ad]" />
                            <span className="text-xl font-semibold text-white">{contractor.rating}</span>
                            <span className="text-base text-[#8a8a8a]">({contractor.reviews} reviews)</span>
                          </div>
                          <div className="mt-4">
                            <span
                              className={`inline-block rounded-full px-4 py-1 text-sm font-semibold ${
                                contractor.status === "active"
                                  ? "bg-[#cfe0ad]/10 text-[#cfe0ad]"
                                  : "bg-[#b8d4f1]/10 text-[#b8d4f1]"
                              }`}
                            >
                              {contractor.status === "active" ? "Active" : "Scheduled"}
                            </span>
                          </div>
                        </div>
                      </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Contractor Details</h2>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedContractor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                  <div className="flex items-start gap-10">
                    <Avatar className="h-32 w-32 border-4 border-[#2a2a2a]">
                      <AvatarFallback className="text-5xl">
                        {selectedContractor.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-4xl font-bold text-white">{selectedContractor.name}</h3>
                          <p className="mt-2 text-2xl text-[#bdbdbd]">{selectedContractor.role}</p>
                          <p className="mt-1 text-xl text-[#8a8a8a]">{selectedContractor.company}</p>
                        </div>
                        <div className="flex items-center gap-3 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-6 py-3">
                          <Star size={24} className="fill-[#cfe0ad] text-[#cfe0ad]" />
                          <span className="text-2xl font-bold text-white">{selectedContractor.rating}</span>
                          <span className="text-lg text-[#8a8a8a]">/ 5.0</span>
                        </div>
                      </div>

                      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-6">
                          <div className="flex items-center gap-4">
                            <Phone size={24} className="text-[#cfe0ad]" />
                            <div>
                              <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Phone</p>
                              <p className="mt-1 text-xl text-white">{selectedContractor.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Mail size={24} className="text-[#cfe0ad]" />
                            <div>
                              <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Email</p>
                              <p className="mt-1 text-xl text-white">{selectedContractor.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <MapPin size={24} className="text-[#cfe0ad]" />
                            <div>
                              <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Location</p>
                              <p className="mt-1 text-xl text-white">{selectedContractor.location}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div className="flex items-center gap-4">
                            <Calendar size={24} className="text-[#cfe0ad]" />
                            <div>
                              <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Joined Date</p>
                              <p className="mt-1 text-xl text-white">{selectedContractor.joinedDate}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Availability</p>
                            <p className="mt-1 text-xl text-white">{selectedContractor.availability}</p>
                          </div>
                          <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">Daily Rate</p>
                            <p className="mt-1 text-3xl font-bold text-[#cfe0ad]">{selectedContractor.cost}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 border-t border-[#2a2a2a] pt-10">
                    <h4 className="text-2xl font-semibold text-white">Specialties</h4>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {selectedContractor.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-6 py-2 text-lg text-white"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-10 border-t border-[#2a2a2a] pt-10">
                    <h4 className="text-2xl font-semibold text-white">Current Assignment</h4>
                    <p className="mt-3 text-2xl text-[#cfe0ad]">{selectedContractor.currentTask}</p>
                  </div>

                  <div className="mt-10 flex gap-6">
                    <button
                      type="button"
                      className="flex-1 rounded-full bg-[#cfe0ad] py-5 text-xl font-semibold text-black transition hover:bg-[#d4e4b8]"
                    >
                      Send Message
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] py-5 text-xl font-semibold text-white transition hover:border-[#3a3a3a]"
                    >
                      View Work History
                    </button>
                    </div>
                    </Card>
                  </motion.div>
                </AnimatePresence>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Performance Overview</h2>
                <motion.div
                  className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  <motion.div variants={scaleIn}>
                    <Card className="flex flex-col items-center justify-center rounded-[46px] border border-[#242424] bg-[#101010] p-10">
                      <div className="text-sm uppercase tracking-[0.4em] text-[#bdbdbd]">Tasks Completed</div>
                      <div className="mt-4 text-6xl font-black text-[#cfe0ad]">24</div>
                      <p className="mt-2 text-lg text-[#b9b9b9]">This Project</p>
                    </Card>
                  </motion.div>

                  <motion.div variants={scaleIn}>
                    <Card className="flex flex-col items-center justify-center rounded-[46px] border border-[#242424] bg-[#101010] p-10">
                      <div className="text-sm uppercase tracking-[0.4em] text-[#bdbdbd]">On-Time Rate</div>
                      <div className="mt-4 text-6xl font-black text-[#cfe0ad]">96%</div>
                      <p className="mt-2 text-lg text-[#b9b9b9]">Delivery</p>
                    </Card>
                  </motion.div>

                  <motion.div variants={scaleIn}>
                    <Card className="flex flex-col items-center justify-center rounded-[46px] border border-[#242424] bg-[#101010] p-10">
                      <div className="text-sm uppercase tracking-[0.4em] text-[#bdbdbd]">Total Projects</div>
                      <div className="mt-4 text-6xl font-black text-[#cfe0ad]">8</div>
                      <p className="mt-2 text-lg text-[#b9b9b9]">With Company</p>
                    </Card>
                  </motion.div>
                </motion.div>
              </section>

              <section className="mt-20">
                <button
                  type="button"
                  className="flex h-[200px] w-full items-center justify-center rounded-[50px] border-2 border-dashed border-[#2a2a2a] bg-[#111] text-2xl text-white transition hover:border-[#3a3a3a]"
                >
                  <span className="flex items-center gap-4">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#3a3a3a] text-4xl">+</span>
                    Add New Contractor
                  </span>
                </button>
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
    </AnimatedPage>
  );
}
