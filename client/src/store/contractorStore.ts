import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Contractor, ContractorStatus } from './types';
import { seedContractors } from './mockData';

interface ContractorStore {
  contractors: Contractor[];
  selectedContractor: string | null;
  isLoading: boolean;
  isSubmitting: boolean;

  // Actions
  addContractor: (contractor: Omit<Contractor, 'id'>) => void;
  updateContractor: (id: string, updates: Partial<Contractor>) => void;
  deleteContractor: (id: string) => void;
  setSelectedContractor: (id: string | null) => void;
  updateAvailability: (id: string, availability: ContractorStatus) => void;

  // Computed getters
  getActiveContractors: () => Contractor[];
  getScheduledContractors: () => Contractor[];
  getAveragePerformance: () => { quality: number; timeliness: number; communication: number; costEffectiveness: number };
}

export const useContractorStore = create<ContractorStore>()(
  persist(
    (set, get) => ({
      contractors: seedContractors(),
      selectedContractor: null,
      isLoading: false,
      isSubmitting: false,

      addContractor: (contractor) =>
        set((state) => ({
          contractors: [
            ...state.contractors,
            { ...contractor, id: `con-${Date.now()}` }
          ]
        })),

      updateContractor: (id, updates) =>
        set((state) => ({
          contractors: state.contractors.map((contractor) =>
            contractor.id === id ? { ...contractor, ...updates } : contractor
          )
        })),

      deleteContractor: (id) =>
        set((state) => ({
          contractors: state.contractors.filter((contractor) => contractor.id !== id),
          selectedContractor: state.selectedContractor === id ? null : state.selectedContractor
        })),

      setSelectedContractor: (id) => set({ selectedContractor: id }),

      updateAvailability: (id, availability) =>
        set((state) => ({
          contractors: state.contractors.map((contractor) =>
            contractor.id === id ? { ...contractor, availability } : contractor
          )
        })),

      getActiveContractors: () => {
        const state = get();
        return state.contractors.filter((c) => c.availability !== 'busy');
      },

      getScheduledContractors: () => {
        const state = get();
        return state.contractors.filter((c) => c.availability === 'scheduled');
      },

      getAveragePerformance: () => {
        const state = get();
        const contractorsWithMetrics = state.contractors.filter(
          (c) => c.performanceMetrics
        );

        if (contractorsWithMetrics.length === 0) {
          return { quality: 0, timeliness: 0, communication: 0, costEffectiveness: 0 };
        }

        const totals = contractorsWithMetrics.reduce(
          (acc, c) => ({
            quality: acc.quality + (c.performanceMetrics?.quality || 0),
            timeliness: acc.timeliness + (c.performanceMetrics?.timeliness || 0),
            communication: acc.communication + (c.performanceMetrics?.communication || 0),
            costEffectiveness: acc.costEffectiveness + (c.performanceMetrics?.costEffectiveness || 0)
          }),
          { quality: 0, timeliness: 0, communication: 0, costEffectiveness: 0 }
        );

        const count = contractorsWithMetrics.length;
        return {
          quality: Math.round(totals.quality / count),
          timeliness: Math.round(totals.timeliness / count),
          communication: Math.round(totals.communication / count),
          costEffectiveness: Math.round(totals.costEffectiveness / count)
        };
      }
    }),
    { name: 'contractor-storage' }
  )
);
