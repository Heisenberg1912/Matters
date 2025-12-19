import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TeamMember } from './types';
import { seedTeamMembers } from './mockData';
import { projectsApi, authStorage } from '../lib/api';

interface TeamStore {
  members: TeamMember[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastSynced: string | null;

  // Actions
  addMember: (member: Omit<TeamMember, 'id'>) => Promise<void>;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteMember: (id: string) => Promise<void>;
  toggleMemberStatus: (id: string) => void;

  // API sync actions
  fetchTeamMembers: (projectId: string) => Promise<void>;
  inviteMember: (projectId: string, email: string, role: string) => Promise<void>;

  // Computed getters
  getActiveMembersCount: () => number;
  getMembersByRole: () => Record<string, TeamMember[]>;
  getRoles: () => string[];
}

// Helper to map API team member to frontend format
const mapApiTeamMember = (apiMember: {
  user: { _id: string; name: string; email: string; avatar?: string } | string;
  role: string;
  joinedAt?: string;
}): TeamMember => {
  const user = typeof apiMember.user === 'string'
    ? { _id: apiMember.user, name: 'Unknown', email: '' }
    : apiMember.user;

  return {
    id: user._id,
    name: user.name,
    role: apiMember.role,
    email: user.email,
    phone: '',
    department: apiMember.role,
    joinDate: apiMember.joinedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    status: 'active',
    avatar: user.avatar,
  };
};

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      members: seedTeamMembers(),
      isLoading: false,
      isSubmitting: false,
      error: null,
      lastSynced: null,

      // Fetch team members from backend
      fetchTeamMembers: async (projectId: string) => {
        if (!authStorage.isAuthenticated()) {
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await projectsApi.getTeam(projectId);

          if (response.success && response.data?.team) {
            const members = response.data.team.map(mapApiTeamMember);
            set({
              members: members.length > 0 ? members : get().members,
              lastSynced: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Failed to fetch team members:', error);
          set({ error: 'Failed to load team members' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Invite a new team member
      inviteMember: async (projectId: string, email: string, role: string) => {
        set({ isSubmitting: true, error: null });
        try {
          const response = await projectsApi.addTeamMember(projectId, { email, role });

          if (response.success && response.data?.member) {
            const newMember = mapApiTeamMember(response.data.member);
            set((state) => ({
              members: [...state.members, newMember],
            }));
          }
        } catch (error) {
          console.error('Failed to invite team member:', error);
          set({ error: 'Failed to invite team member' });
          throw error;
        } finally {
          set({ isSubmitting: false });
        }
      },

      addMember: async (member) => {
        const projectId = authStorage.getCurrentProjectId();
        const newMember: TeamMember = {
          ...member,
          id: `team-${Date.now()}`,
          status: 'active',
        };

        // Optimistic update
        set((state) => ({
          members: [...state.members, newMember],
        }));

        // Try to sync with backend if we have email
        if (authStorage.isAuthenticated() && projectId && member.email) {
          set({ isSubmitting: true });
          try {
            const response = await projectsApi.addTeamMember(projectId, {
              email: member.email,
              role: member.role,
            });

            if (response.success && response.data?.member) {
              // Update with real data from backend
              const backendMember = mapApiTeamMember(response.data.member);
              set((state) => ({
                members: state.members.map((m) =>
                  m.id === newMember.id ? { ...backendMember, id: backendMember.id || m.id } : m
                ),
              }));
            }
          } catch (error) {
            console.error('Failed to sync team member:', error);
            // Keep local data on error
          } finally {
            set({ isSubmitting: false });
          }
        }
      },

      updateMember: (id, updates) =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id ? { ...member, ...updates } : member
          ),
        })),

      deleteMember: async (id) => {
        const projectId = authStorage.getCurrentProjectId();

        // Optimistic update
        set((state) => ({
          members: state.members.filter((member) => member.id !== id),
        }));

        // Sync with backend
        if (authStorage.isAuthenticated() && projectId && !id.startsWith('team-')) {
          set({ isSubmitting: true });
          try {
            await projectsApi.removeTeamMember(projectId, id);
          } catch (error) {
            console.error('Failed to remove team member:', error);
          } finally {
            set({ isSubmitting: false });
          }
        }
      },

      toggleMemberStatus: (id) =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id
              ? {
                  ...member,
                  status: member.status === 'active' ? 'inactive' : 'active',
                }
              : member
          ),
        })),

      getActiveMembersCount: () => {
        const state = get();
        return state.members.filter((m) => m.status === 'active').length;
      },

      getMembersByRole: () => {
        const state = get();
        return state.members.reduce(
          (acc, member) => {
            if (!acc[member.role]) {
              acc[member.role] = [];
            }
            acc[member.role].push(member);
            return acc;
          },
          {} as Record<string, TeamMember[]>
        );
      },

      getRoles: () => {
        const state = get();
        const roles = new Set(state.members.map((m) => m.role));
        return Array.from(roles).sort();
      },
    }),
    { name: 'team-storage' }
  )
);
