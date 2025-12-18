import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TeamMember } from './types';
import { seedTeamMembers } from './mockData';

interface TeamStore {
  members: TeamMember[];
  isLoading: boolean;
  isSubmitting: boolean;

  // Actions
  addMember: (member: Omit<TeamMember, 'id'>) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteMember: (id: string) => void;
  toggleMemberStatus: (id: string) => void;

  // Computed getters
  getActiveMembersCount: () => number;
  getMembersByRole: () => Record<string, TeamMember[]>;
  getRoles: () => string[];
}

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      members: seedTeamMembers(),
      isLoading: false,
      isSubmitting: false,

      addMember: (member) =>
        set((state) => ({
          members: [
            ...state.members,
            { ...member, id: `team-${Date.now()}`, status: 'active' }
          ]
        })),

      updateMember: (id, updates) =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id ? { ...member, ...updates } : member
          )
        })),

      deleteMember: (id) =>
        set((state) => ({
          members: state.members.filter((member) => member.id !== id)
        })),

      toggleMemberStatus: (id) =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id
              ? {
                  ...member,
                  status: member.status === 'active' ? 'inactive' : 'active'
                }
              : member
          )
        })),

      getActiveMembersCount: () => {
        const state = get();
        return state.members.filter((m) => m.status === 'active').length;
      },

      getMembersByRole: () => {
        const state = get();
        return state.members.reduce((acc, member) => {
          if (!acc[member.role]) {
            acc[member.role] = [];
          }
          acc[member.role].push(member);
          return acc;
        }, {} as Record<string, TeamMember[]>);
      },

      getRoles: () => {
        const state = get();
        const roles = new Set(state.members.map((m) => m.role));
        return Array.from(roles).sort();
      }
    }),
    { name: 'team-storage' }
  )
);
