import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Phase, Task, Milestone, TaskStatus } from './types';
import { seedPhases, seedMilestones } from './mockData';

interface ScheduleStore {
  phases: Phase[];
  milestones: Milestone[];
  expandedPhase: string | null;
  isLoading: boolean;
  isSubmitting: boolean;

  // Phase actions
  addPhase: (phase: Omit<Phase, 'id' | 'tasks'>) => void;
  updatePhase: (id: string, updates: Partial<Phase>) => void;
  deletePhase: (id: string) => void;

  // Task actions
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;

  // Milestone actions
  addMilestone: (milestone: Omit<Milestone, 'id'>) => void;
  updateMilestone: (id: string, updates: Partial<Milestone>) => void;
  toggleMilestone: (id: string) => void;

  // UI actions
  togglePhase: (phaseId: string) => void;

  // Computed getters
  getTasksByStatus: () => { completed: number; in_progress: number; pending: number };
  getOverallProgress: () => number;
  getUpcomingTasks: () => Task[];
  getUpcomingMilestones: () => Milestone[];
}

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set, get) => ({
      phases: seedPhases(),
      milestones: seedMilestones(),
      expandedPhase: null,
      isLoading: false,
      isSubmitting: false,

      // Phase actions
      addPhase: (phase) =>
        set((state) => ({
          phases: [
            ...state.phases,
            { ...phase, id: `phase-${Date.now()}`, tasks: [], progress: 0 }
          ]
        })),

      updatePhase: (id, updates) =>
        set((state) => ({
          phases: state.phases.map((phase) =>
            phase.id === id ? { ...phase, ...updates } : phase
          )
        })),

      deletePhase: (id) =>
        set((state) => ({
          phases: state.phases.filter((phase) => phase.id !== id)
        })),

      // Task actions
      addTask: (task) =>
        set((state) => {
          const newTask = { ...task, id: `task-${Date.now()}` };
          const updatedPhases = state.phases.map((phase) => {
            if (phase.id === task.phaseId) {
              const updatedTasks = [...phase.tasks, newTask];
              const completedCount = updatedTasks.filter(
                (t) => t.status === 'completed'
              ).length;
              const progress =
                updatedTasks.length > 0
                  ? Math.round((completedCount / updatedTasks.length) * 100)
                  : 0;
              return { ...phase, tasks: updatedTasks, progress };
            }
            return phase;
          });
          return { phases: updatedPhases };
        }),

      updateTask: (id, updates) =>
        set((state) => {
          const updatedPhases = state.phases.map((phase) => {
            const updatedTasks = phase.tasks.map((task) =>
              task.id === id ? { ...task, ...updates } : task
            );
            if (updatedTasks !== phase.tasks) {
              const completedCount = updatedTasks.filter(
                (t) => t.status === 'completed'
              ).length;
              const progress =
                updatedTasks.length > 0
                  ? Math.round((completedCount / updatedTasks.length) * 100)
                  : 0;
              return { ...phase, tasks: updatedTasks, progress };
            }
            return phase;
          });
          return { phases: updatedPhases };
        }),

      deleteTask: (id) =>
        set((state) => {
          const updatedPhases = state.phases.map((phase) => {
            const updatedTasks = phase.tasks.filter((task) => task.id !== id);
            if (updatedTasks.length !== phase.tasks.length) {
              const completedCount = updatedTasks.filter(
                (t) => t.status === 'completed'
              ).length;
              const progress =
                updatedTasks.length > 0
                  ? Math.round((completedCount / updatedTasks.length) * 100)
                  : 0;
              return { ...phase, tasks: updatedTasks, progress };
            }
            return phase;
          });
          return { phases: updatedPhases };
        }),

      updateTaskStatus: (id, status) => {
        get().updateTask(id, { status });
      },

      // Milestone actions
      addMilestone: (milestone) =>
        set((state) => ({
          milestones: [
            ...state.milestones,
            { ...milestone, id: `mile-${Date.now()}` }
          ]
        })),

      updateMilestone: (id, updates) =>
        set((state) => ({
          milestones: state.milestones.map((milestone) =>
            milestone.id === id ? { ...milestone, ...updates } : milestone
          )
        })),

      toggleMilestone: (id) =>
        set((state) => ({
          milestones: state.milestones.map((milestone) =>
            milestone.id === id
              ? { ...milestone, completed: !milestone.completed }
              : milestone
          )
        })),

      // UI actions
      togglePhase: (phaseId) =>
        set((state) => ({
          expandedPhase: state.expandedPhase === phaseId ? null : phaseId
        })),

      // Computed getters
      getTasksByStatus: () => {
        const state = get();
        const allTasks = state.phases.flatMap((phase) => phase.tasks);
        return {
          completed: allTasks.filter((t) => t.status === 'completed').length,
          in_progress: allTasks.filter((t) => t.status === 'in_progress').length,
          pending: allTasks.filter((t) => t.status === 'pending').length
        };
      },

      getOverallProgress: () => {
        const state = get();
        const allTasks = state.phases.flatMap((phase) => phase.tasks);
        if (allTasks.length === 0) return 0;
        const completedCount = allTasks.filter((t) => t.status === 'completed').length;
        return Math.round((completedCount / allTasks.length) * 100);
      },

      getUpcomingTasks: () => {
        const state = get();
        const today = new Date();
        const allTasks = state.phases.flatMap((phase) => phase.tasks);
        return allTasks
          .filter((task) => task.status !== 'completed')
          .filter((task) => new Date(task.startDate) <= today)
          .slice(0, 5);
      },

      getUpcomingMilestones: () => {
        const state = get();
        return state.milestones
          .filter((m) => !m.completed)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5);
      }
    }),
    { name: 'schedule-storage' }
  )
);
