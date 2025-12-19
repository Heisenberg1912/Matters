import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InventoryItem } from './types';
import { seedInventoryItems } from './mockData';
import { inventoryApi, authStorage, type InventoryItemAPI } from '../lib/api';

interface InventoryStore {
  items: InventoryItem[];
  selectedCategory: string;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastSynced: string | null;

  // Actions
  addItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  updateStock: (id: string, quantity: number) => Promise<void>;
  setSelectedCategory: (category: string) => void;

  // API sync actions
  fetchInventoryData: (projectId: string) => Promise<void>;
  syncWithBackend: (projectId: string) => Promise<void>;

  // Computed getters
  getFilteredItems: () => InventoryItem[];
  getLowStockCount: () => number;
  getTotalValue: () => number;
  getCategories: () => string[];
}

// Helper to map API item to frontend format
const mapApiItemToItem = (apiItem: InventoryItemAPI): InventoryItem => ({
  id: apiItem._id,
  name: apiItem.name,
  category: apiItem.category,
  quantity: apiItem.quantity.current,
  unit: apiItem.unit,
  minStock: apiItem.quantity.minimum,
  cost: apiItem.price.perUnit,
  location: apiItem.location,
  lastUpdated: apiItem.updatedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
  lowStock: apiItem.status === 'low_stock' || apiItem.status === 'out_of_stock',
});

// Helper to map frontend item to API format
const mapItemToApiItem = (item: Omit<InventoryItem, 'id'> & { id?: string }) => ({
  name: item.name,
  category: item.category.toLowerCase(),
  quantity: {
    current: item.quantity,
    minimum: item.minStock,
    ordered: 0,
  },
  unit: item.unit,
  price: {
    perUnit: item.cost,
    currency: 'INR',
  },
  location: item.location,
});

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      items: seedInventoryItems(),
      selectedCategory: 'All',
      isLoading: false,
      isSubmitting: false,
      error: null,
      lastSynced: null,

      // Fetch inventory data from backend
      fetchInventoryData: async (projectId: string) => {
        if (!authStorage.isAuthenticated()) {
          return; // Use local mock data if not authenticated
        }

        set({ isLoading: true, error: null });
        try {
          const response = await inventoryApi.getItems(projectId, { limit: 100 });

          if (response.success && response.data) {
            const items = response.data.items.map(mapApiItemToItem);
            set({
              items: items.length > 0 ? items : get().items,
              lastSynced: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Failed to fetch inventory data:', error);
          set({ error: 'Failed to load inventory data' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Sync local changes with backend
      syncWithBackend: async (projectId: string) => {
        if (!authStorage.isAuthenticated()) {
          return;
        }
        await get().fetchInventoryData(projectId);
      },

      addItem: async (item) => {
        const projectId = authStorage.getCurrentProjectId();
        const newItem: InventoryItem = {
          ...item,
          id: `inv-${Date.now()}`,
          lowStock: item.quantity < item.minStock,
        };

        // Optimistic update
        set((state) => ({
          items: [...state.items, newItem],
        }));

        // Sync with backend
        if (authStorage.isAuthenticated() && projectId) {
          set({ isSubmitting: true });
          try {
            const response = await inventoryApi.createItem({
              project: projectId,
              ...mapItemToApiItem(item),
            });

            if (response.success && response.data?.item) {
              // Update with real ID from backend
              set((state) => ({
                items: state.items.map((i) =>
                  i.id === newItem.id
                    ? mapApiItemToItem(response.data!.item)
                    : i
                ),
              }));
            }
          } catch (error) {
            console.error('Failed to sync inventory item:', error);
          } finally {
            set({ isSubmitting: false });
          }
        }
      },

      updateItem: async (id, updates) => {
        // Optimistic update
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;
            const updated = { ...item, ...updates };
            updated.lowStock = updated.quantity < updated.minStock;
            return updated;
          }),
        }));

        // Sync with backend
        if (authStorage.isAuthenticated() && !id.startsWith('inv-')) {
          set({ isSubmitting: true });
          try {
            const apiUpdates: Partial<InventoryItemAPI> = {};
            if (updates.name) apiUpdates.name = updates.name;
            if (updates.category) apiUpdates.category = updates.category.toLowerCase() as InventoryItemAPI['category'];
            if (updates.quantity !== undefined || updates.minStock !== undefined) {
              const currentItem = get().items.find((i) => i.id === id);
              apiUpdates.quantity = {
                current: updates.quantity ?? currentItem?.quantity ?? 0,
                minimum: updates.minStock ?? currentItem?.minStock ?? 0,
                ordered: 0,
              };
            }
            if (updates.cost !== undefined) {
              apiUpdates.price = { perUnit: updates.cost, currency: 'INR' };
            }
            if (updates.unit) apiUpdates.unit = updates.unit;
            if (updates.location) apiUpdates.location = updates.location;

            await inventoryApi.updateItem(id, apiUpdates);
          } catch (error) {
            console.error('Failed to update inventory item:', error);
          } finally {
            set({ isSubmitting: false });
          }
        }
      },

      deleteItem: async (id) => {
        // Optimistic update
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));

        // Sync with backend
        if (authStorage.isAuthenticated() && !id.startsWith('inv-')) {
          set({ isSubmitting: true });
          try {
            await inventoryApi.deleteItem(id);
          } catch (error) {
            console.error('Failed to delete inventory item:', error);
          } finally {
            set({ isSubmitting: false });
          }
        }
      },

      updateStock: async (id, quantity) => {
        const currentItem = get().items.find((item) => item.id === id);
        if (!currentItem) return;

        // Optimistic update
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;
            return {
              ...item,
              quantity,
              lastUpdated: new Date().toISOString().split('T')[0],
              lowStock: quantity < item.minStock,
            };
          }),
        }));

        // Sync with backend
        if (authStorage.isAuthenticated() && !id.startsWith('inv-')) {
          set({ isSubmitting: true });
          try {
            const adjustment = quantity - currentItem.quantity;
            await inventoryApi.adjustStock(id, adjustment, 'Stock adjustment');
          } catch (error) {
            console.error('Failed to update stock:', error);
          } finally {
            set({ isSubmitting: false });
          }
        }
      },

      setSelectedCategory: (category) => set({ selectedCategory: category }),

      getFilteredItems: () => {
        const state = get();
        if (state.selectedCategory === 'All') {
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
        return ['All', ...Array.from(categories).sort()];
      },
    }),
    { name: 'inventory-storage' }
  )
);
