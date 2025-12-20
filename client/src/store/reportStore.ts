import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Report, ReportType } from './types';
import { seedReports } from './mockData';
import { reportsApi, budgetApi, inventoryApi, stagesApi, authStorage } from '../lib/api';
import { exportToPDF, exportToExcel } from '../lib/exportService';

interface ReportStore {
  reports: Report[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  generateReport: (type: ReportType, projectId?: string) => Promise<Report>;
  updateReport: (id: string, updates: Partial<Report>) => void;
  deleteReport: (id: string) => void;
  exportReport: (id: string, format: 'pdf' | 'excel') => void;

  // Computed getters
  getRecentReports: (count?: number) => Report[];
  getReportsByType: (type: ReportType) => Report[];
  getReportTypes: () => { type: ReportType; name: string; description: string }[];
}

export const useReportStore = create<ReportStore>()(
  persist(
    (set, get) => ({
      reports: seedReports(),
      isLoading: false,
      isSubmitting: false,
      error: null,

      generateReport: async (type: ReportType, projectId?: string) => {
        const pid = projectId || authStorage.getCurrentProjectId();
        if (!pid) {
          throw new Error('No project selected');
        }

        set({ isLoading: true, error: null });
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let reportData: any = {};
          let reportName = '';

          switch (type) {
            case 'budget': {
              const response = await budgetApi.getSummary(pid);
              if (response.success && response.data) {
                reportData = { ...response.data };
                reportName = 'Budget Summary Report';
              }
              break;
            }
            case 'inventory': {
              const response = await inventoryApi.getSummary(pid);
              if (response.success && response.data) {
                reportData = { ...response.data };
                reportName = 'Inventory Status Report';
              }
              break;
            }
            case 'progress': {
              const response = await stagesApi.getByProject(pid);
              if (response.success && response.data) {
                const stages = response.data.stages;
                const totalProgress = stages.reduce((sum, s) => sum + s.progress, 0);
                const avgProgress = stages.length > 0 ? totalProgress / stages.length : 0;
                reportData = {
                  stages,
                  summary: {
                    totalStages: stages.length,
                    completedStages: stages.filter((s) => s.status === 'completed').length,
                    inProgressStages: stages.filter((s) => s.status === 'in_progress').length,
                    averageProgress: Math.round(avgProgress),
                  },
                };
                reportName = 'Progress Report';
              }
              break;
            }
            case 'contractor': {
              // Use budget data to calculate contractor payments
              const response = await budgetApi.getBills(pid, { limit: 100 });
              if (response.success && response.data) {
                const contractorPayments: Record<string, number> = {};
                response.data.bills.forEach((bill) => {
                  const vendor = bill.vendor?.name || 'Unknown';
                  contractorPayments[vendor] = (contractorPayments[vendor] || 0) + bill.amount.total;
                });
                reportData = {
                  contractors: Object.entries(contractorPayments).map(([name, total]) => ({
                    name,
                    totalPaid: total,
                    billCount: response.data?.bills.filter((b) => b.vendor?.name === name).length || 0,
                  })),
                };
                reportName = 'Contractor Performance Report';
              }
              break;
            }
            case 'weekly': {
              // Combine data from multiple sources
              const [budgetRes, inventoryRes, stagesRes] = await Promise.all([
                budgetApi.getSummary(pid),
                inventoryApi.getSummary(pid),
                stagesApi.getByProject(pid),
              ]);

              reportData = {
                budget: budgetRes.success ? budgetRes.data : null,
                inventory: inventoryRes.success ? inventoryRes.data : null,
                stages: stagesRes.success ? stagesRes.data?.stages : null,
                generatedAt: new Date().toISOString(),
              };
              reportName = 'Weekly Summary Report';
              break;
            }
          }

          const newReport: Report = {
            id: `rep-${Date.now()}`,
            name: reportName,
            type,
            generatedDate: new Date().toISOString().split('T')[0],
            data: reportData,
            description: `Generated on ${new Date().toLocaleDateString()}`,
          };

          set((state) => ({
            reports: [newReport, ...state.reports],
          }));

          return newReport;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
          set({ error: errorMessage });

          // Fall back to local report generation
          const fallbackReport: Report = {
            id: `rep-${Date.now()}`,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
            type,
            generatedDate: new Date().toISOString().split('T')[0],
            data: { error: 'Generated with limited data due to connectivity issues' },
            description: `Generated on ${new Date().toLocaleDateString()} (offline)`,
          };

          set((state) => ({
            reports: [fallbackReport, ...state.reports],
          }));

          return fallbackReport;
        } finally {
          set({ isLoading: false });
        }
      },

      updateReport: (id, updates) =>
        set((state) => ({
          reports: state.reports.map((report) =>
            report.id === id ? { ...report, ...updates } : report
          ),
        })),

      deleteReport: (id) =>
        set((state) => ({
          reports: state.reports.filter((report) => report.id !== id),
        })),

      exportReport: (id, format) => {
        const state = get();
        const report = state.reports.find((r) => r.id === id);
        if (!report) return;

        try {
          if (format === 'pdf') {
            // Use the professional PDF export service
            exportToPDF(report);
          } else if (format === 'excel') {
            // Use the professional Excel export service
            exportToExcel(report);
          }
          console.log(`Exported report "${report.name}" as ${format.toUpperCase()}`);
        } catch (error) {
          console.error(`Failed to export report as ${format}:`, error);
        }
      },

      getRecentReports: (count = 5) => {
        const state = get();
        return [...state.reports]
          .sort((a, b) => b.generatedDate.localeCompare(a.generatedDate))
          .slice(0, count);
      },

      getReportsByType: (type) => {
        const state = get();
        return state.reports.filter((report) => report.type === type);
      },

      getReportTypes: () => [
        {
          type: 'budget' as ReportType,
          name: 'Budget Summary',
          description: 'Comprehensive budget analysis with spending trends',
        },
        {
          type: 'progress' as ReportType,
          name: 'Progress Report',
          description: 'Project progress with task completion status',
        },
        {
          type: 'contractor' as ReportType,
          name: 'Contractor Performance',
          description: 'Performance metrics for all contractors',
        },
        {
          type: 'inventory' as ReportType,
          name: 'Inventory Status',
          description: 'Current inventory levels and low stock alerts',
        },
        {
          type: 'weekly' as ReportType,
          name: 'Weekly Summary',
          description: 'Comprehensive weekly project summary',
        },
      ],
    }),
    { name: 'report-storage' }
  )
);
