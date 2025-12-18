// Core Types
export type ProjectMode = "construction" | "refurbish";

export type TaskStatus = "pending" | "in_progress" | "completed";
export type ContractorStatus = "available" | "scheduled" | "busy";
export type DocumentType = "pdf" | "image" | "spreadsheet" | "cad" | "other";
export type ReportType = "budget" | "progress" | "contractor" | "inventory" | "weekly";

// Project
export interface Project {
  id: string;
  name: string;
  category: string;
  mode: ProjectMode;
  startDate: string;
  targetEndDate: string;
  progress: number;
}

// Budget
export interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  color: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  vendor: string;
}

export interface SpendingHistoryEntry {
  date: string;
  spent: number;
  allocated: number;
  category?: string;
}

// Inventory
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  cost: number;
  location: string;
  lastUpdated: string;
  lowStock?: boolean;
}

// Schedule
export interface Phase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  tasks: Task[];
}

export interface Task {
  id: string;
  phaseId: string;
  name: string;
  status: TaskStatus;
  startDate: string;
  endDate: string;
  assignedTo?: string;
  description?: string;
}

export interface Milestone {
  id: string;
  name: string;
  date: string;
  completed: boolean;
}

// Contractor
export interface Contractor {
  id: string;
  name: string;
  role: string;
  company: string;
  phone: string;
  email: string;
  location: string;
  specialties: string[];
  cost: number;
  availability: ContractorStatus;
  performanceMetrics?: {
    quality: number;
    timeliness: number;
    communication: number;
    costEffectiveness: number;
  };
}

// Team
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  department: string;
  joinDate: string;
  status: "active" | "inactive";
  avatar?: string;
}

// Documents
export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  folder: string;
  size: number;
  uploadDate: string;
  description?: string;
  url?: string;
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  documentCount: number;
}

// Reports
export interface Report {
  id: string;
  name: string;
  type: ReportType;
  generatedDate: string;
  data: any;
  description?: string;
}
