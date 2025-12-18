import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BudgetCategory, Expense, SpendingHistoryEntry } from './types';
import { seedBudgetCategories, seedExpenses, seedSpendingHistory } from './mockData';

interface BudgetStore {
  categories: BudgetCategory[];
  expenses: Expense[];
  spendingHistory: SpendingHistoryEntry[];
  isLoading: boolean;
  isSubmitting: boolean;

  // Actions
  addCategory: (category: Omit<BudgetCategory, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<BudgetCategory>) => void;
  deleteCategory: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Computed getters
  getTotalAllocated: () => number;
  getTotalSpent: () => number;
  getPercentSpent: () => number;
  getCategoriesWithProgress: () => (BudgetCategory & { percentSpent: number })[];
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      categories: seedBudgetCategories(),
      expenses: seedExpenses(),
      spendingHistory: seedSpendingHistory(),
      isLoading: false,
      isSubmitting: false,

      // Category actions
      addCategory: (category) =>
        set((state) => ({
          categories: [
            ...state.categories,
            { ...category, id: `cat-${Date.now()}`, spent: 0 }
          ]
        })),

      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, ...updates } : cat
          )
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id)
        })),

      // Expense actions
      addExpense: (expense) =>
        set((state) => {
          const newExpense = { ...expense, id: `exp-${Date.now()}` };

          // Update category spent amount
          const updatedCategories = state.categories.map((cat) =>
            cat.name === expense.category
              ? { ...cat, spent: cat.spent + expense.amount }
              : cat
          );

          return {
            expenses: [newExpense, ...state.expenses],
            categories: updatedCategories
          };
        }),

      updateExpense: (id, updates) =>
        set((state) => {
          const oldExpense = state.expenses.find((exp) => exp.id === id);
          if (!oldExpense) return state;

          const updatedExpenses = state.expenses.map((exp) =>
            exp.id === id ? { ...exp, ...updates } : exp
          );

          // Recalculate category spent if amount or category changed
          let updatedCategories = state.categories;
          if (updates.amount !== undefined || updates.category !== undefined) {
            updatedCategories = state.categories.map((cat) => {
              if (cat.name === oldExpense.category) {
                return { ...cat, spent: cat.spent - oldExpense.amount };
              }
              if (cat.name === (updates.category || oldExpense.category)) {
                return { ...cat, spent: cat.spent + (updates.amount || oldExpense.amount) };
              }
              return cat;
            });
          }

          return {
            expenses: updatedExpenses,
            categories: updatedCategories
          };
        }),

      deleteExpense: (id) =>
        set((state) => {
          const expense = state.expenses.find((exp) => exp.id === id);
          if (!expense) return state;

          const updatedCategories = state.categories.map((cat) =>
            cat.name === expense.category
              ? { ...cat, spent: Math.max(0, cat.spent - expense.amount) }
              : cat
          );

          return {
            expenses: state.expenses.filter((exp) => exp.id !== id),
            categories: updatedCategories
          };
        }),

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
          percentSpent: cat.allocated > 0 ? Math.round((cat.spent / cat.allocated) * 100) : 0
        }));
      }
    }),
    { name: 'budget-storage' }
  )
);
