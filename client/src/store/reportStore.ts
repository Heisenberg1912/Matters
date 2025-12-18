import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Report, ReportType } from './types';
import { seedReports } from './mockData';

interface ReportStore {
  reports: Report[];
  isLoading: boolean;
  isSubmitting: boolean;

  // Actions
  generateReport: (report: Omit<Report, 'id' | 'generatedDate'>) => void;
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

      generateReport: (report) =>
        set((state) => ({
          reports: [
            {
              ...report,
              id: `rep-${Date.now()}`,
              generatedDate: new Date().toISOString().split('T')[0]
            },
            ...state.reports
          ]
        })),

      updateReport: (id, updates) =>
        set((state) => ({
          reports: state.reports.map((report) =>
            report.id === id ? { ...report, ...updates } : report
          )
        })),

      deleteReport: (id) =>
        set((state) => ({
          reports: state.reports.filter((report) => report.id !== id)
        })),

      exportReport: (id, format) => {
        const state = get();
        const report = state.reports.find((r) => r.id === id);
        if (!report) return;

        // Mock export - in real app, this would generate and download the file
        console.log(`Exporting report "${report.name}" as ${format.toUpperCase()}`);
        // Simulate download
        const filename = `${report.name.replace(/\s+/g, '_')}.${format}`;
        console.log(`Downloaded: ${filename}`);
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
          description: 'Comprehensive budget analysis with spending trends'
        },
        {
          type: 'progress' as ReportType,
          name: 'Progress Report',
          description: 'Project progress with task completion status'
        },
        {
          type: 'contractor' as ReportType,
          name: 'Contractor Performance',
          description: 'Performance metrics for all contractors'
        },
        {
          type: 'inventory' as ReportType,
          name: 'Inventory Status',
          description: 'Current inventory levels and low stock alerts'
        },
        {
          type: 'weekly' as ReportType,
          name: 'Weekly Summary',
          description: 'Comprehensive weekly project summary'
        }
      ]
    }),
    { name: 'report-storage' }
  )
);
