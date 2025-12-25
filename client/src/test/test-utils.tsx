import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";

// Mock user data
export const mockUser = {
  _id: "user123",
  email: "test@example.com",
  name: "Test User",
  role: "user" as const,
  isVerified: true,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockContractor = {
  ...mockUser,
  _id: "contractor123",
  email: "contractor@example.com",
  name: "Test Contractor",
  role: "contractor" as const,
  contractor: {
    isVerified: true,
    availabilityStatus: "available",
    completedProjects: 5,
    activeProjects: 2,
    totalEarnings: 50000,
  },
  specializations: ["Plumbing", "Electrical"],
};

export const mockAdmin = {
  ...mockUser,
  _id: "admin123",
  email: "admin@example.com",
  name: "Test Admin",
  role: "admin" as const,
};

// Mock AuthContext values
export const createMockAuthContext = (overrides = {}) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isCustomer: false,
  isContractor: false,
  isAdmin: false,
  isSuperAdmin: false,
  hasRole: vi.fn(() => false),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
  refreshUser: vi.fn(),
  clearError: vi.fn(),
  ...overrides,
});

// Wrapper with providers
interface WrapperProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: WrapperProps) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
