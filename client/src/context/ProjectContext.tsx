import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectsApi, authStorage, type Project } from '../lib/api';
import { useBudgetStore } from '../store/budgetStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useDocumentStore } from '../store/documentStore';
import { useTeamStore } from '../store/teamStore';
import { useChatStore } from '../store/chatStore';
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

  // Sync all stores with current project data
  const syncAllStores = useCallback(async () => {
    if (!currentProject?._id || !isAuthenticated) return;

    const projectId = currentProject._id;
    authStorage.setCurrentProject(projectId);

    try {
      await Promise.all([
        fetchBudgetData(projectId),
        fetchInventoryData(projectId),
        fetchDocuments(projectId),
        fetchTeamMembers(projectId),
        loadChatHistory(projectId),
      ]);
    } catch (err) {
      console.error('Failed to sync stores:', err);
    }
  }, [currentProject?._id, isAuthenticated, fetchBudgetData, fetchInventoryData, fetchDocuments, fetchTeamMembers, loadChatHistory]);

  // Set current project and sync stores
  const setCurrentProject = useCallback((project: Project | null) => {
    setCurrentProjectState(project);
    if (project) {
      authStorage.setCurrentProject(project._id);
    }
  }, []);

  // Select project by ID
  const selectProjectById = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await projectsApi.getById(projectId);
      if (response.success && response.data?.project) {
        setCurrentProject(response.data.project);
      } else {
        throw new Error(response.error || 'Project not found');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load project';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentProject]);

  // Fetch all projects
  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await projectsApi.getAll({ limit: 50 });
      if (response.success && response.data?.projects) {
        setProjects(response.data.projects);

        // Auto-select first project if none selected
        if (!currentProject && response.data.projects.length > 0) {
          setCurrentProject(response.data.projects[0]);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
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
        setProjects((prev) => [newProject, ...prev]);
        setCurrentProject(newProject);
        return newProject;
      } else {
        throw new Error(response.error || 'Failed to create project');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentProject]);

  // Update project
  const updateProject = useCallback(async (id: string, data: Partial<Project>): Promise<Project> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await projectsApi.update(id, data);
      if (response.success && response.data?.project) {
        const updatedProject = response.data.project;
        setProjects((prev) =>
          prev.map((p) => (p._id === id ? updatedProject : p))
        );
        if (currentProject?._id === id) {
          setCurrentProjectState(updatedProject);
        }
        return updatedProject;
      } else {
        throw new Error(response.error || 'Failed to update project');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentProject?._id]);

  // Delete project
  const deleteProject = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await projectsApi.delete(id);
      if (response.success) {
        setProjects((prev) => prev.filter((p) => p._id !== id));
        if (currentProject?._id === id) {
          const remaining = projects.filter((p) => p._id !== id);
          setCurrentProject(remaining.length > 0 ? remaining[0] : null);
        }
      } else {
        throw new Error(response.error || 'Failed to delete project');
      }
    } catch (err) {
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
    if (!currentProject?._id || !isAuthenticated) {
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
