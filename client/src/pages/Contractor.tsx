import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PageLayout from "@/components/page-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useProject } from "@/context/ProjectContext";
import { useScheduleStore, useTeamStore } from "@/store";
import { staggerContainer, listItem, scaleIn, cardHover } from "@/lib/animations";

const roleKeywords = [
  "contractor",
  "mason",
  "electric",
  "plumber",
  "carpenter",
  "architect",
  "engineer",
  "supervisor",
  "foreman",
  "worker",
  "manager",
];

export default function Contractor() {
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const { currentProject } = useProject();

  const teamMembers = useTeamStore((state) => state.members);
  const invites = useTeamStore((state) => state.invites);
  const teamError = useTeamStore((state) => state.error);
  const fetchTeamMembers = useTeamStore((state) => state.fetchTeamMembers);
  const inviteMember = useTeamStore((state) => state.inviteMember);

  const phases = useScheduleStore((state) => state.phases);
  const getTasksByStatus = useScheduleStore((state) => state.getTasksByStatus);
  const tasksByStatus = useMemo(() => getTasksByStatus(), [getTasksByStatus]);

  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "worker" });

  useEffect(() => {
    if (currentProject?._id) {
      fetchTeamMembers(currentProject._id);
    }
  }, [currentProject?._id, fetchTeamMembers]);

  const contractorProfiles = useMemo(() => {
    const taskList = phases.flatMap((phase) =>
      phase.tasks.map((task) => ({
        ...task,
        phaseName: phase.name,
      }))
    );

    const filtered = teamMembers.filter((member) =>
      roleKeywords.some((keyword) => member.role.toLowerCase().includes(keyword))
    );

    const roster = filtered.length > 0 ? filtered : teamMembers;

    return roster.map((member) => {
      const assignedTasks = taskList.filter(
        (task) => task.assignedTo?.toLowerCase() === member.name.toLowerCase()
      );
      const completedTasks = assignedTasks.filter((task) => task.status === "completed").length;
      const totalTasks = assignedTasks.length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const rating =
        totalTasks > 0 ? Math.min(5, 3.5 + completionRate / 100 * 1.5) : 0;

      const activeTask = assignedTasks.find((task) => task.status !== "completed");
      const availability =
        assignedTasks.length === 0 || !activeTask ? "Available" : "Engaged";

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        company: currentProject?.name ? `${currentProject.name} Team` : "Independent",
        rating: rating ? rating.toFixed(1) : "New",
        reviews: totalTasks,
        status: member.status,
        phone: member.phone || "Not provided",
        email: member.email || "Not provided",
        location:
          [currentProject?.location?.city, currentProject?.location?.state].filter(Boolean).join(", ") ||
          "On site",
        joinedDate: member.joinDate,
        specialties: [member.role],
        currentTask: activeTask?.name || "No active task",
        availability,
        completionRate,
      };
    });
  }, [currentProject?.location?.city, currentProject?.location?.state, currentProject?.name, phases, teamMembers]);

  useEffect(() => {
    if (!selectedContractorId && contractorProfiles.length > 0) {
      setSelectedContractorId(contractorProfiles[0].id);
    }
  }, [contractorProfiles, selectedContractorId]);

  const selectedContractor =
    contractorProfiles.find((contractor) => contractor.id === selectedContractorId) ||
    contractorProfiles[0];

  const contractorInvites = invites;

  const handleInvite = async () => {
    if (!currentProject?._id) {
      showToast({ type: "warning", message: "Select a project first" });
      return;
    }
    if (!inviteForm.email.trim()) {
      showToast({ type: "error", message: "Email is required" });
      return;
    }
    try {
      const normalizedRole = ["manager", "supervisor", "worker", "viewer"].includes(inviteForm.role)
        ? inviteForm.role
        : "worker";
      await inviteMember(currentProject._id, inviteForm.email.trim(), normalizedRole);
      showToast({ type: "success", message: "Invitation sent" });
      setInviteForm({ email: "", role: "worker" });
      setIsInviteOpen(false);
    } catch (error) {
      showToast({ type: "error", message: "Failed to invite contractor" });
    }
  };

  return (
    <PageLayout
      title="Contractor Management"
      extras={
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite contractor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-white">Email</label>
                <input
                  value={inviteForm.email}
                  onChange={(event) => setInviteForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4 py-3 text-base text-white outline-none focus:border-[#cfe0ad]"
                  placeholder="contractor@email.com"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-white">Project role</label>
                <select
                  value={inviteForm.role}
                  onChange={(event) => setInviteForm((prev) => ({ ...prev, role: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4 py-3 text-base text-white outline-none focus:border-[#cfe0ad]"
                >
                  <option value="manager">Manager</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="worker">Worker</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <button
                type="button"
                className="w-full rounded-full bg-[#cfe0ad] py-3 text-base font-semibold text-black transition hover:bg-[#d4e4b8]"
                onClick={handleInvite}
              >
                Send Invite
              </button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      {!currentProject && (
        <Card className="mt-6 border border-[#242424] bg-[#101010] p-4 text-base text-[#bdbdbd]">
          Select or create a project to manage contractors.
        </Card>
      )}
      {teamError && (
        <Card className="mt-4 border border-red-500/40 bg-red-500/10 p-4 text-base text-red-200">
          {teamError}
        </Card>
      )}

      <section className="mt-4 xs:mt-6 sm:mt-10 md:mt-16">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Active Contractors</h2>
          <button
            type="button"
            className="rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-3 py-1.5 xs:px-4 xs:py-2 text-xs xs:text-sm font-semibold text-white transition hover:border-[#cfe0ad] touch-target focus-ring"
            onClick={() => setIsInviteOpen(true)}
          >
            Invite
          </button>
        </div>
        <motion.div
          className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 gap-3 xs:gap-4 sm:gap-6 md:gap-8 md:grid-cols-2"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {contractorProfiles.length === 0 && (
            <Card className="border border-[#2a2a2a] bg-[#101010] p-4 xs:p-5 sm:p-6 text-sm xs:text-base sm:text-lg text-[#bdbdbd]">
              No contractors yet. Invite a contractor to get started.
            </Card>
          )}
          {contractorProfiles.map((contractor) => (
            <motion.div
              key={contractor.id}
              variants={listItem}
              whileHover={cardHover}
            >
              <Card
                className={`cursor-pointer border bg-[#101010] p-3 xs:p-4 sm:p-6 md:p-8 transition touch-target ${
                  selectedContractor?.id === contractor.id
                    ? "border-[#cfe0ad]"
                    : "border-[#2a2a2a] hover:border-[#3a3a3a]"
                }`}
                onClick={() => setSelectedContractorId(contractor.id)}
              >
                <div className="flex items-start gap-2 xs:gap-3 sm:gap-4 md:gap-6">
                  <Avatar className="h-10 w-10 xs:h-12 xs:w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 border-2 border-[#2a2a2a] shrink-0">
                    <AvatarFallback className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl">
                      {contractor.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white truncate">{contractor.name}</h3>
                    <p className="mt-0.5 text-xs xs:text-sm sm:text-base md:text-lg text-[#bdbdbd]">{contractor.role}</p>
                    <p className="text-[0.65rem] xs:text-xs sm:text-sm md:text-base text-[#8a8a8a] truncate">{contractor.company}</p>
                    <div className="mt-2 xs:mt-3 flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                      <Star size={14} className="fill-[#cfe0ad] text-[#cfe0ad] xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-white">{contractor.rating}</span>
                      <span className="text-[0.6rem] xs:text-xs sm:text-sm md:text-base text-[#8a8a8a]">({contractor.reviews} tasks)</span>
                    </div>
                    <div className="mt-2 xs:mt-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 xs:px-3 sm:px-4 xs:py-1 text-[0.6rem] xs:text-xs sm:text-sm font-semibold ${
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

      {contractorInvites.length > 0 && (
        <section className="mt-6 xs:mt-8">
          <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-white">Pending Invitations</h3>
          <div className="mt-3 xs:mt-4 space-y-2 xs:space-y-3">
            {contractorInvites.map((invite) => (
              <Card key={invite.email} className="border border-[#2a2a2a] bg-[#101010] p-3 xs:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm xs:text-base sm:text-lg font-semibold text-white">{invite.email}</p>
                    <p className="text-xs xs:text-sm text-[#bdbdbd]">Role: {invite.role}</p>
                  </div>
                  {invite.expiresAt && (
                    <span className="text-xs xs:text-sm text-[#8a8a8a]">
                      Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {selectedContractor && (
        <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-20">
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Contractor Details</h2>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedContractor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="mt-4 xs:mt-6 sm:mt-8 border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-4 xs:p-5 sm:p-8 md:p-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 xs:gap-6 sm:gap-8 md:gap-10">
                  <Avatar className="h-16 w-16 xs:h-20 xs:w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 border-4 border-[#2a2a2a] shrink-0">
                    <AvatarFallback className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl">
                      {selectedContractor.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 w-full text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-3 xs:gap-4">
                      <div>
                        <h3 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-white">{selectedContractor.name}</h3>
                        <p className="mt-1 text-base xs:text-lg sm:text-xl md:text-2xl text-[#bdbdbd]">{selectedContractor.role}</p>
                        <p className="mt-1 text-sm xs:text-base sm:text-lg md:text-xl text-[#8a8a8a]">{selectedContractor.company}</p>
                      </div>
                      <div className="flex items-center gap-2 xs:gap-3 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-3 xs:px-4 sm:px-6 py-1.5 xs:py-2 sm:py-3">
                        <Star size={16} className="fill-[#cfe0ad] text-[#cfe0ad] xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                        <span className="text-lg xs:text-xl sm:text-2xl font-bold text-white">{selectedContractor.rating}</span>
                        <span className="text-sm xs:text-base sm:text-lg text-[#8a8a8a]">/ 5.0</span>
                      </div>
                    </div>

                    <div className="mt-4 xs:mt-6 sm:mt-8 md:mt-10 grid grid-cols-1 gap-3 xs:gap-4 sm:gap-6 md:grid-cols-2">
                      <div className="space-y-3 xs:space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                          <Phone size={16} className="text-[#cfe0ad] shrink-0 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                          <div className="min-w-0">
                            <p className="text-[0.6rem] xs:text-xs sm:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Phone</p>
                            <p className="mt-0.5 xs:mt-1 text-sm xs:text-base sm:text-lg md:text-xl text-white truncate">{selectedContractor.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                          <Mail size={16} className="text-[#cfe0ad] shrink-0 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                          <div className="min-w-0">
                            <p className="text-[0.6rem] xs:text-xs sm:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Email</p>
                            <p className="mt-0.5 xs:mt-1 text-sm xs:text-base sm:text-lg md:text-xl text-white truncate">{selectedContractor.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                          <MapPin size={16} className="text-[#cfe0ad] shrink-0 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                          <div className="min-w-0">
                            <p className="text-[0.6rem] xs:text-xs sm:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Location</p>
                            <p className="mt-0.5 xs:mt-1 text-sm xs:text-base sm:text-lg md:text-xl text-white">{selectedContractor.location}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 xs:space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                          <Calendar size={16} className="text-[#cfe0ad] shrink-0 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                          <div className="min-w-0">
                            <p className="text-[0.6rem] xs:text-xs sm:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Joined Date</p>
                            <p className="mt-0.5 xs:mt-1 text-sm xs:text-base sm:text-lg md:text-xl text-white">{selectedContractor.joinedDate}</p>
                          </div>
                        </div>
                        <div className="pl-6 xs:pl-8 sm:pl-10">
                          <p className="text-[0.6rem] xs:text-xs sm:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Availability</p>
                          <p className="mt-0.5 xs:mt-1 text-sm xs:text-base sm:text-lg md:text-xl text-white">{selectedContractor.availability}</p>
                        </div>
                        <div className="pl-6 xs:pl-8 sm:pl-10">
                          <p className="text-[0.6rem] xs:text-xs sm:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] text-[#8a8a8a]">Completion Rate</p>
                          <p className="mt-0.5 xs:mt-1 text-xl xs:text-2xl sm:text-3xl font-bold text-[#cfe0ad]">{selectedContractor.completionRate}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 xs:mt-6 sm:mt-8 md:mt-10 border-t border-[#2a2a2a] pt-4 xs:pt-6 sm:pt-8 md:pt-10">
                  <h4 className="text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white">Specialties</h4>
                  <div className="mt-2 xs:mt-3 sm:mt-4 flex flex-wrap gap-2 xs:gap-3">
                    {selectedContractor.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="rounded-full border border-[#2a2a2a] bg-[#0c0c0c] px-3 xs:px-4 sm:px-6 py-1 xs:py-1.5 sm:py-2 text-xs xs:text-sm sm:text-base md:text-lg text-white"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 xs:mt-6 sm:mt-8 md:mt-10 border-t border-[#2a2a2a] pt-4 xs:pt-6 sm:pt-8 md:pt-10">
                  <h4 className="text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-white">Current Assignment</h4>
                  <p className="mt-2 xs:mt-3 text-base xs:text-lg sm:text-xl md:text-2xl text-[#cfe0ad]">{selectedContractor.currentTask}</p>
                </div>

                <div className="mt-4 xs:mt-6 sm:mt-8 md:mt-10 flex flex-col sm:flex-row gap-2 xs:gap-3 sm:gap-4 md:gap-6">
                  <button
                    type="button"
                    className="flex-1 rounded-full bg-[#cfe0ad] py-2.5 xs:py-3 sm:py-4 md:py-5 text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-black transition hover:bg-[#d4e4b8] touch-target focus-ring"
                    onClick={() => navigate(`/contractor-chat?contactId=${selectedContractor.id}`)}
                  >
                    Send Message
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-full border border-[#2a2a2a] bg-[#0c0c0c] py-2.5 xs:py-3 sm:py-4 md:py-5 text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-white transition hover:border-[#3a3a3a] touch-target focus-ring"
                    onClick={() => navigate("/schedule")}
                  >
                    View Work History
                  </button>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </section>
      )}

      <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-20">
        <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Performance Overview</h2>
        <motion.div
          className="mt-3 xs:mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 gap-3 xs:gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={scaleIn}>
            <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[30px] sm:rounded-[40px] md:rounded-[46px] border border-[#242424] bg-[#101010] p-4 xs:p-6 sm:p-8 md:p-10">
              <div className="text-[0.55rem] xs:text-xs sm:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] sm:tracking-[0.4em] text-[#bdbdbd]">Tasks Completed</div>
              <div className="mt-2 xs:mt-3 md:mt-4 text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black text-[#cfe0ad]">{tasksByStatus.completed}</div>
              <p className="mt-1 xs:mt-2 text-xs xs:text-sm sm:text-base md:text-lg text-[#b9b9b9]">This Project</p>
            </Card>
          </motion.div>

          <motion.div variants={scaleIn}>
            <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[30px] sm:rounded-[40px] md:rounded-[46px] border border-[#242424] bg-[#101010] p-4 xs:p-6 sm:p-8 md:p-10">
              <div className="text-[0.55rem] xs:text-xs sm:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] sm:tracking-[0.4em] text-[#bdbdbd]">Active Contractors</div>
              <div className="mt-2 xs:mt-3 md:mt-4 text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black text-[#cfe0ad]">
                {contractorProfiles.filter((c) => c.status === "active").length}
              </div>
              <p className="mt-1 xs:mt-2 text-xs xs:text-sm sm:text-base md:text-lg text-[#b9b9b9]">Currently assigned</p>
            </Card>
          </motion.div>

          <motion.div variants={scaleIn}>
            <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[30px] sm:rounded-[40px] md:rounded-[46px] border border-[#242424] bg-[#101010] p-4 xs:p-6 sm:p-8 md:p-10 sm:col-span-2 lg:col-span-1">
              <div className="text-[0.55rem] xs:text-xs sm:text-sm uppercase tracking-[0.2em] xs:tracking-[0.3em] sm:tracking-[0.4em] text-[#bdbdbd]">Total Contractors</div>
              <div className="mt-2 xs:mt-3 md:mt-4 text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black text-[#cfe0ad]">{contractorProfiles.length}</div>
              <p className="mt-1 xs:mt-2 text-xs xs:text-sm sm:text-base md:text-lg text-[#b9b9b9]">On this project</p>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      <section className="mt-6 xs:mt-8 sm:mt-12 md:mt-20">
        <button
          type="button"
          className="flex h-[100px] xs:h-[120px] sm:h-[150px] md:h-[180px] lg:h-[200px] w-full items-center justify-center rounded-[20px] xs:rounded-[30px] sm:rounded-[40px] md:rounded-[50px] border-2 border-dashed border-[#2a2a2a] bg-[#111] text-base xs:text-lg sm:text-xl md:text-2xl text-white transition hover:border-[#3a3a3a] touch-target focus-ring"
          onClick={() => setIsInviteOpen(true)}
        >
          <span className="flex items-center gap-2 xs:gap-3 sm:gap-4">
            <span className="flex h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full border border-[#3a3a3a] text-2xl xs:text-3xl sm:text-4xl">+</span>
            <span className="hidden xs:inline">Add New Contractor</span>
            <span className="xs:hidden">Add Contractor</span>
          </span>
        </button>
      </section>
    </PageLayout>
  );
}
