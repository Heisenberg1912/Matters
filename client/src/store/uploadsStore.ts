import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uploadsApi, authStorage, type Upload } from '../lib/api';

interface UploadsStore {
  uploads: Upload[];
  selectedType: 'all' | 'image' | 'video' | 'document';
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastSynced: string | null;

  // Actions
  fetchUploads: (projectId: string) => Promise<void>;
  uploadFile: (projectId: string, file: File, options?: { category?: string; description?: string; stageId?: string }) => Promise<Upload | null>;
  deleteUpload: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  setSelectedType: (type: 'all' | 'image' | 'video' | 'document') => void;

  // Computed getters
  getFilteredUploads: () => Upload[];
  getFavorites: () => Upload[];
  getByCategory: (category: string) => Upload[];
  getStats: () => { total: number; images: number; videos: number; documents: number };
}

export const useUploadsStore = create<UploadsStore>()(
  persist(
    (set, get) => ({
      uploads: [],
      selectedType: 'all',
      isLoading: false,
      isSubmitting: false,
      error: null,
      lastSynced: null,

      fetchUploads: async (projectId: string) => {
        if (!authStorage.isAuthenticated()) {
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await uploadsApi.getUploads(projectId, { limit: 100 });

          if (response.success && response.data) {
            set({
              uploads: response.data.uploads,
              lastSynced: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Failed to fetch uploads:', error);
          set({ error: 'Failed to load uploads' });
        } finally {
          set({ isLoading: false });
        }
      },

      uploadFile: async (projectId: string, file: File, options = {}) => {
        set({ isSubmitting: true, error: null });
        try {
          // Convert file to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const response = await uploadsApi.uploadFile({
            project: projectId,
            stage: options.stageId,
            file: base64,
            filename: file.name,
            mimeType: file.type,
            category: options.category || 'progress_photo',
            description: options.description,
          });

          if (response.success && response.data?.upload) {
            set((state) => ({
              uploads: [response.data!.upload, ...state.uploads],
            }));
            return response.data.upload;
          }
          return null;
        } catch (error) {
          console.error('Failed to upload file:', error);
          set({ error: 'Failed to upload file' });
          throw error;
        } finally {
          set({ isSubmitting: false });
        }
      },

      deleteUpload: async (id: string) => {
        // Optimistic update
        set((state) => ({
          uploads: state.uploads.filter((u) => u._id !== id),
        }));

        if (authStorage.isAuthenticated()) {
          set({ isSubmitting: true });
          try {
            await uploadsApi.deleteUpload(id);
          } catch (error) {
            console.error('Failed to delete upload:', error);
            // Revert on error
            await get().fetchUploads(authStorage.getCurrentProjectId() || '');
          } finally {
            set({ isSubmitting: false });
          }
        }
      },

      toggleFavorite: async (id: string) => {
        // Optimistic update
        set((state) => ({
          uploads: state.uploads.map((u) =>
            u._id === id ? { ...u, isFavorite: !u.isFavorite } : u
          ),
        }));

        if (authStorage.isAuthenticated()) {
          try {
            await uploadsApi.toggleFavorite(id);
          } catch (error) {
            console.error('Failed to toggle favorite:', error);
            // Revert on error
            set((state) => ({
              uploads: state.uploads.map((u) =>
                u._id === id ? { ...u, isFavorite: !u.isFavorite } : u
              ),
            }));
          }
        }
      },

      setSelectedType: (type) => set({ selectedType: type }),

      getFilteredUploads: () => {
        const state = get();
        if (state.selectedType === 'all') {
          return state.uploads;
        }
        return state.uploads.filter((u) => u.type === state.selectedType);
      },

      getFavorites: () => {
        const state = get();
        return state.uploads.filter((u) => u.isFavorite);
      },

      getByCategory: (category: string) => {
        const state = get();
        return state.uploads.filter((u) => u.category === category);
      },

      getStats: () => {
        const state = get();
        return {
          total: state.uploads.length,
          images: state.uploads.filter((u) => u.type === 'image').length,
          videos: state.uploads.filter((u) => u.type === 'video').length,
          documents: state.uploads.filter((u) => u.type === 'document').length,
        };
      },
    }),
    { name: 'uploads-storage' }
  )
);
