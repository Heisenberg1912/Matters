import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Document, Folder, DocumentType } from './types';
import { seedDocuments, seedFolders } from './mockData';

interface DocumentStore {
  documents: Document[];
  folders: Folder[];
  selectedFolder: string | null;
  isLoading: boolean;
  isSubmitting: boolean;

  // Actions
  addDocument: (document: Omit<Document, 'id' | 'uploadDate'>) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  moveDocument: (id: string, newFolder: string) => void;
  setSelectedFolder: (folder: string | null) => void;

  // Computed getters
  getDocumentsByFolder: (folder?: string) => Document[];
  getDocumentsByType: (type: DocumentType) => Document[];
  getRecentDocuments: (count?: number) => Document[];
  getTotalSize: () => number;
  getDocumentCount: () => number;
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      documents: seedDocuments(),
      folders: seedFolders(),
      selectedFolder: null,
      isLoading: false,
      isSubmitting: false,

      addDocument: (document) =>
        set((state) => {
          const newDocument = {
            ...document,
            id: `doc-${Date.now()}`,
            uploadDate: new Date().toISOString().split('T')[0]
          };

          // Update folder document count
          const updatedFolders = state.folders.map((folder) =>
            folder.name === document.folder
              ? { ...folder, documentCount: folder.documentCount + 1 }
              : folder
          );

          return {
            documents: [newDocument, ...state.documents],
            folders: updatedFolders
          };
        }),

      updateDocument: (id, updates) =>
        set((state) => {
          const oldDoc = state.documents.find((doc) => doc.id === id);
          const updatedDocuments = state.documents.map((doc) =>
            doc.id === id ? { ...doc, ...updates } : doc
          );

          // Update folder counts if folder changed
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
        }),

      deleteDocument: (id) =>
        set((state) => {
          const document = state.documents.find((doc) => doc.id === id);
          if (!document) return state;

          const updatedFolders = state.folders.map((folder) =>
            folder.name === document.folder
              ? { ...folder, documentCount: Math.max(0, folder.documentCount - 1) }
              : folder
          );

          return {
            documents: state.documents.filter((doc) => doc.id !== id),
            folders: updatedFolders
          };
        }),

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
      }
    }),
    { name: 'document-storage' }
  )
);
