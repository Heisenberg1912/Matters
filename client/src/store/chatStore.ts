import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { chatApi, authStorage, type ChatMessage } from '../lib/api';

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;

  // Actions
  sendMessage: (message: string, projectId?: string) => Promise<string>;
  analyzeImage: (imageBase64: string, prompt?: string) => Promise<string>;
  clearHistory: (projectId?: string) => Promise<void>;
  loadHistory: (projectId: string) => Promise<void>;
  getSuggestions: (projectId?: string) => Promise<Array<{ type: string; title: string; message: string }>>;
  appendMessage: (message: ChatMessage) => void;
  reset: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      error: null,
      conversationId: null,

      sendMessage: async (message: string, projectId?: string) => {
        set({ isLoading: true, error: null });

        // Add user message immediately
        const userMessage: ChatMessage = {
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          messages: [...state.messages, userMessage],
        }));

        try {
          const response = await chatApi.sendMessage({
            message,
            projectId: projectId || authStorage.getCurrentProjectId() || undefined,
            history: get().messages.slice(-10), // Send last 10 messages for context
          });

          if (response.success && response.data) {
            const assistantMessage: ChatMessage = {
              role: 'assistant',
              content: response.data.response,
              timestamp: new Date().toISOString(),
            };

            set((state) => ({
              messages: [...state.messages, assistantMessage],
              conversationId: response.data?.conversationId || state.conversationId,
            }));

            return response.data.response;
          } else {
            throw new Error(response.error || 'Failed to get response');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
          set({ error: errorMessage });

          // Add error message as assistant response
          const errorResponse: ChatMessage = {
            role: 'assistant',
            content: "I'm sorry, I couldn't process your request. Please try again.",
            timestamp: new Date().toISOString(),
          };
          set((state) => ({
            messages: [...state.messages, errorResponse],
          }));

          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      analyzeImage: async (imageBase64: string, prompt?: string) => {
        set({ isLoading: true, error: null });

        // Add user message with image indicator
        const userMessage: ChatMessage = {
          role: 'user',
          content: prompt || 'Analyze this construction site image',
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          messages: [...state.messages, userMessage],
        }));

        try {
          const response = await chatApi.analyzeImage({
            image: imageBase64,
            prompt,
          });

          if (response.success && response.data) {
            const assistantMessage: ChatMessage = {
              role: 'assistant',
              content: response.data.response,
              timestamp: new Date().toISOString(),
            };

            set((state) => ({
              messages: [...state.messages, assistantMessage],
            }));

            return response.data.response;
          } else {
            throw new Error('Failed to analyze image');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to analyze image';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      loadHistory: async (projectId: string) => {
        if (!authStorage.isAuthenticated()) {
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await chatApi.getHistory(projectId);

          if (response.success && response.data?.history) {
            set({ messages: response.data.history });
          }
        } catch (error) {
          console.error('Failed to load chat history:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      clearHistory: async (projectId?: string) => {
        set({ messages: [], conversationId: null });

        const pid = projectId || authStorage.getCurrentProjectId();
        if (authStorage.isAuthenticated() && pid) {
          try {
            await chatApi.clearHistory(pid);
          } catch (error) {
            console.error('Failed to clear chat history on server:', error);
          }
        }
      },

      getSuggestions: async (projectId?: string) => {
        try {
          const response = await chatApi.getSuggestions(
            projectId || authStorage.getCurrentProjectId() || undefined
          );

          if (response.success && response.data?.suggestions) {
            return response.data.suggestions;
          }
        } catch (error) {
          console.error('Failed to get suggestions:', error);
        }
        return [];
      },

      appendMessage: (message: ChatMessage) => {
        set((state) => ({
          messages: [...state.messages, message],
        }));
      },

      reset: () => {
        set({
          messages: [],
          isLoading: false,
          error: null,
          conversationId: null,
        });
      },
    }),
    { name: 'chat-storage' }
  )
);
