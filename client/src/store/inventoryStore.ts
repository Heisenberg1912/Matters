import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InventoryItem } from './types';
import { seedInventoryItems } from './mockData';

interface InventoryStore {
  items: InventoryItem[];
  selectedCategory: string;
  isLoading: boolean;
  isSubmitting: boolean;

  // Actions
  addItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  updateStock: (id: string, quantity: number) => void;
  setSelectedCategory: (category: string) => void;

  // Computed getters
  getFilteredItems: () => InventoryItem[];
  getLowStockCount: () => number;
  getTotalValue: () => number;
  getCategories: () => string[];
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      items: seedInventoryItems(),
      selectedCategory: "All",
      isLoading: false,
      isSubmitting: false,

      addItem: (item) =>
        set((state) => ({
          items: [
            ...state.items,
            {
              ...item,
              id: `inv-${Date.now()}`,
              lowStock: item.quantity < item.minStock
            }
          ]
        })),

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;
            const updated = { ...item, ...updates };
            updated.lowStock = updated.quantity < updated.minStock;
            return updated;
          })
        })),

      deleteItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id)
        })),

      updateStock: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;
            const updated = {
              ...item,
              quantity,
              lastUpdated: new Date().toISOString().split('T')[0],
              lowStock: quantity < item.minStock
            };
            return updated;
          })
        })),

      setSelectedCategory: (category) => set({ selectedCategory: category }),

      getFilteredItems: () => {
        const state = get();
        if (state.selectedCategory === "All") {
          return state.items;
        }
        return state.items.filter((item) => item.category === state.selectedCategory);
      },

      getLowStockCount: () => {
        const state = get();
        return state.items.filter(
          (item) => item.lowStock || item.quantity < item.minStock
        ).length;
      },

      getTotalValue: () => {
        const state = get();
        return state.items.reduce((sum, item) => sum + item.quantity * item.cost, 0);
      },

      getCategories: () => {
        const state = get();
        const categories = new Set(state.items.map((item) => item.category));
        return ["All", ...Array.from(categories).sort()];
      }
    }),
    { name: 'inventory-storage' }
  )
);
