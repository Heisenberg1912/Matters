import { motion } from "framer-motion";
import PageLayout from "@/components/page-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Mail, Phone } from "lucide-react";
import { useTeamStore } from "@/store";
import { staggerContainer, listItem } from "@/lib/animations";
import { useState } from "react";
import { useProject } from "@/context/ProjectContext";
import { useNotifications } from "@/hooks/use-notifications";

export default function TeamManagement() {
  const { currentProject } = useProject();
  const members = useTeamStore((state) => state.members);
  const invites = useTeamStore((state) => state.invites);
  const activeMembersCount = useTeamStore((state) => state.getActiveMembersCount());
  const roles = useTeamStore((state) => state.getRoles());
  const [selectedRole, setSelectedRole] = useState<string>("All");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const inviteMember = useTeamStore((state) => state.inviteMember);
  const isSubmitting = useTeamStore((state) => state.isSubmitting);
  const teamError = useTeamStore((state) => state.error);
  const { showToast } = useNotifications();

  const filteredMembers = selectedRole === "All"
    ? members
    : members.filter(m => m.role === selectedRole);

  const roleCategories = ["All", ...roles];

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentProject) {
      showToast({ type: "error", message: "Select a project first" });
      return;
    }

    try {
      await inviteMember(currentProject._id, inviteEmail, inviteRole);
      showToast({ type: "success", message: "Invitation sent" });
      setInviteEmail("");
      setInviteRole("viewer");
      setInviteOpen(false);
    } catch (error) {
      showToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to send invite",
      });
    }
  };

  const inviteDialog = (
    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="name@company.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              required
              className="touch-target"
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="touch-target">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {["manager", "supervisor", "worker", "viewer"].map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full touch-target" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Invite"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <PageLayout
      title="Team Management"
      extras={inviteDialog}
      contentClassName="px-4 xs:px-5 sm:px-6 md:px-10 lg:px-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        {/* Team Overview */}
        <section className="mt-8 xs:mt-12 sm:mt-16">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Team Overview</h2>
          {!currentProject && (
            <Card className="mt-4 border border-[#242424] bg-[#101010] p-4 text-sm xs:text-base text-[#bdbdbd]">
              Select or create a project to manage your team.
            </Card>
          )}
          {teamError && (
            <Card className="mt-4 border border-red-500/40 bg-red-500/10 p-4 text-sm xs:text-base text-red-200">
              {teamError}
            </Card>
          )}
          <motion.div
            className="mt-4 xs:mt-6 sm:mt-8 grid grid-cols-1 gap-4 xs:gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={listItem}>
              <Card className="flex flex-col items-center justify-center rounded-[30px] xs:rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-6 xs:p-8 sm:p-10">
                <Users size={48} className="text-[#cfe0ad] xs:w-16 xs:h-16" strokeWidth={1.5} />
                <div className="mt-4 xs:mt-6 text-4xl xs:text-5xl sm:text-6xl font-black text-white">{members.length}</div>
                <p className="mt-2 text-base xs:text-lg sm:text-xl text-[#b9b9b9]">Total Members</p>
              </Card>
            </motion.div>

            <motion.div variants={listItem}>
              <Card className="flex flex-col items-center justify-center rounded-[30px] xs:rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-6 xs:p-8 sm:p-10">
                <UserPlus size={48} className="text-[#4ade80] xs:w-16 xs:h-16" strokeWidth={1.5} />
                <div className="mt-4 xs:mt-6 text-4xl xs:text-5xl sm:text-6xl font-black text-white">{activeMembersCount}</div>
                <p className="mt-2 text-base xs:text-lg sm:text-xl text-[#b9b9b9]">Active Members</p>
              </Card>
            </motion.div>

            <motion.div variants={listItem}>
              <Card className="flex flex-col items-center justify-center rounded-[30px] xs:rounded-[46px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-6 xs:p-8 sm:p-10">
                <div className="text-xs xs:text-sm uppercase tracking-[0.3em] xs:tracking-[0.4em] text-[#bdbdbd]">Roles</div>
                <div className="mt-3 xs:mt-4 text-4xl xs:text-5xl sm:text-6xl font-black text-[#b8d4f1]">{roles.length}</div>
                <p className="mt-2 text-base xs:text-lg sm:text-xl text-[#b9b9b9]">Different Roles</p>
              </Card>
            </motion.div>
          </motion.div>
        </section>

        {/* Role Filter */}
        <section className="mt-12 xs:mt-16 sm:mt-20">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Filter by Role</h2>
          <div className="scroll-x-container mt-4 xs:mt-6 sm:mt-8">
            {roleCategories.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`shrink-0 rounded-full border px-5 xs:px-6 sm:px-8 py-2 xs:py-3 text-sm xs:text-base sm:text-lg font-semibold transition touch-target focus-ring ${
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
        <section className="mt-10 xs:mt-12 sm:mt-16">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Team Members</h2>
          <motion.div
            className="mt-4 xs:mt-6 sm:mt-8 grid grid-cols-1 gap-4 xs:gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {filteredMembers.map((member) => (
              <motion.div key={member.id} variants={listItem}>
                <Card className="border border-[#2a2a2a] bg-[#101010] p-4 xs:p-6 sm:p-8 transition hover:border-[#3a3a3a]">
                  <div className="flex items-start gap-3 xs:gap-4">
                    <Avatar className="h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 border-2 border-[#232323] shrink-0">
                      <AvatarFallback className="bg-[#cfe0ad] text-black text-base xs:text-lg sm:text-xl font-bold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-white truncate">{member.name}</h3>
                      <p className="mt-1 text-sm xs:text-base text-[#cfe0ad]">{member.role}</p>
                      <p className="mt-1 text-xs xs:text-sm text-[#8a8a8a]">{member.department}</p>
                    </div>
                    <div className={`flex h-2 w-2 xs:h-3 xs:w-3 rounded-full shrink-0 ${
                      member.status === 'active' ? 'bg-[#4ade80]' : 'bg-[#6a6a6a]'
                    }`} />
                  </div>

                  <div className="mt-4 xs:mt-6 space-y-2 xs:space-y-3">
                    <div className="flex items-center gap-2 xs:gap-3 text-[#bdbdbd]">
                      <Mail size={14} className="xs:w-4 xs:h-4 shrink-0" />
                      <span className="text-xs xs:text-sm truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 xs:gap-3 text-[#bdbdbd]">
                      <Phone size={14} className="xs:w-4 xs:h-4 shrink-0" />
                      <span className="text-xs xs:text-sm">{member.phone}</span>
                    </div>
                  </div>

                  <div className="mt-4 xs:mt-6 pt-4 xs:pt-6 border-t border-[#2a2a2a]">
                    <div className="flex items-center justify-between text-xs xs:text-sm">
                      <span className="text-[#8a8a8a]">Joined</span>
                      <span className="text-white">{member.joinDate}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {invites.length > 0 && (
          <section className="mt-10 xs:mt-12 sm:mt-16">
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold tracking-tight text-white">Pending Invites</h2>
            <div className="mt-4 xs:mt-6 grid grid-cols-1 gap-3 xs:gap-4 md:grid-cols-2">
              {invites.map((invite) => (
                <Card key={`${invite.email}-${invite.role}`} className="border border-[#2a2a2a] bg-[#101010] p-4 xs:p-6">
                  <p className="text-base xs:text-lg font-semibold text-white truncate">{invite.email}</p>
                  <p className="mt-1 text-xs xs:text-sm text-[#bdbdbd]">Role: {invite.role}</p>
                  {invite.expiresAt && (
                    <p className="mt-2 text-xs text-[#8a8a8a]">
                      Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Add New Member Button */}
        <section className="mt-12 xs:mt-16 sm:mt-20">
          <button
            type="button"
            className="flex h-[140px] xs:h-[170px] sm:h-[200px] w-full items-center justify-center rounded-[35px] xs:rounded-[40px] sm:rounded-[50px] border-2 border-dashed border-[#2a2a2a] bg-[#111] text-lg xs:text-xl sm:text-2xl text-white transition hover:border-[#3a3a3a] disabled:opacity-60 touch-target focus-ring"
            onClick={() => setInviteOpen(true)}
            disabled={!currentProject}
          >
            <span className="flex items-center gap-3 xs:gap-4">
              <span className="flex h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-[#3a3a3a] text-2xl xs:text-3xl sm:text-4xl">+</span>
              Add New Team Member
            </span>
          </button>
        </section>
      </div>
    </PageLayout>
  );
}
