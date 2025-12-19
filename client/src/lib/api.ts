/**
 * Comprehensive API Service Layer for MATTERS
 * Handles all backend communication with authentication and error handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000');
const API_PREFIX = import.meta.env.VITE_API_BASE_URL || '/api';

// Storage keys for auth tokens
const ACCESS_TOKEN_KEY = 'matters-access-token';
const REFRESH_TOKEN_KEY = 'matters-refresh-token';
const USER_KEY = 'matters-user';
const CURRENT_PROJECT_KEY = 'matters-current-project';

// Types
export interface User {
  _id: string;
  id?: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'contractor' | 'admin' | 'superadmin';
  isVerified: boolean;
  isActive: boolean;
  company?: string;
  specializations?: string[];
  preferences?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Budget Types
export interface Bill {
  _id: string;
  project: string;
  stage?: string;
  createdBy: { _id: string; name: string; email: string };
  title: string;
  description?: string;
  type: string;
  category: string;
  vendor?: { name: string; contact?: string };
  items?: Array<{ name: string; quantity: number; unitPrice: number; total: number }>;
  amount: { subtotal: number; tax: number; total: number };
  payment: { status: string; method?: string; paidAmount: number };
  billDate: string;
  invoiceNumber?: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
}

export interface BudgetSummary {
  overview: {
    totalBudget: number;
    totalSpent: number;
    totalPaid: number;
    pending: number;
    billCount: number;
    utilization: number;
  };
  byType: Array<{ _id: string; total: number; paid: number; count: number }>;
  byCategory: Array<{ _id: string; total: number; count: number }>;
  monthlyTrend: Array<{ month: string; total: number; count: number }>;
}

// Inventory Types
export interface InventoryItemAPI {
  _id: string;
  project: string;
  name: string;
  category: string;
  quantity: { current: number; minimum: number; ordered: number };
  unit: string;
  price: { perUnit: number; currency: string };
  supplier?: { name?: string; contact?: string; email?: string };
  location: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'ordered';
  lastRestocked?: string;
  notes?: string;
  createdBy?: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

// Upload Types
export interface Upload {
  _id: string;
  project: string;
  stage?: { _id: string; name: string };
  uploadedBy: { _id: string; name: string; email: string; avatar?: string };
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: 'image' | 'video' | 'document' | 'audio' | 'other';
  category: string;
  storage: { provider: string; path?: string; url?: string; fileId?: string };
  tags?: string[];
  description?: string;
  isFavorite: boolean;
  isPublic: boolean;
  views: number;
  analysis?: Record<string, unknown>;
  createdAt: string;
}

// Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  response: string;
  mock?: boolean;
  conversationId?: string;
}

// Project Types
export interface Project {
  _id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  owner: string | { _id: string; name: string; email: string };
  location?: { address?: string; city?: string; state?: string; country?: string };
  budget: { estimated: number; spent: number };
  progress?: { percentage: number };
  currentStage?: { _id: string; name: string };
  team?: Array<{ user: string; role: string }>;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Team Member Type (for frontend)
export interface TeamMember {
  _id: string;
  user: string | { _id: string; name: string; email: string; avatar?: string };
  role: string;
  permissions: string[];
  joinedAt: string;
  status: 'active' | 'inactive';
}

// Document Type (stored in uploads)
export interface Document {
  _id: string;
  project: string;
  filename: string;
  originalName: string;
  type: 'document' | 'image' | 'other';
  category: string;
  size: number;
  uploadedBy: { _id: string; name: string };
  storage: { url?: string };
  createdAt: string;
}

// Report Type
export interface Report {
  _id: string;
  project: string;
  type: 'budget' | 'progress' | 'contractor' | 'inventory' | 'weekly';
  name: string;
  data: Record<string, unknown>;
  generatedBy: { _id: string; name: string };
  generatedAt: string;
}

// Auth storage functions
export const authStorage = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  getUser: (): User | null => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  getCurrentProjectId: (): string | null => localStorage.getItem(CURRENT_PROJECT_KEY),

  setTokens: (tokens: AuthTokens): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },
  setUser: (user: User): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  setCurrentProject: (projectId: string): void => {
    localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
  },

  clear: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated: (): boolean => !!localStorage.getItem(ACCESS_TOKEN_KEY),
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = authStorage.getRefreshToken();

      if (!refreshToken) {
        authStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}${API_PREFIX}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        authStorage.setTokens({ accessToken, refreshToken: newRefreshToken });

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        authStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ===== AUTH API =====
export const authApi = {
  register: async (data: { email: string; password: string; name: string; phone?: string; role?: string }) => {
    const response = await api.post<ApiResponse<{ user: User } & AuthTokens>>('/auth/register', data);
    if (response.data.success && response.data.data) {
      const { user, accessToken, refreshToken } = response.data.data;
      authStorage.setTokens({ accessToken, refreshToken });
      authStorage.setUser(user);
    }
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post<ApiResponse<{ user: User } & AuthTokens>>('/auth/login', { email, password });
    if (response.data.success && response.data.data) {
      const { user, accessToken, refreshToken } = response.data.data;
      authStorage.setTokens({ accessToken, refreshToken });
      authStorage.setUser(user);
    }
    return response.data;
  },

  googleAuth: async (credential: string, clientId?: string) => {
    const response = await api.post<ApiResponse<{ user: User; isNewUser: boolean } & AuthTokens>>('/auth/google', { credential, clientId });
    if (response.data.success && response.data.data) {
      const { user, accessToken, refreshToken } = response.data.data;
      authStorage.setTokens({ accessToken, refreshToken });
      authStorage.setUser(user);
    }
    return response.data;
  },

  logout: async (logoutAll = false) => {
    const refreshToken = authStorage.getRefreshToken();
    try {
      await api.post('/auth/logout', { refreshToken, logoutAll });
    } finally {
      authStorage.clear();
    }
  },

  getMe: async () => {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    if (response.data.success && response.data.data) {
      authStorage.setUser(response.data.data.user);
    }
    return response.data;
  },

  updateMe: async (data: Partial<User>) => {
    const response = await api.patch<ApiResponse<{ user: User }>>('/auth/me', data);
    if (response.data.success && response.data.data) {
      authStorage.setUser(response.data.data.user);
    }
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post<ApiResponse>('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post<ApiResponse>('/auth/reset-password', { token, password });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/change-password', { currentPassword, newPassword });
    if (response.data.success && response.data.data) {
      authStorage.setTokens(response.data.data);
    }
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await api.post<ApiResponse>('/auth/verify-email', { token });
    return response.data;
  },
};

// ===== PROJECTS API =====
export const projectsApi = {
  getAll: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<{ projects: Project[]; pagination: PaginatedResponse<Project>['pagination'] }>>('/projects', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<{ project: Project }>>(`/projects/${id}`);
    return response.data;
  },

  create: async (data: Partial<Project>) => {
    const response = await api.post<ApiResponse<{ project: Project }>>('/projects', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Project>) => {
    const response = await api.patch<ApiResponse<{ project: Project }>>(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/projects/${id}`);
    return response.data;
  },

  getTeam: async (projectId: string) => {
    const response = await api.get<ApiResponse<{ team: TeamMember[] }>>(`/projects/${projectId}/team`);
    return response.data;
  },

  addTeamMember: async (projectId: string, data: { email: string; role: string }) => {
    const response = await api.post<ApiResponse<{ member: TeamMember }>>(`/projects/${projectId}/team`, data);
    return response.data;
  },

  removeTeamMember: async (projectId: string, userId: string) => {
    const response = await api.delete<ApiResponse>(`/projects/${projectId}/team/${userId}`);
    return response.data;
  },
};

// ===== BUDGET API =====
export const budgetApi = {
  getBills: async (projectId: string, params?: { status?: string; type?: string; category?: string; page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<{ bills: Bill[]; pagination: PaginatedResponse<Bill>['pagination'] }>>(`/budget/project/${projectId}`, { params });
    return response.data;
  },

  getSummary: async (projectId: string) => {
    const response = await api.get<ApiResponse<BudgetSummary>>(`/budget/project/${projectId}/summary`);
    return response.data;
  },

  getBillById: async (id: string) => {
    const response = await api.get<ApiResponse<{ bill: Bill }>>(`/budget/${id}`);
    return response.data;
  },

  createBill: async (data: Partial<Bill>) => {
    const response = await api.post<ApiResponse<{ bill: Bill }>>('/budget', data);
    return response.data;
  },

  updateBill: async (id: string, data: Partial<Bill>) => {
    const response = await api.patch<ApiResponse<{ bill: Bill }>>(`/budget/${id}`, data);
    return response.data;
  },

  deleteBill: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/budget/${id}`);
    return response.data;
  },

  addPayment: async (id: string, data: { amount: number; method?: string; reference?: string; notes?: string }) => {
    const response = await api.post<ApiResponse<{ bill: Bill }>>(`/budget/${id}/payment`, data);
    return response.data;
  },

  approveBill: async (id: string, comments?: string) => {
    const response = await api.post<ApiResponse<{ bill: Bill }>>(`/budget/${id}/approve`, { comments });
    return response.data;
  },

  rejectBill: async (id: string, comments: string) => {
    const response = await api.post<ApiResponse<{ bill: Bill }>>(`/budget/${id}/reject`, { comments });
    return response.data;
  },
};

// ===== INVENTORY API =====
export const inventoryApi = {
  getItems: async (projectId: string, params?: { category?: string; status?: string; search?: string; page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<{ items: InventoryItemAPI[]; pagination: PaginatedResponse<InventoryItemAPI>['pagination'] }>>(`/inventory/project/${projectId}`, { params });
    return response.data;
  },

  getSummary: async (projectId: string) => {
    const response = await api.get<ApiResponse<{
      overview: { totalItems: number; totalValue: number; lowStockCount: number; outOfStockCount: number };
      byCategory: Array<{ _id: string; count: number; value: number }>;
      lowStockItems: InventoryItemAPI[];
    }>>(`/inventory/project/${projectId}/summary`);
    return response.data;
  },

  getItemById: async (id: string) => {
    const response = await api.get<ApiResponse<{ item: InventoryItemAPI }>>(`/inventory/${id}`);
    return response.data;
  },

  createItem: async (data: Partial<InventoryItemAPI> & { project: string }) => {
    const response = await api.post<ApiResponse<{ item: InventoryItemAPI }>>('/inventory', data);
    return response.data;
  },

  updateItem: async (id: string, data: Partial<InventoryItemAPI>) => {
    const response = await api.patch<ApiResponse<{ item: InventoryItemAPI }>>(`/inventory/${id}`, data);
    return response.data;
  },

  deleteItem: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/inventory/${id}`);
    return response.data;
  },

  adjustStock: async (id: string, adjustment: number, reason?: string) => {
    const response = await api.post<ApiResponse<{ item: InventoryItemAPI }>>(`/inventory/${id}/adjust`, { adjustment, reason });
    return response.data;
  },

  bulkCreate: async (projectId: string, items: Array<Partial<InventoryItemAPI>>) => {
    const response = await api.post<ApiResponse<{ items: InventoryItemAPI[] }>>('/inventory/bulk', { projectId, items });
    return response.data;
  },
};

// ===== UPLOADS API =====
export const uploadsApi = {
  getUploads: async (projectId: string, params?: { type?: string; category?: string; stage?: string; page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<{ uploads: Upload[]; pagination: PaginatedResponse<Upload>['pagination'] }>>(`/uploads/project/${projectId}`, { params });
    return response.data;
  },

  getStats: async (projectId: string) => {
    const response = await api.get<ApiResponse<{ totalSize: number; totalCount: number; byType: Record<string, number> }>>(`/uploads/project/${projectId}/stats`);
    return response.data;
  },

  getUploadById: async (id: string) => {
    const response = await api.get<ApiResponse<{ upload: Upload }>>(`/uploads/${id}`);
    return response.data;
  },

  uploadFile: async (data: { project: string; stage?: string; file: string; filename: string; mimeType: string; category?: string; tags?: string[]; description?: string }) => {
    const response = await api.post<ApiResponse<{ upload: Upload }>>('/uploads/upload', data);
    return response.data;
  },

  createUploadRecord: async (data: Partial<Upload>) => {
    const response = await api.post<ApiResponse<{ upload: Upload }>>('/uploads', data);
    return response.data;
  },

  updateUpload: async (id: string, data: { category?: string; tags?: string[]; description?: string; isPublic?: boolean; isFavorite?: boolean }) => {
    const response = await api.patch<ApiResponse<{ upload: Upload }>>(`/uploads/${id}`, data);
    return response.data;
  },

  deleteUpload: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/uploads/${id}`);
    return response.data;
  },

  toggleFavorite: async (id: string) => {
    const response = await api.post<ApiResponse<{ isFavorite: boolean }>>(`/uploads/${id}/favorite`);
    return response.data;
  },

  addComment: async (id: string, content: string) => {
    const response = await api.post<ApiResponse<{ comments: Array<{ user: User; content: string; createdAt: string }> }>>(`/uploads/${id}/comment`, { content });
    return response.data;
  },

  analyzeImage: async (id: string) => {
    const response = await api.post<ApiResponse<{ analysis: Record<string, unknown> }>>(`/uploads/${id}/analyze`);
    return response.data;
  },
};

// ===== CHAT API =====
export const chatApi = {
  sendMessage: async (data: { message: string; projectId?: string; context?: string; history?: ChatMessage[] }) => {
    const response = await api.post<ApiResponse<ChatResponse>>('/chat', data);
    return response.data;
  },

  analyzeImage: async (data: { image: string; prompt?: string }) => {
    const response = await api.post<ApiResponse<{ response: string; mock?: boolean }>>('/chat/vision', data);
    return response.data;
  },

  getHistory: async (projectId: string) => {
    const response = await api.get<ApiResponse<{ history: ChatMessage[] }>>(`/chat/history/${projectId}`);
    return response.data;
  },

  clearHistory: async (projectId: string) => {
    const response = await api.delete<ApiResponse>(`/chat/history/${projectId}`);
    return response.data;
  },

  getSuggestions: async (projectId?: string, type?: string) => {
    const response = await api.post<ApiResponse<{ suggestions: Array<{ type: string; title: string; message: string }> }>>('/chat/suggestions', { projectId, type });
    return response.data;
  },
};

// ===== STAGES API =====
export const stagesApi = {
  getByProject: async (projectId: string) => {
    const response = await api.get<ApiResponse<{ stages: Array<{
      _id: string;
      name: string;
      description?: string;
      order: number;
      status: string;
      progress: number;
      startDate?: string;
      endDate?: string;
      tasks: Array<{ name: string; status: string; assignedTo?: string }>;
    }> }>>(`/stages/project/${projectId}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<{ stage: unknown }>>(`/stages/${id}`);
    return response.data;
  },

  create: async (data: { project: string; name: string; description?: string; order?: number }) => {
    const response = await api.post<ApiResponse<{ stage: unknown }>>('/stages', data);
    return response.data;
  },

  update: async (id: string, data: { name?: string; description?: string; status?: string; progress?: number }) => {
    const response = await api.patch<ApiResponse<{ stage: unknown }>>(`/stages/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/stages/${id}`);
    return response.data;
  },

  addTask: async (stageId: string, task: { name: string; description?: string; assignedTo?: string }) => {
    const response = await api.post<ApiResponse<{ stage: unknown }>>(`/stages/${stageId}/tasks`, task);
    return response.data;
  },

  updateTask: async (stageId: string, taskId: string, data: { name?: string; status?: string; description?: string }) => {
    const response = await api.patch<ApiResponse<{ stage: unknown }>>(`/stages/${stageId}/tasks/${taskId}`, data);
    return response.data;
  },
};

// ===== ML API =====
export const mlApi = {
  getWeather: async (location: string) => {
    const response = await api.get<ApiResponse<Array<{
      date: string;
      dayOfWeek: string;
      weather: { condition: string; temp: number; humidity: number; precipitation: number; windSpeed: number };
      workabilityScore: number;
      recommendedTasks: Array<{ task: string; suitabilityScore: number; reasoning: string }>;
      avoidTasks: string[];
      alerts: Array<{ type: string; severity: string; message: string; recommendation: string }>;
    }>>>(`/ml/weather/${encodeURIComponent(location)}`);
    return response.data;
  },

  analyzePhoto: async (data: { imageUrl?: string; imageBase64?: string }) => {
    const response = await api.post<ApiResponse<{
      phase: string;
      phaseConfidence: number;
      progressEstimate: number;
      safetyScore: number;
      qualityScore: number;
      issues: Array<{ type: string; severity: string; description: string }>;
      materials: Array<{ name: string; confidence: number }>;
    }>>('/ml/analyze-photo', data);
    return response.data;
  },

  getHealth: async () => {
    const response = await api.get<ApiResponse<{ services: { weather: { configured: boolean }; vision: { configured: boolean } } }>>('/ml/health');
    return response.data;
  },
};

// ===== PAYMENTS API =====
export const paymentsApi = {
  createRazorpayOrder: async (data: { amount: number; currency?: string; receipt?: string; notes?: Record<string, string>; planId?: string }) => {
    const response = await api.post<ApiResponse<{ order: { id: string; amount: number; currency: string }; keyId: string }>>(
      '/payments/razorpay/order',
      data
    );
    return response.data;
  },

  verifyRazorpayPayment: async (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
    const response = await api.post<ApiResponse<{ verified: boolean }>>('/payments/razorpay/verify', data);
    return response.data;
  },
};

// ===== TEAM API (using projects endpoints) =====
export const teamApi = {
  getTeam: async (projectId: string) => {
    return projectsApi.getTeam(projectId);
  },

  addMember: async (projectId: string, data: { email: string; role: string }) => {
    return projectsApi.addTeamMember(projectId, data);
  },

  removeMember: async (projectId: string, userId: string) => {
    return projectsApi.removeTeamMember(projectId, userId);
  },
};

// ===== DOCUMENTS API (using uploads with document filter) =====
export const documentsApi = {
  getDocuments: async (projectId: string, params?: { category?: string; page?: number; limit?: number }) => {
    return uploadsApi.getUploads(projectId, { ...params, type: 'document' });
  },

  uploadDocument: async (data: { project: string; file: string; filename: string; mimeType: string; category?: string; description?: string }) => {
    return uploadsApi.uploadFile({ ...data, category: data.category || 'document' });
  },

  deleteDocument: async (id: string) => {
    return uploadsApi.deleteUpload(id);
  },
};

// ===== REPORTS API =====
export const reportsApi = {
  generateBudgetReport: async (projectId: string) => {
    const summary = await budgetApi.getSummary(projectId);
    return {
      success: true,
      data: {
        report: {
          _id: `rep-${Date.now()}`,
          project: projectId,
          type: 'budget',
          name: 'Budget Summary Report',
          data: summary.data,
          generatedAt: new Date().toISOString(),
        },
      },
    };
  },

  generateInventoryReport: async (projectId: string) => {
    const summary = await inventoryApi.getSummary(projectId);
    return {
      success: true,
      data: {
        report: {
          _id: `rep-${Date.now()}`,
          project: projectId,
          type: 'inventory',
          name: 'Inventory Status Report',
          data: summary.data,
          generatedAt: new Date().toISOString(),
        },
      },
    };
  },

  generateProgressReport: async (projectId: string) => {
    const [projectData, stagesData] = await Promise.all([
      projectsApi.getById(projectId),
      stagesApi.getByProject(projectId),
    ]);
    return {
      success: true,
      data: {
        report: {
          _id: `rep-${Date.now()}`,
          project: projectId,
          type: 'progress',
          name: 'Progress Report',
          data: {
            project: projectData.data?.project,
            stages: stagesData.data?.stages,
          },
          generatedAt: new Date().toISOString(),
        },
      },
    };
  },
};

// Health check
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch {
    return null;
  }
};

// Export the axios instance for direct use
export { api };

export default {
  auth: authApi,
  projects: projectsApi,
  budget: budgetApi,
  inventory: inventoryApi,
  uploads: uploadsApi,
  chat: chatApi,
  stages: stagesApi,
  ml: mlApi,
  payments: paymentsApi,
  team: teamApi,
  documents: documentsApi,
  reports: reportsApi,
  checkHealth,
  authStorage,
};
