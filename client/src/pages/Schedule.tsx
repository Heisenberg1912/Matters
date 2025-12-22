import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PageLayout from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useProject } from "@/context/ProjectContext";
import { useScheduleStore, useTeamStore } from "@/store";
import { staggerContainer, listItem, scaleIn, cardHover } from "@/lib/animations";

type TaskStatus = "completed" | "in_progress" | "pending";

const formatDate = (value?: string) => {
  if (!value) return "TBD";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "TBD" : date.toLocaleDateString();
};

const getDaysRemaining = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diff = date.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export default function Schedule() {
  const { showToast } = useNotifications();
  const { currentProject } = useProject();

  const phases = useScheduleStore((state) => state.phases);
  const getUpcomingMilestones = useScheduleStore((state) => state.getUpcomingMilestones);
  const expandedPhase = useScheduleStore((state) => state.expandedPhase);
  const togglePhase = useScheduleStore((state) => state.togglePhase);
  const addTask = useScheduleStore((state) => state.addTask);
  const updateTaskStatus = useScheduleStore((state) => state.updateTaskStatus);
  const scheduleError = useScheduleStore((state) => state.error);
  const isSubmitting = useScheduleStore((state) => state.isSubmitting);
  const getTasksByStatus = useScheduleStore((state) => state.getTasksByStatus);
  const getOverallProgress = useScheduleStore((state) => state.getOverallProgress);
  const fetchScheduleData = useScheduleStore((state) => state.fetchScheduleData);

  const milestones = useMemo(() => getUpcomingMilestones(), [getUpcomingMilestones]);
  const tasksByStatus = useMemo(() => getTasksByStatus(), [getTasksByStatus]);
  const overallProgress = useMemo(() => getOverallProgress(), [getOverallProgress]);

  const teamMembers = useTeamStore((state) => state.members);

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [taskForm, setTaskForm] = useState({
    name: "",
    phaseId: "",
    assignedTo: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  useEffect(() => {
    if (currentProject?._id) {
      fetchScheduleData(currentProject._id);
    }
  }, [currentProject?._id, fetchScheduleData]);

  const handleAddTaskClick = useCallback(() => {
    if (!currentProject?._id) {
      showToast({ type: "warning", message: "Select a project first" });
      return;
    }
    if (phases.length === 0) {
      showToast({ type: "warning", message: "Create a phase before adding tasks" });
      return;
    }
    setTaskForm({
      name: "",
      phaseId: phases[0]?.id || "",
      assignedTo: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      description: "",
    });
    setIsAddTaskOpen(true);
  }, [currentProject?._id, phases, showToast]);

  useEffect(() => {
    if (searchParams.get("quickAdd") !== "task") return;
    handleAddTaskClick();
    const next = new URLSearchParams(searchParams);
    next.delete("quickAdd");
    setSearchParams(next, { replace: true });
  }, [handleAddTaskClick, searchParams, setSearchParams]);

  const handleSaveTask = async () => {
    if (!taskForm.name.trim() || !taskForm.phaseId) {
      showToast({ type: "error", message: "Task name and phase are required" });
      return;
    }
    const startDate = taskForm.startDate || new Date().toISOString().split("T")[0];
    const endDate = taskForm.endDate || startDate;
    try {
      await addTask({
        phaseId: taskForm.phaseId,
        name: taskForm.name.trim(),
        status: "pending",
        startDate,
        endDate,
        assignedTo: taskForm.assignedTo || undefined,
        description: taskForm.description.trim() || undefined,
      });
      showToast({ type: "success", message: "Task added" });
      setIsAddTaskOpen(false);
    } catch (error) {
      showToast({ type: "error", message: "Failed to add task" });
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={24} className="text-[#4ade80]" />;
      case "in_progress":
        return <Clock size={24} className="text-[#cfe0ad]" />;
      case "pending":
        return <Circle size={24} className="text-[#6a6a6a]" />;
      default:
        return <AlertCircle size={24} className="text-[#f87171]" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]";
      case "in_progress":
        return "bg-[#cfe0ad]/10 text-[#cfe0ad] border-[#cfe0ad]";
      case "pending":
        return "bg-[#6a6a6a]/10 text-[#bdbdbd] border-[#6a6a6a]";
      default:
        return "bg-[#f87171]/10 text-[#f87171] border-[#f87171]";
    }
  };

  const upcomingMilestones = useMemo(
    () =>
      milestones.map((milestone) => ({
        ...milestone,
        daysLeft: getDaysRemaining(milestone.date),
      })),
    [milestones]
  );

  const handleStatusUpdate = async (taskId: string, currentStatus: TaskStatus) => {
    if (currentStatus === "completed") {
      return;
    }
    const nextStatus: TaskStatus =
      currentStatus === "pending" ? "in_progress" : "completed";
    try {
      await updateTaskStatus(taskId, nextStatus);
    } catch (error) {
      showToast({ type: "error", message: "Failed to update task" });
    }
  };

  const addTaskDialog = (
    <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-white">Task name</label>
            <input
              value={taskForm.name}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4 py-3 text-base text-white outline-none focus:border-[#cfe0ad] touch-target"
              placeholder="Excavation layout"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-white">Phase</label>
            <select
              value={taskForm.phaseId}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, phaseId: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4 py-3 text-base text-white outline-none focus:border-[#cfe0ad] touch-target"
            >
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-white">Start date</label>
              <input
                type="date"
                value={taskForm.startDate}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, startDate: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4 py-3 text-base text-white outline-none focus:border-[#cfe0ad] touch-target"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-white">End date</label>
              <input
                type="date"
                value={taskForm.endDate}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, endDate: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4 py-3 text-base text-white outline-none focus:border-[#cfe0ad] touch-target"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-white">Assigned to</label>
            <select
              value={taskForm.assignedTo}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, assignedTo: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4 py-3 text-base text-white outline-none focus:border-[#cfe0ad] touch-target"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-white">Description</label>
            <textarea
              rows={3}
              value={taskForm.description}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4 py-3 text-base text-white outline-none focus:border-[#cfe0ad]"
              placeholder="Add task notes"
            />
          </div>
          <button
            type="button"
            className="w-full rounded-full bg-[#cfe0ad] py-3 text-base font-semibold text-black transition hover:bg-[#d4e4b8] disabled:opacity-60 touch-target focus-ring"
            onClick={handleSaveTask}
            disabled={isSubmitting}
          >
            Save Task
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <PageLayout
      title="Project Schedule"
      extras={addTaskDialog}
    >
      <div className="mx-auto w-full max-w-6xl">
        {!currentProject && (
          <Card className="mt-6 border border-[#242424] bg-[#101010] p-4 text-sm xs:text-base text-[#bdbdbd]">
            Select or create a project to view schedules.
          </Card>
        )}
        {scheduleError && (
          <Card className="mt-4 border border-red-500/40 bg-red-500/10 p-4 text-sm xs:text-base text-red-200">
            {scheduleError}
          </Card>
        )}

        <section className="mt-8 xs:mt-12 sm:mt-16">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Upcoming Milestones</h2>
          <motion.div
            className="mt-4 xs:mt-6 sm:mt-8 grid grid-cols-1 gap-4 xs:gap-6 lg:grid-cols-2"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {upcomingMilestones.length === 0 && (
              <Card className="border border-[#2a2a2a] bg-[#101010] p-4 xs:p-6 text-base xs:text-lg text-[#bdbdbd]">
                No milestones scheduled yet.
              </Card>
            )}
            {upcomingMilestones.map((milestone) => (
              <motion.div key={milestone.id} variants={scaleIn} whileHover={cardHover}>
                <Card className="flex items-center gap-4 xs:gap-6 rounded-[24px] xs:rounded-[34px] border border-[#242424] bg-gradient-to-b from-[#161616] to-[#070707] p-4 xs:p-6 sm:p-8">
                  <Calendar size={36} className="text-[#cfe0ad] xs:w-12 xs:h-12 shrink-0" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold text-white truncate">{milestone.name}</h3>
                    <p className="mt-1 xs:mt-2 text-sm xs:text-base sm:text-lg text-[#bdbdbd]">{formatDate(milestone.date)}</p>
                    {milestone.daysLeft !== null && (
                      <p className="mt-1 text-xs xs:text-sm sm:text-base text-[#8a8a8a]">{milestone.daysLeft} days remaining</p>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="mt-12 xs:mt-16 sm:mt-20">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Project Timeline</h2>
          <motion.div
            className="mt-4 xs:mt-6 sm:mt-8 space-y-4 xs:space-y-6"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {phases.length === 0 && (
              <Card className="border border-[#2a2a2a] bg-[#101010] p-4 xs:p-6 text-base xs:text-lg text-[#bdbdbd]">
                Create phases to build your project timeline.
              </Card>
            )}
            {phases.map((phase) => {
              const isExpanded = expandedPhase === phase.id;
              const completedTasks = phase.tasks.filter((t) => t.status === "completed").length;
              const totalPhaseTasks = phase.tasks.length;
              const phaseProgress =
                totalPhaseTasks > 0
                  ? Math.round((completedTasks / totalPhaseTasks) * 100)
                  : phase.progress;

              return (
                <motion.div key={phase.id} variants={listItem}>
                  <Card className="overflow-hidden rounded-[24px] xs:rounded-[34px] border border-[#2a2a2a] bg-[#101010]">
                    <button
                      type="button"
                      onClick={() => togglePhase(phase.id)}
                      className="w-full p-4 xs:p-6 sm:p-8 text-left transition hover:bg-[#151515] touch-target focus-ring"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold text-white truncate">{phase.name}</h3>
                          <div className="mt-2 xs:mt-4 flex flex-wrap items-center gap-2 xs:gap-4 text-xs xs:text-sm sm:text-base text-[#bdbdbd]">
                            <span>{completedTasks} of {totalPhaseTasks} tasks</span>
                            <span className="hidden xs:inline">-</span>
                            <span>{phaseProgress}% complete</span>
                          </div>
                          <div className="mt-3 xs:mt-4 h-3 xs:h-4 overflow-hidden rounded-full border border-[#2a2a2a] bg-[#0d0d0d]">
                            <div
                              className="h-full rounded-full bg-[#cfe0ad]"
                              style={{ width: `${phaseProgress}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-2xl xs:text-3xl sm:text-4xl text-[#bdbdbd] shrink-0">
                          {isExpanded ? "-" : "+"}
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
                          <div className="p-4 xs:p-6 sm:p-8 space-y-4 xs:space-y-6">
                            {phase.tasks.length === 0 && (
                              <Card className="border border-[#1f1f1f] bg-[#0d0d0d] p-4 text-sm xs:text-base text-[#bdbdbd]">
                                No tasks in this phase yet.
                              </Card>
                            )}
                            {phase.tasks.map((task, taskIdx) => (
                              <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: taskIdx * 0.05 }}
                                className="flex flex-wrap items-start gap-3 xs:gap-4 sm:gap-6 rounded-[16px] xs:rounded-[24px] border border-[#1f1f1f] bg-[#0d0d0d] p-4 xs:p-5 sm:p-6"
                              >
                                <div className="mt-1 shrink-0">
                                  {getStatusIcon(task.status as TaskStatus)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-start justify-between gap-2 xs:gap-3">
                                    <h4 className="text-base xs:text-lg sm:text-xl font-semibold text-white">{task.name}</h4>
                                    <button
                                      type="button"
                                      onClick={() => handleStatusUpdate(task.id, task.status as TaskStatus)}
                                      className={`rounded-full border px-3 xs:px-4 py-1 text-xs xs:text-sm font-semibold touch-target focus-ring ${getStatusColor(task.status as TaskStatus)}`}
                                    >
                                      {task.status.replace("_", " ").toUpperCase()}
                                    </button>
                                  </div>
                                  {task.description && (
                                    <p className="mt-2 text-sm xs:text-base text-[#bdbdbd]">{task.description}</p>
                                  )}
                                  <div className="mt-3 flex flex-wrap gap-4 xs:gap-6 text-xs xs:text-sm text-[#bdbdbd]">
                                    <div>
                                      <span className="text-xs uppercase tracking-[0.2em] text-[#8a8a8a]">Start</span>
                                      <p className="mt-1">{formatDate(task.startDate)}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs uppercase tracking-[0.2em] text-[#8a8a8a]">End</span>
                                      <p className="mt-1">{formatDate(task.endDate)}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs uppercase tracking-[0.2em] text-[#8a8a8a]">Assigned</span>
                                      <p className="mt-1">{task.assignedTo || "Unassigned"}</p>
                                    </div>
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

        <section className="mt-12 xs:mt-16 sm:mt-20">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-white">Project Statistics</h2>
          <motion.div
            className="mt-4 xs:mt-6 sm:mt-8 grid grid-cols-2 gap-3 xs:gap-4 sm:grid-cols-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={scaleIn}>
              <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[30px] border border-[#242424] bg-[#101010] p-4 xs:p-6">
                <div className="text-3xl xs:text-4xl sm:text-6xl font-black text-[#4ade80]">{tasksByStatus.completed}</div>
                <p className="mt-2 text-xs xs:text-sm sm:text-xl text-[#b9b9b9]">Completed</p>
              </Card>
            </motion.div>
            <motion.div variants={scaleIn}>
              <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[30px] border border-[#242424] bg-[#101010] p-4 xs:p-6">
                <div className="text-3xl xs:text-4xl sm:text-6xl font-black text-[#cfe0ad]">{tasksByStatus.in_progress}</div>
                <p className="mt-2 text-xs xs:text-sm sm:text-xl text-[#b9b9b9]">In Progress</p>
              </Card>
            </motion.div>
            <motion.div variants={scaleIn}>
              <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[30px] border border-[#242424] bg-[#101010] p-4 xs:p-6">
                <div className="text-3xl xs:text-4xl sm:text-6xl font-black text-[#bdbdbd]">{tasksByStatus.pending}</div>
                <p className="mt-2 text-xs xs:text-sm sm:text-xl text-[#b9b9b9]">Pending</p>
              </Card>
            </motion.div>
            <motion.div variants={scaleIn}>
              <Card className="flex flex-col items-center justify-center rounded-[20px] xs:rounded-[30px] border border-[#242424] bg-[#101010] p-4 xs:p-6">
                <div className="text-3xl xs:text-4xl sm:text-6xl font-black text-[#cfe0ad]">{overallProgress}%</div>
                <p className="mt-2 text-xs xs:text-sm sm:text-xl text-[#b9b9b9]">Overall</p>
              </Card>
            </motion.div>
          </motion.div>
        </section>

        <section className="mt-12 xs:mt-16 sm:mt-20">
          <button
            type="button"
            className="flex h-[120px] xs:h-[150px] sm:h-[180px] w-full items-center justify-center rounded-[30px] xs:rounded-[40px] border-2 border-dashed border-[#2a2a2a] bg-[#111] text-base xs:text-lg sm:text-xl text-white transition hover:border-[#3a3a3a] disabled:cursor-not-allowed disabled:opacity-60 touch-target focus-ring"
            onClick={handleAddTaskClick}
            disabled={isSubmitting}
          >
            <span className="flex items-center gap-3 xs:gap-4">
              <span className="flex h-10 w-10 xs:h-12 xs:w-12 items-center justify-center rounded-full border border-[#3a3a3a] text-2xl xs:text-3xl">+</span>
              Add New Task
            </span>
          </button>
        </section>
      </div>
    </PageLayout>
  );
}
