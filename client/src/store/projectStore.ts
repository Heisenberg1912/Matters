import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, ProjectMode } from './types';
import { seedProject } from './mockData';

interface ProjectStore {
  project: Project;
  mode: ProjectMode;
  setMode: (mode: ProjectMode) => void;
  updateProject: (updates: Partial<Project>) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      project: seedProject(),
      mode: "construction",
      setMode: (mode) => set({ mode }),
      updateProject: (updates) =>
        set((state) => ({
          project: { ...state.project, ...updates }
        }))
    }),
    { name: 'project-storage' }
  )
);
