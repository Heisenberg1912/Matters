import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BudgetCategory, Expense, SpendingHistoryEntry } from './types';
import { seedBudgetCategories, seedExpenses, seedSpendingHistory } from './mockData';
import { budgetApi, authStorage } from '../lib/api';

interface BudgetStore {
  categories: BudgetCategory[];
  expenses: Expense[];
  spendingHistory: SpendingHistoryEntry[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastSynced: string | null;

  // Actions
  addCategory: (category: Omit<BudgetCategory, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<BudgetCategory>) => void;
  deleteCategory: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // API sync actions
  fetchBudgetData: (projectId: string) => Promise<void>;
  syncWithBackend: (projectId: string) => Promise<void>;

  // Computed getters
  getTotalAllocated: () => number;
  getTotalSpent: () => number;
  getPercentSpent: () => number;
  getCategoriesWithProgress: () => (BudgetCategory & { percentSpent: number })[];
}

// Helper to map API bill to frontend expense
const mapBillToExpense = (bill: {
  _id: string;
  billDate: string;
  category: string;
  title: string;
  amount: { total: number };
  vendor?: { name?: string };
}): Expense => ({
  id: bill._id,
  date: bill.billDate?.split('T')[0] || new Date().toISOString().split('T')[0],
  category: bill.category || 'Other',
  description: bill.title,
  amount: bill.amount?.total || 0,
  vendor: bill.vendor?.name || 'Unknown',
});

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      categories: seedBudgetCategories(),
      expenses: seedExpenses(),
      spendingHistory: seedSpendingHistory(),
      isLoading: false,
      isSubmitting: false,
      error: null,
      lastSynced: null,

      // Fetch budget data from backend
      fetchBudgetData: async (projectId: string) => {
        if (!authStorage.isAuthenticated()) {
          return; // Use local mock data if not authenticated
        }

        set({ isLoading: true, error: null });
        try {
          const [billsResponse, summaryResponse] = await Promise.all([
            budgetApi.getBills(projectId, { limit: 100 }),
            budgetApi.getSummary(projectId),
          ]);

          if (billsResponse.success && billsResponse.data) {
            const expenses = billsResponse.data.bills.map(mapBillToExpense);
            set({ expenses });
          }

          if (summaryResponse.success && summaryResponse.data) {
            const { byCategory, monthlyTrend, overview } = summaryResponse.data;

            // Map backend categories to frontend format
            const existingCategories = get().categories;
            const updatedCategories = existingCategories.map((cat) => {
              const backendCategory = byCategory.find(
                (bc) => bc._id?.toLowerCase() === cat.name.toLowerCase()
              );
              return {
                ...cat,
                spent: backendCategory?.total || cat.spent,
              };
            });

            // Update spending history from monthly trend
            const spendingHistory: SpendingHistoryEntry[] = monthlyTrend.map((m) => ({
              date: m.month,
              spent: m.total,
              allocated: overview.totalBudget / 12, // Approximation
            }));

            set({
              categories: updatedCategories,
              spendingHistory: spendingHistory.length > 0 ? spendingHistory : get().spendingHistory,
              lastSynced: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Failed to fetch budget data:', error);
          set({ error: 'Failed to load budget data' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Sync local changes with backend
      syncWithBackend: async (projectId: string) => {
        if (!authStorage.isAuthenticated()) {
          return;
        }
        await get().fetchBudgetData(projectId);
      },

      // Category actions (local only for now)
      addCategory: (category) =>
        set((state) => ({
          categories: [
            ...state.categories,
            { ...category, id: `cat-${Date.now()}`, spent: 0 },
          ],
        })),

      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, ...updates } : cat
          ),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
        })),

      // Expense actions - sync with backend
      addExpense: async (expense) => {
        const projectId = authStorage.getCurrentProjectId();
        const newExpense = { ...expense, id: `exp-${Date.now()}` };

        // Optimistic update
        set((state) => {
          const updatedCategories = state.categories.map((cat) =>
            cat.name === expense.category
              ? { ...cat, spent: cat.spent + expense.amount }
              : cat
          );

          return {
            expenses: [newExpense, ...state.expenses],
            categories: updatedCategories,
          };
        });

        // Sync with backend
        if (authStorage.isAuthenticated() && projectId) {
          set({ isSubmitting: true });
          try {
            const response = await budgetApi.createBill({
              project: projectId,
              title: expense.description,
              category: expense.category,
              amount: { subtotal: expense.amount, tax: 0, total: expense.amount },
              vendor: { name: expense.vendor },
              billDate: expense.date,
              type: 'expense',
              payment: { status: 'paid', paidAmount: expense.amount },
            });

            if (response.success && response.data?.bill) {
              // Update with real ID from backend
              set((state) => ({
                expenses: state.expenses.map((exp) =>
                  exp.id === newExpense.id
                    ? { ...exp, id: response.data!.bill._id }
                    : exp
                ),
              }));
            }
          } catch (error) {
            console.error('Failed to sync expense:', error);
            // Keep local data on error
          } finally {
            set({ isSubmitting: false });
          }
        }
      },

      updateExpense: async (id, updates) => {
        const state = get();
        const oldExpense = state.expenses.find((exp) => exp.id === id);
        if (!oldExpense) return;

        // Optimistic update
        set((state) => {
          const updatedExpenses = state.expenses.map((exp) =>
            exp.id === id ? { ...exp, ...updates } : exp
          );

          let updatedCategories = state.categories;
          if (updates.amount !== undefined || updates.category !== undefined) {
            updatedCategories = state.categories.map((cat) => {
              if (cat.name === oldExpense.category) {
                return { ...cat, spent: cat.spent - oldExpense.amount };
              }
              if (cat.name === (updates.category || oldExpense.category)) {
                return {
                  ...cat,
                  spent: cat.spent + (updates.amount || oldExpense.amount),
                };
              }
              return cat;
            });
          }

          return {
            expenses: updatedExpenses,
            categories: updatedCategories,
          };
        });

        // Sync with backend
        if (authStorage.isAuthenticated() && !id.startsWith('exp-')) {
          set({ isSubmitting: true });
          try {
            await budgetApi.updateBill(id, {
              title: updates.description,
              category: updates.category,
              amount: updates.amount
                ? { subtotal: updates.amount, tax: 0, total: updates.amount }
                : undefined,
              vendor: updates.vendor ? { name: updates.vendor } : undefined,
              billDate: updates.date,
            });
          } catch (error) {
            console.error('Failed to update expense:', error);
          } finally {
            set({ isSubmitting: false });
          }
        }
      },

      deleteExpense: async (id) => {
        const state = get();
        const expense = state.expenses.find((exp) => exp.id === id);
        if (!expense) return;

        // Optimistic update
        set((state) => {
          const updatedCategories = state.categories.map((cat) =>
            cat.name === expense.category
              ? { ...cat, spent: Math.max(0, cat.spent - expense.amount) }
              : cat
          );

          return {
            expenses: state.expenses.filter((exp) => exp.id !== id),
            categories: updatedCategories,
          };
        });

        // Sync with backend
        if (authStorage.isAuthenticated() && !id.startsWith('exp-')) {
          set({ isSubmitting: true });
          try {
            await budgetApi.deleteBill(id);
          } catch (error) {
            console.error('Failed to delete expense:', error);
          } finally {
            set({ isSubmitting: false });
          }
        }
      },

      // Computed values
      getTotalAllocated: () => {
        const state = get();
        return state.categories.reduce((sum, cat) => sum + cat.allocated, 0);
      },

      getTotalSpent: () => {
        const state = get();
        return state.categories.reduce((sum, cat) => sum + cat.spent, 0);
      },

      getPercentSpent: () => {
        const state = get();
        const total = state.getTotalAllocated();
        const spent = state.getTotalSpent();
        return total > 0 ? Math.round((spent / total) * 100) : 0;
      },

      getCategoriesWithProgress: () => {
        const state = get();
        return state.categories.map((cat) => ({
          ...cat,
          percentSpent:
            cat.allocated > 0 ? Math.round((cat.spent / cat.allocated) * 100) : 0,
        }));
      },
    }),
    { name: 'budget-storage' }
  )
);
