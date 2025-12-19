import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Phase, Task, Milestone, TaskStatus } from './types';
import { seedPhases, seedMilestones } from './mockData';
import { authStorage, stagesApi } from '../lib/api';

interface ScheduleStore {
  phases: Phase[];
  milestones: Milestone[];
  expandedPhase: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastSynced: string | null;

  // Phase actions
  addPhase: (phase: Omit<Phase, 'id' | 'tasks'>) => Promise<void>;
  updatePhase: (id: string, updates: Partial<Phase>) => Promise<void>;
  deletePhase: (id: string) => Promise<void>;

  // Task actions
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;

  // UI actions
  togglePhase: (phaseId: string) => void;

  // API sync actions
  fetchScheduleData: (projectId: string) => Promise<void>;
  syncWithBackend: (projectId: string) => Promise<void>;

  // Computed getters
  getTasksByStatus: () => { completed: number; in_progress: number; pending: number };
  getOverallProgress: () => number;
  getUpcomingTasks: () => Task[];
  getUpcomingMilestones: () => Milestone[];
}

const formatDate = (value?: string | Date | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
};

const mapStageToPhase = (stage: {
  _id: string;
  name: string;
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  progress?: number;
  tasks?: Array<{
    _id: string;
    title: string;
    status: TaskStatus;
    assignee?: { name?: string } | string;
    dueDate?: string;
    description?: string;
  }>;
}) => {
  const tasks = (stage.tasks || []).map((task) => ({
    id: task._id,
    phaseId: stage._id,
    name: task.title,
    status: task.status,
    startDate: formatDate(stage.startDate),
    endDate: formatDate(task.dueDate || stage.expectedEndDate || stage.actualEndDate),
    assignedTo: typeof task.assignee === 'object' ? task.assignee?.name : undefined,
    description: task.description,
  }));

  return {
    id: stage._id,
    name: stage.name,
    startDate: formatDate(stage.startDate),
    endDate: formatDate(stage.expectedEndDate || stage.actualEndDate),
    progress: stage.progress ?? 0,
    tasks,
  };
};

const mapStageToMilestone = (stage: {
  _id: string;
  name: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  status?: string;
}) => {
  const date = stage.expectedEndDate || stage.actualEndDate;
  if (!date) return null;
  return {
    id: `milestone-${stage._id}`,
    name: stage.name,
    date: formatDate(date),
    completed: stage.status === 'completed',
  } as Milestone;
};

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set, get) => ({
      phases: seedPhases(),
      milestones: seedMilestones(),
      expandedPhase: null,
      isLoading: false,
      isSubmitting: false,
      error: null,
      lastSynced: null,

      fetchScheduleData: async (projectId: string) => {
        if (!authStorage.isAuthenticated()) {
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await stagesApi.getByProject(projectId);
          if (response.success && response.data?.stages) {
            const phases = response.data.stages.map(mapStageToPhase);
            const milestones = response.data.stages
              .map(mapStageToMilestone)
              .filter((item): item is Milestone => item !== null);

            set({
              phases: phases.length > 0 ? phases : get().phases,
              milestones: milestones.length > 0 ? milestones : get().milestones,
              lastSynced: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Failed to fetch schedule data:', error);
          set({ error: 'Failed to load schedule data' });
        } finally {
          set({ isLoading: false });
        }
      },

      syncWithBackend: async (projectId: string) => {
        if (!authStorage.isAuthenticated()) {
          return;
        }
        await get().fetchScheduleData(projectId);
      },

      addPhase: async (phase) => {
        const projectId = authStorage.getCurrentProjectId();
        const tempId = `phase-${Date.now()}`;

        const newPhase: Phase = {
          ...phase,
          id: tempId,
          tasks: [],
          progress: phase.progress ?? 0,
        };

        set((state) => ({
          phases: [...state.phases, newPhase],
        }));

        if (!authStorage.isAuthenticated() || !projectId) {
          return;
        }

        set({ isSubmitting: true });
        try {
          const response = await stagesApi.create({
            project: projectId,
            name: phase.name,
            description: '',
            order: get().phases.length,
            startDate: phase.startDate || undefined,
            expectedEndDate: phase.endDate || undefined,
          });

          if (response.success && response.data?.stage) {
            const stageData = response.data.stage as Parameters<typeof mapStageToPhase>[0];
            const savedPhase = mapStageToPhase(stageData);
            set((state) => ({
              phases: state.phases.map((item) => (item.id === tempId ? savedPhase : item)),
            }));
          }
        } catch (error) {
          console.error('Failed to create phase:', error);
        } finally {
          set({ isSubmitting: false });
        }
      },

      updatePhase: async (id, updates) => {
        set((state) => ({
          phases: state.phases.map((phase) =>
            phase.id === id ? { ...phase, ...updates } : phase
          ),
        }));

        if (!authStorage.isAuthenticated() || id.startsWith('phase-')) {
          return;
        }

        set({ isSubmitting: true });
        try {
          await stagesApi.update(id, {
            name: updates.name,
            progress: updates.progress,
            startDate: updates.startDate || undefined,
            expectedEndDate: updates.endDate || undefined,
          });
        } catch (error) {
          console.error('Failed to update phase:', error);
        } finally {
          set({ isSubmitting: false });
        }
      },

      deletePhase: async (id) => {
        set((state) => ({
          phases: state.phases.filter((phase) => phase.id !== id),
        }));

        if (!authStorage.isAuthenticated() || id.startsWith('phase-')) {
          return;
        }

        set({ isSubmitting: true });
        try {
          await stagesApi.delete(id);
        } catch (error) {
          console.error('Failed to delete phase:', error);
        } finally {
          set({ isSubmitting: false });
        }
      },

      addTask: async (task) => {
        const tempId = `task-${Date.now()}`;
        const newTask: Task = { ...task, id: tempId };

        set((state) => ({
          phases: state.phases.map((phase) => {
            if (phase.id !== task.phaseId) return phase;
            const updatedTasks = [...phase.tasks, newTask];
            const completedCount = updatedTasks.filter((t) => t.status === 'completed').length;
            const progress = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : 0;
            return { ...phase, tasks: updatedTasks, progress };
          }),
        }));

        if (!authStorage.isAuthenticated() || task.phaseId.startsWith('phase-')) {
          return;
        }

        set({ isSubmitting: true });
        try {
          const response = await stagesApi.addTask(task.phaseId, {
            name: task.name,
            description: task.description,
            assignedTo: task.assignedTo,
            dueDate: task.endDate,
          });

          if (response.success) {
            await get().fetchScheduleData(authStorage.getCurrentProjectId() || '');
          }
        } catch (error) {
          console.error('Failed to add task:', error);
        } finally {
          set({ isSubmitting: false });
        }
      },

      updateTask: async (id, updates) => {
        const state = get();
        const targetPhase = state.phases.find((phase) => phase.tasks.some((task) => task.id === id));
        const targetTask = targetPhase?.tasks.find((task) => task.id === id);

        if (!targetPhase || !targetTask) return;

        set((state) => ({
          phases: state.phases.map((phase) => {
            if (phase.id !== targetPhase.id) return phase;
            const updatedTasks = phase.tasks.map((task) =>
              task.id === id ? { ...task, ...updates } : task
            );
            const completedCount = updatedTasks.filter((t) => t.status === 'completed').length;
            const progress = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : 0;
            return { ...phase, tasks: updatedTasks, progress };
          }),
        }));

        if (!authStorage.isAuthenticated() || targetPhase.id.startsWith('phase-') || id.startsWith('task-')) {
          return;
        }

        set({ isSubmitting: true });
        try {
          await stagesApi.updateTask(targetPhase.id, id, {
            name: updates.name,
            status: updates.status,
            description: updates.description,
            assignedTo: updates.assignedTo,
            dueDate: updates.endDate,
          });
        } catch (error) {
          console.error('Failed to update task:', error);
        } finally {
          set({ isSubmitting: false });
        }
      },

      deleteTask: async (id) => {
        const state = get();
        const targetPhase = state.phases.find((phase) => phase.tasks.some((task) => task.id === id));
        if (!targetPhase) return;

        set((state) => ({
          phases: state.phases.map((phase) => {
            if (phase.id !== targetPhase.id) return phase;
            const updatedTasks = phase.tasks.filter((task) => task.id !== id);
            const completedCount = updatedTasks.filter((t) => t.status === 'completed').length;
            const progress = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : 0;
            return { ...phase, tasks: updatedTasks, progress };
          }),
        }));

        if (!authStorage.isAuthenticated() || targetPhase.id.startsWith('phase-') || id.startsWith('task-')) {
          return;
        }

        set({ isSubmitting: true });
        try {
          await stagesApi.deleteTask(targetPhase.id, id);
        } catch (error) {
          console.error('Failed to delete task:', error);
        } finally {
          set({ isSubmitting: false });
        }
      },

      updateTaskStatus: async (id, status) => {
        await get().updateTask(id, { status });
      },

      togglePhase: (phaseId) =>
        set((state) => ({
          expandedPhase: state.expandedPhase === phaseId ? null : phaseId,
        })),

      getTasksByStatus: () => {
        const state = get();
        const allTasks = state.phases.flatMap((phase) => phase.tasks);
        return {
          completed: allTasks.filter((t) => t.status === 'completed').length,
          in_progress: allTasks.filter((t) => t.status === 'in_progress').length,
          pending: allTasks.filter((t) => t.status === 'pending').length,
        };
      },

      getOverallProgress: () => {
        const state = get();
        if (state.phases.length === 0) return 0;
        const total = state.phases.reduce((sum, phase) => sum + (phase.progress || 0), 0);
        return Math.round(total / state.phases.length);
      },

      getUpcomingTasks: () => {
        const state = get();
        const today = new Date();
        const allTasks = state.phases.flatMap((phase) => phase.tasks);
        return allTasks
          .filter((task) => task.status !== 'completed')
          .filter((task) => !task.startDate || new Date(task.startDate) <= today)
          .slice(0, 5);
      },

      getUpcomingMilestones: () => {
        const state = get();
        return state.milestones
          .filter((m) => !m.completed)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5);
      },
    }),
    { name: 'schedule-storage' }
  )
);
