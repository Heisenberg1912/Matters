import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/bottom-nav";
import PhoneShell from "@/components/phone-shell";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Calendar, Clock, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { staggerContainer, listItem, scaleIn, slideUp, cardHover } from "@/lib/animations";

const scheduleItems = [
  {
    id: "1",
    phase: "Foundation",
    tasks: [
      { name: "Site excavation", startDate: "Dec 1, 2025", endDate: "Dec 5, 2025", status: "completed", progress: 100, assignedTo: "Rajesh Kumar" },
      { name: "Steel reinforcement", startDate: "Dec 6, 2025", endDate: "Dec 9, 2025", status: "completed", progress: 100, assignedTo: "Rajesh Kumar" },
      { name: "Foundation concrete", startDate: "Dec 10, 2025", endDate: "Dec 12, 2025", status: "completed", progress: 100, assignedTo: "Rajesh Kumar" },
      { name: "Curing & backfilling", startDate: "Dec 13, 2025", endDate: "Dec 16, 2025", status: "completed", progress: 100, assignedTo: "Rajesh Kumar" }
    ]
  },
  {
    id: "2",
    phase: "Structure - Ground Floor",
    tasks: [
      { name: "Column & beam work", startDate: "Dec 17, 2025", endDate: "Dec 22, 2025", status: "in-progress", progress: 60, assignedTo: "Rajesh Kumar" },
      { name: "Slab casting", startDate: "Dec 23, 2025", endDate: "Dec 26, 2025", status: "pending", progress: 0, assignedTo: "Rajesh Kumar" },
      { name: "Brickwork", startDate: "Dec 27, 2025", endDate: "Jan 5, 2026", status: "pending", progress: 0, assignedTo: "Rajesh Kumar" }
    ]
  },
  {
    id: "3",
    phase: "MEP - Ground Floor",
    tasks: [
      { name: "Electrical conduit", startDate: "Dec 20, 2025", endDate: "Dec 28, 2025", status: "in-progress", progress: 40, assignedTo: "Amit Sharma" },
      { name: "Plumbing rough-in", startDate: "Dec 22, 2025", endDate: "Dec 30, 2025", status: "in-progress", progress: 35, assignedTo: "Vikram Patel" },
      { name: "HVAC ducts", startDate: "Jan 2, 2026", endDate: "Jan 8, 2026", status: "pending", progress: 0, assignedTo: "TBD" }
    ]
  },
  {
    id: "4",
    phase: "Structure - First Floor",
    tasks: [
      { name: "Column & beam work", startDate: "Jan 6, 2026", endDate: "Jan 12, 2026", status: "pending", progress: 0, assignedTo: "Rajesh Kumar" },
      { name: "Slab casting", startDate: "Jan 13, 2026", endDate: "Jan 16, 2026", status: "pending", progress: 0, assignedTo: "Rajesh Kumar" },
      { name: "Brickwork", startDate: "Jan 17, 2026", endDate: "Jan 28, 2026", status: "pending", progress: 0, assignedTo: "Rajesh Kumar" }
    ]
  },
  {
    id: "5",
    phase: "Finishing Works",
    tasks: [
      { name: "Plastering", startDate: "Feb 1, 2026", endDate: "Feb 20, 2026", status: "pending", progress: 0, assignedTo: "TBD" },
      { name: "Flooring", startDate: "Feb 21, 2026", endDate: "Mar 10, 2026", status: "pending", progress: 0, assignedTo: "TBD" },
      { name: "Painting", startDate: "Mar 11, 2026", endDate: "Mar 25, 2026", status: "pending", progress: 0, assignedTo: "TBD" },
      { name: "Fixtures & fittings", startDate: "Mar 26, 2026", endDate: "Apr 5, 2026", status: "pending", progress: 0, assignedTo: "TBD" }
    ]
  }
];

const upcomingMilestones = [
  { title: "Ground Floor Completion", date: "Jan 5, 2026", daysLeft: 19 },
  { title: "First Floor Completion", date: "Jan 28, 2026", daysLeft: 42 },
  { title: "Finishing Works Start", date: "Feb 1, 2026", daysLeft: 46 },
  { title: "Project Handover", date: "Apr 15, 2026", daysLeft: 119 }
];

export default function Schedule() {
  const [mode, setMode] = useState<"construction" | "refurbish">("construction");
  const [expandedPhase, setExpandedPhase] = useState<string | null>(scheduleItems[1].id);
  const navigate = useNavigate();

  const menuItems = [
    { label: "Your Subscription", path: "/subscription" },
    { label: "Hire a Contractor", path: "/hire-contractor" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "News & Updates", path: "/news-updates" },
    { label: "Visit Builtattic", path: "/visit-builtattic" },
    { label: "Settings", path: "/settings" }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={24} className="text-[#4ade80]" />;
      case "in-progress":
        return <Clock size={24} className="text-[#cfe0ad]" />;
      case "pending":
        return <Circle size={24} className="text-[#6a6a6a]" />;
      default:
        return <AlertCircle size={24} className="text-[#f87171]" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]";
      case "in-progress":
        return "bg-[#cfe0ad]/10 text-[#cfe0ad] border-[#cfe0ad]";
      case "pending":
        return "bg-[#6a6a6a]/10 text-[#bdbdbd] border-[#6a6a6a]";
      default:
        return "bg-[#f87171]/10 text-[#f87171] border-[#f87171]";
    }
  };

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
                <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Project Schedule</span>
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
                <h2 className="text-4xl font-bold tracking-tight text-white">Upcoming Milestones</h2>
                <motion.div
                  className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {upcomingMilestones.map((milestone) => (
                    <motion.div key={milestone.title} variants={scaleIn} whileHover={cardHover}>
                      <Card className="flex items-center gap-6 rounded-[34px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-8">
                        <Calendar size={48} className="text-[#cfe0ad]" strokeWidth={1.5} />
                        <div className="flex-1">
                          <h3 className="text-2xl font-semibold text-white">{milestone.title}</h3>
                          <p className="mt-2 text-xl text-[#bdbdbd]">{milestone.date}</p>
                          <p className="mt-1 text-lg text-[#8a8a8a]">{milestone.daysLeft} days remaining</p>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Project Timeline</h2>
                <motion.div
                  className="mt-8 space-y-6"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {scheduleItems.map((phase) => {
                    const isExpanded = expandedPhase === phase.id;
                    const completedTasks = phase.tasks.filter(t => t.status === "completed").length;
                    const totalTasks = phase.tasks.length;
                    const phaseProgress = Math.round((completedTasks / totalTasks) * 100);

                    return (
                      <motion.div key={phase.id} variants={listItem}>
                        <Card className="overflow-hidden rounded-[34px] border border-[#2a2a2a] bg-[#101010]">
                        <button
                          type="button"
                          onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                          className="w-full p-8 text-left transition hover:bg-[#151515]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="text-2xl font-semibold text-white">{phase.phase}</h3>
                              <div className="mt-4 flex items-center gap-4 text-lg text-[#bdbdbd]">
                                <span>{completedTasks} of {totalTasks} tasks completed</span>
                                <span>•</span>
                                <span>{phaseProgress}% complete</span>
                              </div>
                              <div className="mt-4 h-4 overflow-hidden rounded-full border border-[#2a2a2a] bg-[#0d0d0d]">
                                <div
                                  className="h-full rounded-full bg-[#cfe0ad]"
                                  style={{ width: `${phaseProgress}%` }}
                                />
                              </div>
                            </div>
                            <div className="ml-8 text-4xl text-[#bdbdbd]">
                              {isExpanded ? "−" : "+"}
                            </div>
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="border-t border-[#2a2a2a] bg-[#0a0a0a] overflow-hidden"
                            >
                              <div className="p-8 space-y-6">
                                {phase.tasks.map((task, taskIdx) => (
                                  <motion.div
                                    key={task.name}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: taskIdx * 0.05 }}
                                    className="flex items-start gap-6 rounded-[24px] border border-[#1f1f1f] bg-[#0d0d0d] p-6"
                                  >
                                  <div className="mt-1">
                                    {getStatusIcon(task.status)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                      <h4 className="text-xl font-semibold text-white">{task.name}</h4>
                                      <span className={`rounded-full border px-4 py-1 text-sm font-semibold ${getStatusColor(task.status)}`}>
                                        {task.status.replace("-", " ").toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="mt-3 flex gap-8 text-base text-[#bdbdbd]">
                                      <div>
                                        <span className="text-sm uppercase tracking-[0.2em] text-[#8a8a8a]">Start</span>
                                        <p className="mt-1">{task.startDate}</p>
                                      </div>
                                      <div>
                                        <span className="text-sm uppercase tracking-[0.2em] text-[#8a8a8a]">End</span>
                                        <p className="mt-1">{task.endDate}</p>
                                      </div>
                                      <div>
                                        <span className="text-sm uppercase tracking-[0.2em] text-[#8a8a8a]">Assigned To</span>
                                        <p className="mt-1">{task.assignedTo}</p>
                                      </div>
                                    </div>
                                    <div className="mt-4 h-3 overflow-hidden rounded-full border border-[#2a2a2a] bg-[#0d0d0d]">
                                      <div
                                        className="h-full rounded-full bg-[#cfe0ad]"
                                        style={{ width: `${task.progress}%` }}
                                      />
                                    </div>
                                  </div>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </section>

              <section className="mt-20">
                <h2 className="text-4xl font-bold tracking-tight text-white">Project Statistics</h2>
                <motion.div
                  className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  <motion.div variants={scaleIn}>
                    <Card className="flex flex-col items-center justify-center rounded-[34px] border border-[#242424] bg-[#101010] p-8">
                      <div className="text-6xl font-black text-[#4ade80]">7</div>
                      <p className="mt-2 text-xl text-[#b9b9b9]">Completed</p>
                    </Card>
                  </motion.div>
                  <motion.div variants={scaleIn}>
                    <Card className="flex flex-col items-center justify-center rounded-[34px] border border-[#242424] bg-[#101010] p-8">
                      <div className="text-6xl font-black text-[#cfe0ad]">5</div>
                      <p className="mt-2 text-xl text-[#b9b9b9]">In Progress</p>
                    </Card>
                  </motion.div>
                  <motion.div variants={scaleIn}>
                    <Card className="flex flex-col items-center justify-center rounded-[34px] border border-[#242424] bg-[#101010] p-8">
                      <div className="text-6xl font-black text-[#bdbdbd]">11</div>
                      <p className="mt-2 text-xl text-[#b9b9b9]">Pending</p>
                    </Card>
                  </motion.div>
                  <motion.div variants={scaleIn}>
                    <Card className="flex flex-col items-center justify-center rounded-[34px] border border-[#242424] bg-[#101010] p-8">
                      <div className="text-6xl font-black text-[#cfe0ad]">30%</div>
                      <p className="mt-2 text-xl text-[#b9b9b9]">Overall</p>
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
                    Add New Task
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
