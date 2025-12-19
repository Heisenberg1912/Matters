import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Document, Folder, DocumentType } from './types';
import { seedDocuments, seedFolders } from './mockData';
import { uploadsApi, authStorage, type Upload } from '../lib/api';

interface DocumentStore {
  documents: Document[];
  folders: Folder[];
  selectedFolder: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastSynced: string | null;

  // Actions
  addDocument: (document: Omit<Document, 'id' | 'uploadDate'>) => Promise<void>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  moveDocument: (id: string, newFolder: string) => void;
  setSelectedFolder: (folder: string | null) => void;

  // API sync actions
  fetchDocuments: (projectId: string) => Promise<void>;
  uploadDocument: (projectId: string, file: File, folder: string) => Promise<void>;

  // Computed getters
  getDocumentsByFolder: (folder?: string) => Document[];
  getDocumentsByType: (type: DocumentType) => Document[];
  getRecentDocuments: (count?: number) => Document[];
  getTotalSize: () => number;
  getDocumentCount: () => number;
}

// Helper to map API upload to frontend document
const mapUploadToDocument = (upload: Upload): Document => ({
  id: upload._id,
  name: upload.originalName || upload.filename,
  type: mapMimeTypeToDocType(upload.mimeType),
  folder: upload.category || 'Documents',
  size: upload.size,
  uploadDate: upload.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
  description: upload.description,
  url: upload.storage?.url,
});

// Helper to map MIME type to document type
const mapMimeTypeToDocType = (mimeType: string): DocumentType => {
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'spreadsheet';
  if (mimeType.includes('dwg') || mimeType.includes('cad')) return 'cad';
  return 'other';
};

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      documents: seedDocuments(),
      folders: seedFolders(),
      selectedFolder: null,
      isLoading: false,
      isSubmitting: false,
      error: null,
      lastSynced: null,

      // Fetch documents from backend
      fetchDocuments: async (projectId: string) => {
        if (!authStorage.isAuthenticated()) {
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await uploadsApi.getUploads(projectId, { type: 'document', limit: 100 });

          if (response.success && response.data) {
            const documents = response.data.uploads.map(mapUploadToDocument);

            // Update folder counts
            const folderCounts: Record<string, number> = {};
            documents.forEach((doc) => {
              folderCounts[doc.folder] = (folderCounts[doc.folder] || 0) + 1;
            });

            const updatedFolders = get().folders.map((folder) => ({
              ...folder,
              documentCount: folderCounts[folder.name] || 0,
            }));

            set({
              documents: documents.length > 0 ? documents : get().documents,
              folders: updatedFolders,
              lastSynced: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Failed to fetch documents:', error);
          set({ error: 'Failed to load documents' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Upload a new document
      uploadDocument: async (projectId: string, file: File, folder: string) => {
        set({ isSubmitting: true, error: null });
        try {
          // Convert file to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]); // Remove data:xxx;base64, prefix
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const response = await uploadsApi.uploadFile({
            project: projectId,
            file: base64,
            filename: file.name,
            mimeType: file.type,
            category: folder,
            description: `Uploaded on ${new Date().toLocaleDateString()}`,
          });

          if (response.success && response.data?.upload) {
            const newDocument = mapUploadToDocument(response.data.upload);
            set((state) => {
              const updatedFolders = state.folders.map((f) =>
                f.name === folder
                  ? { ...f, documentCount: f.documentCount + 1 }
                  : f
              );
              return {
                documents: [newDocument, ...state.documents],
                folders: updatedFolders,
              };
            });
          }
        } catch (error) {
          console.error('Failed to upload document:', error);
          set({ error: 'Failed to upload document' });
          throw error;
        } finally {
          set({ isSubmitting: false });
        }
      },

      addDocument: async (document) => {
        const projectId = authStorage.getCurrentProjectId();
        const newDocument: Document = {
          ...document,
          id: `doc-${Date.now()}`,
          uploadDate: new Date().toISOString().split('T')[0],
        };

        // Optimistic update
        set((state) => {
          const updatedFolders = state.folders.map((folder) =>
            folder.name === document.folder
              ? { ...folder, documentCount: folder.documentCount + 1 }
              : folder
          );

          return {
            documents: [newDocument, ...state.documents],
            folders: updatedFolders,
          };
        });

        // Backend sync is handled by uploadDocument for actual file uploads
        // This method is for local-only document additions
      },

      updateDocument: async (id, updates) => {
        const oldDoc = get().documents.find((doc) => doc.id === id);

        // Optimistic update
        set((state) => {
          const updatedDocuments = state.documents.map((doc) =>
            doc.id === id ? { ...doc, ...updates } : doc
          );

          let updatedFolders = state.folders;
          if (oldDoc && updates.folder && updates.folder !== oldDoc.folder) {
            updatedFolders = state.folders.map((folder) => {
              if (folder.name === oldDoc.folder) {
                return { ...folder, documentCount: folder.documentCount - 1 };
              }
              if (folder.name === updates.folder) {
                return { ...folder, documentCount: folder.documentCount + 1 };
              }
              return folder;
            });
          }

          return { documents: updatedDocuments, folders: updatedFolders };
        });

        // Sync with backend
        if (authStorage.isAuthenticated() && !id.startsWith('doc-')) {
          set({ isSubmitting: true });
          try {
            await uploadsApi.updateUpload(id, {
              category: updates.folder,
              description: updates.description,
            });
          } catch (error) {
            console.error('Failed to update document:', error);
          } finally {
            set({ isSubmitting: false });
          }
        }
      },

      deleteDocument: async (id) => {
        const document = get().documents.find((doc) => doc.id === id);
        if (!document) return;

        // Optimistic update
        set((state) => {
          const updatedFolders = state.folders.map((folder) =>
            folder.name === document.folder
              ? { ...folder, documentCount: Math.max(0, folder.documentCount - 1) }
              : folder
          );

          return {
            documents: state.documents.filter((doc) => doc.id !== id),
            folders: updatedFolders,
          };
        });

        // Sync with backend
        if (authStorage.isAuthenticated() && !id.startsWith('doc-')) {
          set({ isSubmitting: true });
          try {
            await uploadsApi.deleteUpload(id);
          } catch (error) {
            console.error('Failed to delete document:', error);
          } finally {
            set({ isSubmitting: false });
          }
        }
      },

      moveDocument: (id, newFolder) => {
        get().updateDocument(id, { folder: newFolder });
      },

      setSelectedFolder: (folder) => set({ selectedFolder: folder }),

      getDocumentsByFolder: (folder) => {
        const state = get();
        const targetFolder = folder || state.selectedFolder;
        if (!targetFolder) return state.documents;
        return state.documents.filter((doc) => doc.folder === targetFolder);
      },

      getDocumentsByType: (type) => {
        const state = get();
        return state.documents.filter((doc) => doc.type === type);
      },

      getRecentDocuments: (count = 5) => {
        const state = get();
        return [...state.documents]
          .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate))
          .slice(0, count);
      },

      getTotalSize: () => {
        const state = get();
        return state.documents.reduce((sum, doc) => sum + doc.size, 0);
      },

      getDocumentCount: () => {
        const state = get();
        return state.documents.length;
      },
    }),
    { name: 'document-storage' }
  )
);
