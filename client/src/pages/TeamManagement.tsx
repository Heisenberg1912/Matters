import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BottomNav from "@/components/bottom-nav";
import PhoneShell from "@/components/phone-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Users, UserPlus, Mail, Phone } from "lucide-react";
import { useProjectStore, useTeamStore } from "@/store";
import { staggerContainer, listItem } from "@/lib/animations";
import { useState } from "react";

export default function TeamManagement() {
  const navigate = useNavigate();
  const mode = useProjectStore((state) => state.mode);
  const setMode = useProjectStore((state) => state.setMode);
  const members = useTeamStore((state) => state.members);
  const activeMembersCount = useTeamStore((state) => state.getActiveMembersCount());
  const roles = useTeamStore((state) => state.getRoles());
  const [selectedRole, setSelectedRole] = useState<string>("All");

  const menuItems = [
    { label: "Your Subscription", path: "/subscription" },
    { label: "Hire a Contractor", path: "/hire-contractor" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "News & Updates", path: "/news-updates" },
    { label: "Visit Builtattic", path: "/visit-builtattic" },
    { label: "Settings", path: "/settings" }
  ];

  const filteredMembers = selectedRole === "All"
    ? members
    : members.filter(m => m.role === selectedRole);

  const roleCategories = ["All", ...roles];

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
              <span className="text-sm uppercase tracking-[0.35em] text-[#c7c7c7]">Team Management</span>
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
            <AnimatedPage>
              <div className="mx-auto w-full max-w-6xl">
                {/* Team Overview */}
                <section className="mt-16">
                  <h2 className="text-4xl font-bold tracking-tight text-white">Team Overview</h2>
                  <motion.div
                    className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    <motion.div variants={listItem}>
                      <Card className="flex flex-col items-center justify-center rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                        <Users size={64} className="text-[#cfe0ad]" strokeWidth={1.5} />
                        <div className="mt-6 text-6xl font-black text-white">{members.length}</div>
                        <p className="mt-2 text-xl text-[#b9b9b9]">Total Members</p>
                      </Card>
                    </motion.div>

                    <motion.div variants={listItem}>
                      <Card className="flex flex-col items-center justify-center rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                        <UserPlus size={64} className="text-[#4ade80]" strokeWidth={1.5} />
                        <div className="mt-6 text-6xl font-black text-white">{activeMembersCount}</div>
                        <p className="mt-2 text-xl text-[#b9b9b9]">Active Members</p>
                      </Card>
                    </motion.div>

                    <motion.div variants={listItem}>
                      <Card className="flex flex-col items-center justify-center rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-10">
                        <div className="text-sm uppercase tracking-[0.4em] text-[#bdbdbd]">Roles</div>
                        <div className="mt-4 text-6xl font-black text-[#b8d4f1]">{roles.length}</div>
                        <p className="mt-2 text-xl text-[#b9b9b9]">Different Roles</p>
                      </Card>
                    </motion.div>
                  </motion.div>
                </section>

                {/* Role Filter */}
                <section className="mt-20">
                  <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-bold tracking-tight text-white">Filter by Role</h2>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-4">
                    {roleCategories.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`rounded-full border px-8 py-3 text-lg font-semibold transition ${
                          selectedRole === role
                            ? "border-[#cfe0ad] bg-[#cfe0ad] text-black"
                            : "border-[#2a2a2a] bg-[#0c0c0c] text-white hover:border-[#3a3a3a]"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Team Members Grid */}
                <section className="mt-16">
                  <h2 className="text-4xl font-bold tracking-tight text-white">Team Members</h2>
                  <motion.div
                    className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    {filteredMembers.map((member) => (
                      <motion.div key={member.id} variants={listItem}>
                        <Card className="border border-[#2a2a2a] bg-[#101010] p-8 transition hover:border-[#3a3a3a]">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16 border-2 border-[#232323]">
                              <AvatarFallback className="bg-[#cfe0ad] text-black text-xl font-bold">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                              <p className="mt-1 text-base text-[#cfe0ad]">{member.role}</p>
                              <p className="mt-1 text-sm text-[#8a8a8a]">{member.department}</p>
                            </div>
                            <div className={`flex h-3 w-3 rounded-full ${
                              member.status === 'active' ? 'bg-[#4ade80]' : 'bg-[#6a6a6a]'
                            }`} />
                          </div>

                          <div className="mt-6 space-y-3">
                            <div className="flex items-center gap-3 text-[#bdbdbd]">
                              <Mail size={16} />
                              <span className="text-sm">{member.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[#bdbdbd]">
                              <Phone size={16} />
                              <span className="text-sm">{member.phone}</span>
                            </div>
                          </div>

                          <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#8a8a8a]">Joined</span>
                              <span className="text-white">{member.joinDate}</span>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </section>

                {/* Add New Member Button */}
                <section className="mt-20">
                  <button
                    type="button"
                    className="flex h-[200px] w-full items-center justify-center rounded-[50px] border-2 border-dashed border-[#2a2a2a] bg-[#111] text-2xl text-white transition hover:border-[#3a3a3a]"
                  >
                    <span className="flex items-center gap-4">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#3a3a3a] text-4xl">+</span>
                      Add New Team Member
                    </span>
                  </button>
                </section>
              </div>
            </AnimatedPage>
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
