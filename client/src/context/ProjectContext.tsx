import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectsApi, authStorage, type Project } from '../lib/api';
import { useBudgetStore } from '../store/budgetStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useDocumentStore } from '../store/documentStore';
import { useTeamStore } from '../store/teamStore';
import { useChatStore } from '../store/chatStore';
import { useScheduleStore } from '../store/scheduleStore';
import { useUploadsStore } from '../store/uploadsStore';
import { useAuth } from './AuthContext';
import { getProjectChannelName, subscribeToChannel, unsubscribeFromChannel } from '@/lib/realtime';
import { useNotifications } from '@/hooks/use-notifications';

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  setCurrentProject: (project: Project | null) => void;
  selectProjectById: (projectId: string) => Promise<void>;
  fetchProjects: () => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  syncAllStores: () => Promise<void>;
  clearError: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const LOCAL_PROJECTS_KEY = 'matters-local-projects';

const loadLocalProjects = (): Project[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
};

const saveLocalProjects = (projects: Project[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
  } catch {
    // Ignore storage errors
  }
};

const isLocalProjectId = (projectId: string) => projectId.startsWith('local-');

const buildLocalProject = (data: Partial<Project>): Project => {
  const now = new Date().toISOString();
  const owner = authStorage.getUser()?._id || 'guest';

  return {
    _id: `local-${Date.now()}`,
    name: data.name || 'Untitled Project',
    description: data.description,
    type: data.type || 'residential',
    status: data.status || 'planning',
    priority: data.priority || 'medium',
    mode: data.mode || 'construction',
    owner,
    location: data.location,
    budget: data.budget || { estimated: 0, spent: 0, currency: 'INR' },
    timeline: data.timeline,
    progress: data.progress || { percentage: 0 },
    currentStage: data.currentStage,
    team: data.team || [],
    startDate: data.startDate,
    endDate: data.endDate,
    createdAt: now,
    updatedAt: now,
  };
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useNotifications();
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get store actions
  const fetchBudgetData = useBudgetStore((state) => state.fetchBudgetData);
  const fetchInventoryData = useInventoryStore((state) => state.fetchInventoryData);
  const fetchDocuments = useDocumentStore((state) => state.fetchDocuments);
  const fetchTeamMembers = useTeamStore((state) => state.fetchTeamMembers);
  const loadChatHistory = useChatStore((state) => state.loadHistory);
  const appendChatMessage = useChatStore((state) => state.appendMessage);
  const fetchScheduleData = useScheduleStore((state) => state.fetchScheduleData);
  const fetchUploads = useUploadsStore((state) => state.fetchUploads);

  // Sync all stores with current project data
  const syncAllStores = useCallback(async () => {
    if (!currentProject?._id || !isAuthenticated || isLocalProjectId(currentProject._id)) return;

    const projectId = currentProject._id;
    authStorage.setCurrentProject(projectId);

    try {
      await Promise.all([
        fetchBudgetData(projectId),
        fetchInventoryData(projectId),
        fetchDocuments(projectId),
        fetchTeamMembers(projectId),
        fetchScheduleData(projectId),
        fetchUploads(projectId),
        loadChatHistory(projectId),
      ]);
    } catch (err) {
      console.error('Failed to sync stores:', err);
    }
  }, [
    currentProject?._id,
    isAuthenticated,
    fetchBudgetData,
    fetchInventoryData,
    fetchDocuments,
    fetchTeamMembers,
    fetchScheduleData,
    fetchUploads,
    loadChatHistory,
  ]);

  // Set current project and sync stores
  const setCurrentProject = useCallback((project: Project | null) => {
    setCurrentProjectState(project);
    if (project) {
      authStorage.setCurrentProject(project._id);
    } else {
      authStorage.clearCurrentProject();
    }
  }, []);

  // Select project by ID
  const selectProjectById = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const localMatch = projects.find((project) => project._id === projectId);
      if (localMatch && isLocalProjectId(projectId)) {
        setCurrentProject(localMatch);
        return;
      }
      const response = await projectsApi.getById(projectId);
      if (response.success && response.data?.project) {
        setCurrentProject(response.data.project);
      } else {
        throw new Error(response.error || 'Project not found');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load project';
      const localMatch = projects.find((project) => project._id === projectId);
      if (localMatch) {
        setCurrentProject(localMatch);
        return;
      }
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [projects, setCurrentProject]);

  // Fetch all projects
  const fetchProjects = useCallback(async () => {
    const hydrateProjects = (projectList: Project[]) => {
      setProjects(projectList);

      const storedProjectId = authStorage.getCurrentProjectId();
      const storedProject = storedProjectId
        ? projectList.find((project) => project._id === storedProjectId)
        : null;

      if (!currentProject && projectList.length > 0) {
        setCurrentProject(storedProject || projectList[0]);
      }
    };

    if (!isAuthenticated) {
      hydrateProjects(loadLocalProjects());
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await projectsApi.getAll({ limit: 50 });
      if (response.success && response.data?.projects) {
        const localProjects = loadLocalProjects().filter((project) => isLocalProjectId(project._id));
        const mergedProjects = [...localProjects, ...response.data.projects];
        saveLocalProjects(mergedProjects);
        hydrateProjects(mergedProjects);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      const localProjects = loadLocalProjects();
      if (localProjects.length > 0) {
        hydrateProjects(localProjects);
        return;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentProject, setCurrentProject]);

  // Create new project
  const createProject = useCallback(async (data: Partial<Project>): Promise<Project> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await projectsApi.create(data);
      if (response.success && response.data?.project) {
        const newProject = response.data.project;
        setProjects((prev) => {
          const next = [newProject, ...prev.filter((project) => project._id !== newProject._id)];
          saveLocalProjects(next);
          return next;
        });
        setCurrentProject(newProject);
        return newProject;
      } else {
        throw new Error(response.error || 'Failed to create project');
      }
    } catch (err) {
      const localProject = buildLocalProject(data);
      setProjects((prev) => {
        const next = [localProject, ...prev];
        saveLocalProjects(next);
        return next;
      });
      setCurrentProject(localProject);
      return localProject;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentProject]);

  // Update project
  const updateProject = useCallback(async (id: string, data: Partial<Project>): Promise<Project> => {
    setIsLoading(true);
    setError(null);
    try {
      if (isLocalProjectId(id)) {
        const localMatch = projects.find((project) => project._id === id);
        if (!localMatch) {
          throw new Error('Project not found');
        }
        const updatedLocal = { ...localMatch, ...data, updatedAt: new Date().toISOString() };
        setProjects((prev) => {
          const next = prev.map((project) => (project._id === id ? updatedLocal : project));
          saveLocalProjects(next);
          return next;
        });
        if (currentProject?._id === id) {
          setCurrentProjectState(updatedLocal);
        }
        return updatedLocal;
      }
      const response = await projectsApi.update(id, data);
      if (response.success && response.data?.project) {
        const updatedProject = response.data.project;
        setProjects((prev) => {
          const next = prev.map((project) => (project._id === id ? updatedProject : project));
          saveLocalProjects(next);
          return next;
        });
        if (currentProject?._id === id) {
          setCurrentProjectState(updatedProject);
        }
        return updatedProject;
      } else {
        throw new Error(response.error || 'Failed to update project');
      }
    } catch (err) {
      const localMatch = projects.find((project) => project._id === id);
      if (localMatch) {
        const updatedLocal = { ...localMatch, ...data, updatedAt: new Date().toISOString() };
        setProjects((prev) => {
          const next = prev.map((project) => (project._id === id ? updatedLocal : project));
          saveLocalProjects(next);
          return next;
        });
        if (currentProject?._id === id) {
          setCurrentProjectState(updatedLocal);
        }
        return updatedLocal;
      }
      const message = err instanceof Error ? err.message : 'Failed to update project';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentProject?._id, projects]);

  // Delete project
  const deleteProject = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const removeProjectState = () => {
        const remaining = projects.filter((project) => project._id !== id);
        setProjects(remaining);
        saveLocalProjects(remaining);
        if (currentProject?._id === id) {
          setCurrentProject(remaining.length > 0 ? remaining[0] : null);
        }
      };

      if (isLocalProjectId(id)) {
        removeProjectState();
        return;
      }

      const response = await projectsApi.delete(id);
      if (response.success) {
        removeProjectState();
      } else {
        throw new Error(response.error || 'Failed to delete project');
      }
    } catch (err) {
      const localMatch = projects.find((project) => project._id === id);
      if (localMatch) {
        const remaining = projects.filter((project) => project._id !== id);
        setProjects(remaining);
        saveLocalProjects(remaining);
        if (currentProject?._id === id) {
          setCurrentProject(remaining.length > 0 ? remaining[0] : null);
        }
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to delete project';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentProject?._id, projects, setCurrentProject]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Sync stores when project changes
  useEffect(() => {
    if (currentProject?._id && isAuthenticated) {
      syncAllStores();
    }
  }, [currentProject?._id, isAuthenticated, syncAllStores]);

  useEffect(() => {
    if (!currentProject?._id || !isAuthenticated || isLocalProjectId(currentProject._id)) {
      return () => undefined;
    }

    const channelName = getProjectChannelName(currentProject._id);
    const channel = subscribeToChannel(channelName);

    if (!channel) {
      return () => undefined;
    }

    const handleProjectUpdated = (payload: { project?: Project }) => {
      if (payload.project?._id === currentProject._id) {
        setCurrentProjectState(payload.project);
      }
    };

    const handleBudgetUpdate = () => {
      fetchBudgetData(currentProject._id);
    };

    const handleInventoryUpdate = () => {
      fetchInventoryData(currentProject._id);
    };

    const handleUploadsUpdate = () => {
      fetchDocuments(currentProject._id);
      fetchUploads(currentProject._id);
    };

    const handleTeamUpdate = () => {
      fetchTeamMembers(currentProject._id);
    };

    const handleChatMessage = (payload: { message?: { role: 'user' | 'assistant'; content: string; timestamp: string } }) => {
      if (!payload.message) {
        return;
      }
      appendChatMessage(payload.message);
    };

    const handleStageUpdate = () => {
      fetchScheduleData(currentProject._id);
      showToast({
        type: 'info',
        message: 'Stage updated',
        description: 'Project stages were updated.',
      });
    };

    channel.bind('project.updated', handleProjectUpdated);
    channel.bind('budget.bill.created', handleBudgetUpdate);
    channel.bind('budget.bill.updated', handleBudgetUpdate);
    channel.bind('budget.bill.deleted', handleBudgetUpdate);
    channel.bind('budget.bill.payment', handleBudgetUpdate);
    channel.bind('budget.bill.approved', handleBudgetUpdate);
    channel.bind('budget.bill.rejected', handleBudgetUpdate);
    channel.bind('inventory.item.created', handleInventoryUpdate);
    channel.bind('inventory.item.updated', handleInventoryUpdate);
    channel.bind('inventory.item.deleted', handleInventoryUpdate);
    channel.bind('inventory.item.adjusted', handleInventoryUpdate);
    channel.bind('inventory.bulk.created', handleInventoryUpdate);
    channel.bind('upload.created', handleUploadsUpdate);
    channel.bind('upload.updated', handleUploadsUpdate);
    channel.bind('upload.deleted', handleUploadsUpdate);
    channel.bind('upload.comment.added', handleUploadsUpdate);
    channel.bind('stage.created', handleStageUpdate);
    channel.bind('stage.updated', handleStageUpdate);
    channel.bind('stage.deleted', handleStageUpdate);
    channel.bind('stage.tasks.updated', handleStageUpdate);
    channel.bind('stage.checklist.updated', handleStageUpdate);
    channel.bind('stage.notes.updated', handleStageUpdate);
    channel.bind('stage.reordered', handleStageUpdate);
    channel.bind('team.updated', handleTeamUpdate);
    channel.bind('chat.message', handleChatMessage);

    return () => {
      channel.unbind('project.updated', handleProjectUpdated);
      channel.unbind('budget.bill.created', handleBudgetUpdate);
      channel.unbind('budget.bill.updated', handleBudgetUpdate);
      channel.unbind('budget.bill.deleted', handleBudgetUpdate);
      channel.unbind('budget.bill.payment', handleBudgetUpdate);
      channel.unbind('budget.bill.approved', handleBudgetUpdate);
      channel.unbind('budget.bill.rejected', handleBudgetUpdate);
      channel.unbind('inventory.item.created', handleInventoryUpdate);
      channel.unbind('inventory.item.updated', handleInventoryUpdate);
      channel.unbind('inventory.item.deleted', handleInventoryUpdate);
      channel.unbind('inventory.item.adjusted', handleInventoryUpdate);
      channel.unbind('inventory.bulk.created', handleInventoryUpdate);
      channel.unbind('upload.created', handleUploadsUpdate);
      channel.unbind('upload.updated', handleUploadsUpdate);
      channel.unbind('upload.deleted', handleUploadsUpdate);
      channel.unbind('upload.comment.added', handleUploadsUpdate);
      channel.unbind('stage.created', handleStageUpdate);
      channel.unbind('stage.updated', handleStageUpdate);
      channel.unbind('stage.deleted', handleStageUpdate);
      channel.unbind('stage.tasks.updated', handleStageUpdate);
      channel.unbind('stage.checklist.updated', handleStageUpdate);
      channel.unbind('stage.notes.updated', handleStageUpdate);
      channel.unbind('stage.reordered', handleStageUpdate);
      channel.unbind('team.updated', handleTeamUpdate);
      channel.unbind('chat.message', handleChatMessage);
      unsubscribeFromChannel(channelName);
    };
  }, [
    appendChatMessage,
    currentProject?._id,
    fetchBudgetData,
    fetchDocuments,
    fetchInventoryData,
    fetchTeamMembers,
    fetchScheduleData,
    fetchUploads,
    isAuthenticated,
    showToast,
  ]);

  // Fetch projects on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, fetchProjects]);

  const value: ProjectContextType = {
    currentProject,
    projects,
    isLoading,
    error,
    setCurrentProject,
    selectProjectById,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    syncAllStores,
    clearError,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export default ProjectContext;
