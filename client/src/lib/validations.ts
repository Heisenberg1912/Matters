import { z } from 'zod';

// Expense validation schema
export const expenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  amount: z.number().positive('Amount must be positive'),
  vendor: z.string().min(1, 'Vendor is required'),
  date: z.string()
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

// Inventory item validation schema
export const inventoryItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().int().positive('Quantity must be a positive number'),
  unit: z.string().min(1, 'Unit is required'),
  cost: z.number().positive('Cost must be positive'),
  location: z.string().min(1, 'Location is required'),
  minStock: z.number().int().nonnegative('Min stock must be non-negative')
});

export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

// Task validation schema
export const taskSchema = z.object({
  phaseId: z.string().min(1, 'Phase is required'),
  name: z.string().min(3, 'Task name must be at least 3 characters'),
  startDate: z.string(),
  endDate: z.string(),
  assignedTo: z.string().optional(),
  description: z.string().optional()
});

export type TaskFormData = z.infer<typeof taskSchema>;

// Contractor validation schema
export const contractorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.string().min(1, 'Role is required'),
  company: z.string().min(1, 'Company is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email('Valid email required'),
  location: z.string().min(1, 'Location is required'),
  specialties: z.array(z.string()).min(1, 'At least one specialty required'),
  cost: z.number().positive('Cost must be positive')
});

export type ContractorFormData = z.infer<typeof contractorSchema>;

// Team member validation schema
export const teamMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.string().min(1, 'Role is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone number required'),
  department: z.string().min(1, 'Department is required'),
  joinDate: z.string()
});

export type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

// Budget category validation schema
export const budgetCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  allocated: z.number().positive('Allocated amount must be positive'),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Valid hex color required')
});

export type BudgetCategoryFormData = z.infer<typeof budgetCategorySchema>;
