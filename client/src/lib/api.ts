/**
 * Comprehensive API Service Layer for MATTERS
 * Handles all backend communication with authentication and error handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authSession } from './auth-session';

// Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000');
const API_PREFIX = import.meta.env.VITE_API_BASE_URL || '/api';

// Storage keys for auth tokens
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

export interface ContractorProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: { name?: string; address?: string; license?: string };
  specializations?: string[];
  rating?: { average: number; count: number };
  createdAt?: string;
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
  priority?: string;
  mode?: 'construction' | 'refurbish';
  owner: string | { _id: string; name: string; email: string };
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    coordinates?: { lat?: number; lng?: number };
  };
  budget: { estimated: number; spent: number; currency?: string };
  timeline?: { startDate?: string; expectedEndDate?: string; actualEndDate?: string };
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

export interface SupportTicket {
  _id: string;
  ticketNumber: string;
  project: string;
  user: string;
  subject: string;
  category: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  priority?: 'low' | 'medium' | 'high';
  attachments?: Array<{ _id: string; filename?: string; storage?: { url?: string } }>;
  createdAt: string;
  resolvedAt?: string;
}

// Auth storage functions
export const authStorage = {
  getAccessToken: (): string | null => authSession.getCachedToken(),
  getRefreshToken: (): string | null => null,
  getUser: (): User | null => authSession.getUser(),
  getCurrentProjectId: (): string | null => localStorage.getItem(CURRENT_PROJECT_KEY),

  setTokens: (tokens: AuthTokens): void => {
    authSession.setToken(tokens.accessToken);
  },
  setUser: (user: User): void => {
    authSession.setUser(user);
  },
  setCurrentProject: (projectId: string): void => {
    localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
  },
  clearCurrentProject: (): void => {
    localStorage.removeItem(CURRENT_PROJECT_KEY);
  },

  clear: (): void => {
    authSession.clear();
    localStorage.removeItem(CURRENT_PROJECT_KEY);
  },

  isAuthenticated: (): boolean => authSession.isAuthenticated(),
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
  async (config: InternalAxiosRequestConfig) => {
    const token = await authSession.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      authStorage.clear();
    }

    return Promise.reject(error);
  }
);

// ===== AUTH API =====
export interface LoginCredential {
  email: string;
  password: string;
  role: string;
  name: string;
}

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/session/login', { email, password });
    if (response.data.success && response.data.data) {
      authStorage.setTokens({ accessToken: response.data.data.token, refreshToken: '' });
      authStorage.setUser(response.data.data.user);
    }
    return response.data;
  },

  register: async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: 'user' | 'contractor';
    company?: { name?: string };
    specializations?: string[];
  }) => {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/session/register', data);
    if (response.data.success && response.data.data) {
      authStorage.setTokens({ accessToken: response.data.data.token, refreshToken: '' });
      authStorage.setUser(response.data.data.user);
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post<ApiResponse>('/session/logout');
    } catch {
      // Ignore errors on logout
    }
    authStorage.clear();
  },

  getMe: async () => {
    const response = await api.get<ApiResponse<{ user: User }>>('/session');
    if (response.data.success && response.data.data) {
      authStorage.setUser(response.data.data.user);
    }
    return response.data;
  },

  updateMe: async (data: Partial<User>) => {
    const response = await api.patch<ApiResponse<{ user: User }>>('/session', data);
    if (response.data.success && response.data.data) {
      authStorage.setUser(response.data.data.user);
    }
    return response.data;
  },

  getCredentials: async () => {
    const response = await api.get<ApiResponse<{ credentials: LoginCredential[] }>>('/session/credentials');
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
    const response = await api.get<ApiResponse<{ team: TeamMember[]; invites?: Array<{ email: string; role: string; expiresAt?: string }> }>>(`/projects/${projectId}/team`);
    return response.data;
  },

  addTeamMember: async (projectId: string, data: { email?: string; userId?: string; role: string }) => {
    const response = await api.post<ApiResponse<{ member?: TeamMember; invite?: { email: string; role: string; expiresAt?: string } }>>(
      `/projects/${projectId}/team`,
      data
    );
    return response.data;
  },

  removeTeamMember: async (projectId: string, userId: string) => {
    const response = await api.delete<ApiResponse>(`/projects/${projectId}/team/${userId}`);
    return response.data;
  },

  getStats: async (projectId: string) => {
    const response = await api.get<ApiResponse<{
      stages: { total: number; completed: number; inProgress: number; pending: number };
      progress: number;
      budget: { estimated: number; spent: number; utilization: number };
      timeline: { startDate?: string; expectedEndDate?: string; daysRemaining?: number | null };
      metrics: { totalUploads: number; totalBills: number; completedStages: number };
    }>>(`/projects/${projectId}/stats`);
    return response.data;
  },

  acceptInvite: async (token: string) => {
    const response = await api.post<ApiResponse<{ projectId: string }>>('/projects/invites/accept', { token });
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

  uploadFiles: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await api.post<ApiResponse<{ files: Array<{ filename: string; originalname: string; mimetype: string; size: number; url: string }> }>>('/uploads/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
      expectedEndDate?: string;
      actualEndDate?: string;
      tasks: Array<{
        _id: string;
        title: string;
        status: 'pending' | 'in_progress' | 'completed';
        assignee?: { _id?: string; name?: string; email?: string; avatar?: string } | string;
        dueDate?: string;
        description?: string;
      }>;
    }> }>>(`/stages/project/${projectId}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<{ stage: unknown }>>(`/stages/${id}`);
    return response.data;
  },

  create: async (data: { project: string; name: string; description?: string; order?: number; startDate?: string; expectedEndDate?: string }) => {
    const response = await api.post<ApiResponse<{ stage: unknown }>>('/stages', data);
    return response.data;
  },

  update: async (id: string, data: { name?: string; description?: string; status?: string; progress?: number; startDate?: string; expectedEndDate?: string }) => {
    const response = await api.patch<ApiResponse<{ stage: unknown }>>(`/stages/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/stages/${id}`);
    return response.data;
  },

  addTask: async (stageId: string, task: { name: string; description?: string; assignedTo?: string; dueDate?: string; priority?: string }) => {
    const payload = {
      title: task.name,
      description: task.description,
      assignee: task.assignedTo,
      dueDate: task.dueDate,
      priority: task.priority,
    };
    const response = await api.post<ApiResponse<{ stage: unknown }>>(`/stages/${stageId}/tasks`, payload);
    return response.data;
  },

  updateTask: async (stageId: string, taskId: string, data: { name?: string; status?: string; description?: string; assignedTo?: string; dueDate?: string; priority?: string }) => {
    const payload = {
      title: data.name,
      status: data.status,
      description: data.description,
      assignee: data.assignedTo,
      dueDate: data.dueDate,
      priority: data.priority,
    };
    const response = await api.patch<ApiResponse<{ stage: unknown }>>(`/stages/${stageId}/tasks/${taskId}`, payload);
    return response.data;
  },

  deleteTask: async (stageId: string, taskId: string) => {
    const response = await api.delete<ApiResponse>(`/stages/${stageId}/tasks/${taskId}`);
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

// ===== SUPPORT API =====
export const supportApi = {
  getTickets: async (projectId: string) => {
    const response = await api.get<ApiResponse<{ tickets: SupportTicket[] }>>(`/support/project/${projectId}`);
    return response.data;
  },

  createTicket: async (data: { project: string; subject: string; category: string; message: string; attachments?: string[]; priority?: string }) => {
    const response = await api.post<ApiResponse<{ ticket: SupportTicket }>>('/support', data);
    return response.data;
  },
};

// ===== CONTRACTORS API =====
export const contractorsApi = {
  getAll: async (params?: { search?: string; specialty?: string; page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<{ contractors: ContractorProfile[]; pagination: PaginatedResponse<ContractorProfile>['pagination'] }>>(
      '/contractors',
      { params }
    );
    return response.data;
  },
};

// ===== SUBSCRIPTIONS API =====
export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  yearlyPrice: number;
  currency: string;
  limits: {
    projects: number;
    storage: number;
    teamMembers: number;
    contractors: number;
  };
  features: string[];
  isPopular?: boolean;
}

export interface SubscriptionData {
  subscription: {
    plan: string;
    status: string;
    startDate?: string;
    endDate?: string;
  };
  currentPlan: Plan | null;
  usage: {
    projects: { used: number; limit: number; unlimited: boolean };
    storage: { used: number; usedFormatted: string; limit: number; limitFormatted: string; unlimited: boolean };
    teamMembers: { used: number; limit: number; unlimited: boolean };
    contractors: { used: number; limit: number; unlimited: boolean };
  };
}

export const subscriptionsApi = {
  getPlans: async (currency?: string) => {
    const response = await api.get<ApiResponse<Plan[]>>('/subscriptions/plans', {
      params: { currency },
    });
    return response.data;
  },

  getCurrent: async (currency?: string) => {
    const response = await api.get<ApiResponse<SubscriptionData>>('/subscriptions/current', {
      params: { currency },
    });
    return response.data;
  },

  getUsage: async () => {
    const response = await api.get<ApiResponse<{
      plan: { id: string; name: string; limits: Plan['limits'] };
      projects: { total: number; byStatus: Record<string, number> };
      storage: { total: number; totalFormatted: string };
      team: { total: number; byProject: Array<{ projectId: string; projectName: string; memberCount: number }> };
    }>>('/subscriptions/usage');
    return response.data;
  },
};

// ===== ADMIN API =====
export interface AdminStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  };
  projects: {
    total: number;
    active: number;
  };
  subscriptions: {
    byPlan: Record<string, number>;
    totalPaid: number;
  };
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    subscription?: { plan: string };
    createdAt: string;
  }>;
}

export const adminApi = {
  getStats: async () => {
    const response = await api.get<ApiResponse<AdminStats>>('/admin/stats');
    return response.data;
  },

  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    plan?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const response = await api.get<ApiResponse<{
      users: User[];
      pagination: PaginatedResponse<User>['pagination'];
    }>>('/admin/users', { params });
    return response.data;
  },

  getUser: async (id: string) => {
    const response = await api.get<ApiResponse<{
      user: User;
      projects: Project[];
      plan: Plan | null;
    }>>(`/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, data: {
    role?: string;
    isActive?: boolean;
    subscription?: {
      plan?: string;
      status?: string;
      endDate?: string;
      notes?: string;
    };
  }) => {
    const response = await api.patch<ApiResponse<User>>(`/admin/users/${id}`, data);
    return response.data;
  },

  deactivateUser: async (id: string) => {
    const response = await api.delete<ApiResponse<User>>(`/admin/users/${id}`);
    return response.data;
  },

  getProjects: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const response = await api.get<ApiResponse<{
      projects: Project[];
      pagination: PaginatedResponse<Project>['pagination'];
    }>>('/admin/projects', { params });
    return response.data;
  },

  getSubscriptionAnalytics: async () => {
    const response = await api.get<ApiResponse<{
      distribution: {
        byPlan: Record<string, number>;
        byStatus: Record<string, number>;
      };
      revenue: {
        mrrINR: number;
        mrrUSD: number;
        arrINR: number;
        arrUSD: number;
      };
      recentUpgrades: Array<{
        _id: string;
        name: string;
        email: string;
        subscription: { plan: string; startDate: string };
      }>;
    }>>('/admin/subscriptions');
    return response.data;
  },
};

// ===== PUBLIC/PORTAL API =====
export interface ShareSettings {
  enabled: boolean;
  hasShareLink: boolean;
  token?: string;
  shareUrl?: string;
  expiresAt?: string;
  allowedSections?: string[];
  isPasswordProtected?: boolean;
  viewCount?: number;
}

export interface PublicProjectData {
  name: string;
  isPasswordProtected: boolean;
  allowedSections: string[];
  overview?: {
    description?: string;
    status: string;
    type: string;
    mode: string;
    location?: string;
    owner?: string;
    createdAt: string;
  };
  progress?: {
    percentage: number;
    completedStages: number;
    totalStages: number;
    stages?: Array<{ name: string; type: string; status: string; progress: number }>;
  };
  timeline?: {
    startDate?: string;
    expectedEndDate?: string;
    daysRemaining?: number;
  };
  photos?: Array<{
    _id: string;
    name: string;
    url?: string;
    createdAt: string;
  }>;
  budgetSummary?: {
    estimated: number;
    spent: number;
    currency: string;
    utilization: number;
  };
}

export const publicApi = {
  getShareSettings: async (projectId: string) => {
    const response = await api.get<ApiResponse<ShareSettings>>(`/projects/${projectId}/share`);
    return response.data;
  },

  createShareLink: async (projectId: string, data?: {
    expiresIn?: number;
    allowedSections?: string[];
    password?: string;
  }) => {
    const response = await api.post<ApiResponse<{
      token: string;
      shareUrl: string;
      expiresAt?: string;
      allowedSections: string[];
      isPasswordProtected: boolean;
    }>>(`/projects/${projectId}/share`, data);
    return response.data;
  },

  updateShareSettings: async (projectId: string, data: {
    enabled?: boolean;
    expiresIn?: number;
    allowedSections?: string[];
    password?: string;
    removePassword?: boolean;
  }) => {
    const response = await api.patch<ApiResponse<ShareSettings>>(`/projects/${projectId}/share`, data);
    return response.data;
  },

  revokeShareLink: async (projectId: string) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/projects/${projectId}/share`);
    return response.data;
  },

  verifyPortalPassword: async (token: string, password: string) => {
    const response = await api.post<ApiResponse<{ verified: boolean }>>(`/portal/${token}/verify`, { password });
    return response.data;
  },

  getPublicProject: async (token: string) => {
    const response = await api.get<ApiResponse<PublicProjectData>>(`/portal/${token}`);
    return response.data;
  },
};

// ============ Jobs API ============

export interface Job {
  _id: string;
  project: { _id: string; name: string; type?: string; location?: { city?: string } };
  postedBy: { _id: string; name: string; avatar?: string };
  title: string;
  description?: string;
  budget?: {
    min?: number;
    max?: number;
    currency?: string;
    type?: string;
  };
  requiredSpecializations?: string[];
  location?: { address?: string; city?: string; state?: string };
  timeline?: { startDate?: string; endDate?: string; duration?: string };
  workType?: string;
  status: string;
  bids?: Bid[];
  assignedContractor?: { _id: string; name: string; avatar?: string; rating?: { average: number } };
  viewCount?: number;
  bidCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  _id: string;
  contractor: { _id: string; name: string; avatar?: string; rating?: { average: number }; company?: { name: string } };
  amount: number;
  proposal: string;
  estimatedDuration?: string;
  status: string;
  submittedAt: string;
  respondedAt?: string;
  responseNote?: string;
}

export const jobsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    city?: string;
    specialization?: string;
    budgetMin?: number;
    budgetMax?: number;
    workType?: string;
    search?: string;
  }) => {
    const response = await api.get<ApiResponse<{ jobs: Job[]; pagination: { page: number; limit: number; total: number; pages: number } }>>('/jobs', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Job>>(`/jobs/${id}`);
    return response.data;
  },

  getMyPostings: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<{ jobs: Job[]; pagination: { page: number; limit: number; total: number; pages: number } }>>('/jobs/my-postings', { params });
    return response.data;
  },

  getMyBids: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<{ bids: { job: Job; bid: Bid }[]; pagination: { page: number; limit: number; total: number; pages: number } }>>('/jobs/my-bids', { params });
    return response.data;
  },

  getAssigned: async () => {
    const response = await api.get<ApiResponse<Job[]>>('/jobs/assigned');
    return response.data;
  },

  create: async (data: {
    projectId: string;
    title: string;
    description?: string;
    budget?: { min?: number; max?: number; type?: string };
    requiredSpecializations?: string[];
    location?: { address?: string; city?: string; state?: string };
    timeline?: { startDate?: string; endDate?: string; duration?: string };
    workType?: string;
    requirements?: { item: string; description?: string }[];
  }) => {
    const response = await api.post<ApiResponse<Job>>('/jobs', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Job>) => {
    const response = await api.patch<ApiResponse<Job>>(`/jobs/${id}`, data);
    return response.data;
  },

  cancel: async (id: string, reason?: string) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/jobs/${id}`, { data: { reason } });
    return response.data;
  },

  submitBid: async (jobId: string, data: { amount: number; proposal: string; estimatedDuration?: string }) => {
    const response = await api.post<ApiResponse<{ jobId: string; bidCount: number }>>(`/jobs/${jobId}/bid`, data);
    return response.data;
  },

  updateBid: async (jobId: string, bidId: string, data: { amount?: number; proposal?: string; estimatedDuration?: string }) => {
    const response = await api.patch<ApiResponse<Bid>>(`/jobs/${jobId}/bid/${bidId}`, data);
    return response.data;
  },

  withdrawBid: async (jobId: string, bidId: string) => {
    const response = await api.post<ApiResponse<{ message: string }>>(`/jobs/${jobId}/bid/${bidId}/withdraw`);
    return response.data;
  },

  acceptBid: async (jobId: string, bidId: string, note?: string) => {
    const response = await api.post<ApiResponse<{ job: Job }>>(`/jobs/${jobId}/bid/${bidId}/accept`, { note });
    return response.data;
  },

  rejectBid: async (jobId: string, bidId: string, note?: string) => {
    const response = await api.post<ApiResponse<{ message: string }>>(`/jobs/${jobId}/bid/${bidId}/reject`, { note });
    return response.data;
  },

  getBids: async (jobId: string) => {
    const response = await api.get<ApiResponse<{ jobId: string; jobTitle: string; jobStatus: string; bids: Bid[]; summary: { total: number; pending: number; accepted: number; rejected: number } }>>(`/jobs/${jobId}/bids`);
    return response.data;
  },

  startJob: async (jobId: string) => {
    const response = await api.post<ApiResponse<{ status: string }>>(`/jobs/${jobId}/start`);
    return response.data;
  },

  completeJob: async (jobId: string) => {
    const response = await api.post<ApiResponse<{ status: string }>>(`/jobs/${jobId}/complete`);
    return response.data;
  },
};

// ============ Progress Updates API ============

export interface ProgressUpdate {
  _id: string;
  project: { _id: string; name: string; type?: string };
  stage?: { _id: string; name: string; type?: string };
  job?: string;
  contractor: { _id: string; name: string; avatar?: string; company?: { name: string } };
  type: string;
  title?: string;
  description: string;
  photoUrls?: { url: string; caption?: string }[];
  workDone?: { task: string; status: string; notes?: string }[];
  materialsUsed?: { name: string; quantity: number; unit?: string; cost?: number }[];
  issues?: { description: string; severity: string; resolved: boolean }[];
  weather?: { condition?: string; temperature?: number; impact?: string };
  workersOnSite?: number;
  hoursWorked?: number;
  progressPercentage?: number;
  nextSteps?: string;
  customerAcknowledged?: boolean;
  comments?: { user: { _id: string; name: string }; text: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ProgressSummary {
  totalUpdates: number;
  totalHoursWorked: number;
  avgWorkersOnSite: number;
  totalIssues: number;
  unresolvedIssues: number;
  lastUpdate: string | null;
}

export const progressApi = {
  getByProject: async (projectId: string, params?: { type?: string; limit?: number; page?: number }) => {
    const response = await api.get<ApiResponse<{ updates: ProgressUpdate[]; summary: ProgressSummary; pagination: { page: number; limit: number; total: number; pages: number } }>>(`/progress/project/${projectId}`, { params });
    return response.data;
  },

  getMyUpdates: async (params?: { projectId?: string; limit?: number; page?: number }) => {
    const response = await api.get<ApiResponse<{ updates: ProgressUpdate[]; pagination: { page: number; limit: number; total: number; pages: number } }>>('/progress/my-updates', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<ProgressUpdate>>(`/progress/${id}`);
    return response.data;
  },

  create: async (data: {
    projectId: string;
    stageId?: string;
    jobId?: string;
    type?: string;
    title?: string;
    description: string;
    photoUrls?: { url: string; caption?: string }[];
    workDone?: { task: string; status: string; notes?: string }[];
    materialsUsed?: { name: string; quantity: number; unit?: string; cost?: number }[];
    issues?: { description: string; severity: string }[];
    weather?: { condition?: string; temperature?: number; impact?: string };
    workersOnSite?: number;
    hoursWorked?: number;
    progressPercentage?: number;
    nextSteps?: string;
    customerVisible?: boolean;
  }) => {
    const response = await api.post<ApiResponse<ProgressUpdate>>('/progress', data);
    return response.data;
  },

  update: async (id: string, data: Partial<ProgressUpdate>) => {
    const response = await api.patch<ApiResponse<ProgressUpdate>>(`/progress/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/progress/${id}`);
    return response.data;
  },

  acknowledge: async (id: string) => {
    const response = await api.post<ApiResponse<{ message: string }>>(`/progress/${id}/acknowledge`);
    return response.data;
  },

  addComment: async (id: string, text: string) => {
    const response = await api.post<ApiResponse<{ user: { _id: string; name: string }; text: string; createdAt: string }>>(`/progress/${id}/comment`, { text });
    return response.data;
  },

  resolveIssue: async (id: string, issueIndex: number, resolution: string) => {
    const response = await api.post<ApiResponse<{ message: string }>>(`/progress/${id}/issue/${issueIndex}/resolve`, { resolution });
    return response.data;
  },
};

// ============ Contractor Dashboard API ============

export interface ContractorDashboardData {
  profile: {
    name: string;
    avatar?: string;
    company?: { name?: string };
    specializations?: string[];
    rating?: { average: number; count: number };
    isVerified: boolean;
    availabilityStatus: string;
    yearsExperience?: number;
  };
  stats: {
    openJobs: number;
    pendingBids: number;
    activeJobs: number;
    completedJobs: number;
    totalEarnings: number;
    monthlyEarnings: number;
  };
  recentProjects: Array<{
    _id: string;
    name: string;
    status: string;
    budget?: { estimated: number; spent: number };
    progress?: { percentage: number };
  }>;
  recentUpdates: Array<{
    _id: string;
    title?: string;
    type: string;
    createdAt: string;
    project: { _id: string; name: string };
  }>;
}

export interface ContractorEarnings {
  year: number;
  totalEarnings: number;
  allTimeEarnings: number;
  monthlyBreakdown: Array<{ month: string; amount: number }>;
  recentPayments: Array<{
    jobId: string;
    jobTitle: string;
    project: { _id: string; name: string };
    customer: { _id: string; name: string };
    amount: number;
    completedAt: string;
  }>;
  jobsCompleted: number;
}

export const contractorDashboardApi = {
  getDashboard: async () => {
    const response = await api.get<ApiResponse<ContractorDashboardData>>('/contractor/dashboard');
    return response.data;
  },

  getProjects: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<{ projects: Array<{ _id: string; name: string; status: string; owner: { name: string; email: string } }>; pagination: { page: number; limit: number; total: number; pages: number } }>>('/contractor/projects', { params });
    return response.data;
  },

  getEarnings: async (year?: number) => {
    const response = await api.get<ApiResponse<ContractorEarnings>>('/contractor/earnings', { params: { year } });
    return response.data;
  },

  getSchedule: async () => {
    const response = await api.get<ApiResponse<{
      items: Array<{
        type: string;
        id: string;
        title: string;
        startDate?: string;
        endDate?: string;
        status: string;
      }>;
      activeJobsCount: number;
      activeProjectsCount: number;
    }>>('/contractor/schedule');
    return response.data;
  },

  updateAvailability: async (status: 'available' | 'busy' | 'on_leave') => {
    const response = await api.patch<ApiResponse<{ availabilityStatus: string }>>('/contractor/availability', { status });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get<ApiResponse<User>>('/contractor/profile');
    return response.data;
  },

  updateProfile: async (data: {
    name?: string;
    phone?: string;
    company?: { name?: string; address?: string; license?: string; gstin?: string; website?: string };
    specializations?: string[];
    bio?: string;
    yearsExperience?: number;
    hourlyRate?: number;
    dailyRate?: number;
    serviceAreas?: { city: string; state: string }[];
    portfolioImages?: string[];
  }) => {
    const response = await api.patch<ApiResponse<User>>('/contractor/profile', data);
    return response.data;
  },

  getReviews: async () => {
    const response = await api.get<ApiResponse<{ rating: { average: number; count: number }; reviews: unknown[] }>>('/contractor/reviews');
    return response.data;
  },

  uploadDocument: async (data: { type: string; name: string; url: string }) => {
    const response = await api.post<ApiResponse<unknown>>('/contractor/documents', data);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<ApiResponse<{
      bids: { total: number; accepted: number; rejected: number; acceptanceRate: number };
      jobs: { total: number; completed: number; inProgress: number; completionRate: number };
      projects: number;
      progressUpdates: number;
    }>>('/contractor/stats');
    return response.data;
  },
};

// ============ Enhanced Admin API ============

export const adminDashboardApi = {
  getDashboard: async () => {
    const response = await api.get<ApiResponse<{
      overview: {
        users: { total: number; newThisMonth: number };
        projects: { total: number; active: number };
        jobs: { total: number; open: number };
        tickets: { pending: number };
        contractors: { total: number; verified: number };
      };
      revenue: { totalBilled: number; totalPaid: number; count: number };
      recentActivity: {
        users: Array<{ _id: string; name: string; email: string; role: string; createdAt: string }>;
        projects: Array<{ _id: string; name: string; status: string; owner: { name: string }; createdAt: string }>;
        tickets: Array<{ _id: string; ticketNumber: string; subject: string; status: string; priority: string; user: { name: string }; createdAt: string }>;
      };
    }>>('/admin/dashboard');
    return response.data;
  },

  getContractors: async (params?: { page?: number; limit?: number; verified?: string; search?: string }) => {
    const response = await api.get<ApiResponse<{ contractors: User[]; pagination: { page: number; limit: number; total: number; pages: number } }>>('/admin/contractors', { params });
    return response.data;
  },

  verifyContractor: async (id: string, verified: boolean, notes?: string) => {
    const response = await api.patch<ApiResponse<{ id: string; isVerified: boolean; verifiedAt: string }>>(`/admin/contractors/${id}/verify`, { verified, notes });
    return response.data;
  },

  getTickets: async (params?: { page?: number; limit?: number; status?: string; priority?: string; search?: string }) => {
    const response = await api.get<ApiResponse<{ tickets: Array<{ _id: string; ticketNumber: string; subject: string; message: string; status: string; priority: string; user: { name: string; email: string }; project: { name: string }; createdAt: string }>; pagination: { page: number; limit: number; total: number; pages: number } }>>('/admin/tickets', { params });
    return response.data;
  },

  getTicket: async (id: string) => {
    const response = await api.get<ApiResponse<{ _id: string; ticketNumber: string; subject: string; message: string; status: string; priority: string; user: { name: string; email: string; avatar?: string; phone?: string }; project: { name: string; status: string }; createdAt: string; resolvedAt?: string }>>(`/admin/tickets/${id}`);
    return response.data;
  },

  updateTicket: async (id: string, data: { status?: string; priority?: string }) => {
    const response = await api.patch<ApiResponse<unknown>>(`/admin/tickets/${id}`, data);
    return response.data;
  },

  getAnalytics: async (period?: number) => {
    const response = await api.get<ApiResponse<{
      userGrowth: Array<{ _id: string; count: number }>;
      projectsByStatus: Record<string, number>;
      projectsByType: Record<string, number>;
      jobsByStatus: Record<string, number>;
      revenueByMonth: Array<{ _id: string; totalBilled: number; totalPaid: number; count: number }>;
      usersByRole: Record<string, number>;
      topCities: Array<{ _id: string; count: number }>;
    }>>('/admin/analytics', { params: { period } });
    return response.data;
  },

  getJobs: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const response = await api.get<ApiResponse<{ jobs: Job[]; pagination: { page: number; limit: number; total: number; pages: number } }>>('/admin/jobs', { params });
    return response.data;
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
  contractors: contractorsApi,
  support: supportApi,
  subscriptions: subscriptionsApi,
  admin: adminApi,
  public: publicApi,
  jobs: jobsApi,
  progress: progressApi,
  contractorDashboard: contractorDashboardApi,
  adminDashboard: adminDashboardApi,
  checkHealth,
  authStorage,
};
