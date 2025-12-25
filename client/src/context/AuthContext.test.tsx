import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { authApi } from "../lib/api";
import { authSession } from "../lib/auth-session";
import React from "react";

// Mock dependencies
vi.mock("../lib/api", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
  },
}));

vi.mock("../lib/auth-session", () => ({
  authSession: {
    getUser: vi.fn(() => null),
    setUser: vi.fn(),
    getCachedToken: vi.fn(() => null),
    setToken: vi.fn(),
    isAuthenticated: vi.fn(() => false),
    setAuthenticated: vi.fn(),
    clear: vi.fn(),
  },
}));

// Wrapper component
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("useAuth hook", () => {
    it("should throw error when used outside AuthProvider", () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow("useAuth must be used within an AuthProvider");
    });

    it("should provide initial unauthenticated state", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should have correct role helpers for unauthenticated user", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isCustomer).toBe(true); // Default role is "user"
      expect(result.current.isContractor).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isSuperAdmin).toBe(false);
    });
  });

  describe("login", () => {
    it("should login successfully", async () => {
      const mockUser = {
        _id: "123",
        email: "test@example.com",
        name: "Test User",
        role: "user",
      };

      vi.mocked(authApi.login).mockResolvedValueOnce({
        success: true,
        data: { user: mockUser, token: "test-token" },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(authApi.login).toHaveBeenCalledWith("test@example.com", "password123");
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBeNull();
    });

    it("should handle login failure", async () => {
      vi.mocked(authApi.login).mockResolvedValueOnce({
        success: false,
        error: "Invalid credentials",
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should throw on failed login
      await expect(
        act(async () => {
          await result.current.login("wrong@example.com", "wrongpassword");
        })
      ).rejects.toThrow("Invalid credentials");

      // User should remain null after failed login
      expect(result.current.user).toBeNull();
    });

    it("should handle network error during login", async () => {
      vi.mocked(authApi.login).mockRejectedValueOnce({
        response: { data: { error: "Network error" } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login("test@example.com", "password");
        })
      ).rejects.toThrow("Network error");
    });
  });

  describe("register", () => {
    it("should register successfully", async () => {
      const mockUser = {
        _id: "123",
        email: "new@example.com",
        name: "New User",
        role: "user",
      };

      vi.mocked(authApi.register).mockResolvedValueOnce({
        success: true,
        data: { user: mockUser, token: "test-token" },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register({
          email: "new@example.com",
          password: "password123",
          name: "New User",
        });
      });

      expect(authApi.register).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
    });

    it("should handle registration failure", async () => {
      vi.mocked(authApi.register).mockResolvedValueOnce({
        success: false,
        error: "Email already exists",
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.register({
            email: "existing@example.com",
            password: "password123",
            name: "Test",
          });
        })
      ).rejects.toThrow("Email already exists");
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      const mockUser = {
        _id: "123",
        email: "test@example.com",
        name: "Test User",
        role: "user",
      };

      vi.mocked(authApi.login).mockResolvedValueOnce({
        success: true,
        data: { user: mockUser, token: "test-token" },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Login first
      await act(async () => {
        await result.current.login("test@example.com", "password");
      });

      expect(result.current.user).toEqual(mockUser);

      // Then logout
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(authSession.clear).toHaveBeenCalled();
    });
  });

  describe("updateProfile", () => {
    it("should update profile locally", async () => {
      const mockUser = {
        _id: "123",
        email: "test@example.com",
        name: "Test User",
        role: "user",
      };

      vi.mocked(authApi.login).mockResolvedValueOnce({
        success: true,
        data: { user: mockUser, token: "test-token" },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Login first
      await act(async () => {
        await result.current.login("test@example.com", "password");
      });

      // Update profile
      await act(async () => {
        await result.current.updateProfile({ name: "Updated Name" });
      });

      expect(result.current.user?.name).toBe("Updated Name");
    });

    it("should not update profile when not logged in", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateProfile({ name: "New Name" });
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe("clearError", () => {
    it("should clear error", async () => {
      vi.mocked(authApi.login).mockResolvedValueOnce({
        success: false,
        error: "Some error",
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Create an error by failed login
      try {
        await act(async () => {
          await result.current.login("test@example.com", "password");
        });
      } catch {
        // Expected to throw
      }

      // Clear the error - clearError should work even if error state timing is async
      act(() => {
        result.current.clearError();
      });

      // After clearError, error should be null
      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe("session loading", () => {
    it("should load session from token on mount", async () => {
      const mockUser = {
        _id: "123",
        email: "test@example.com",
        name: "Test User",
        role: "user",
      };

      vi.mocked(authSession.getCachedToken).mockReturnValueOnce("existing-token");
      vi.mocked(authApi.getMe).mockResolvedValueOnce({
        success: true,
        data: { user: mockUser },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(authApi.getMe).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
    });

    it("should clear session if token is invalid", async () => {
      vi.mocked(authSession.getCachedToken).mockReturnValueOnce("invalid-token");
      vi.mocked(authApi.getMe).mockResolvedValueOnce({
        success: false,
        error: "Token expired",
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(authSession.clear).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });
  });

  describe("role helpers", () => {
    it("should identify customer correctly", async () => {
      const mockUser = {
        _id: "123",
        email: "customer@example.com",
        name: "Customer",
        role: "user",
      };

      vi.mocked(authApi.login).mockResolvedValueOnce({
        success: true,
        data: { user: mockUser, token: "token" },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login("customer@example.com", "password");
      });

      expect(result.current.isCustomer).toBe(true);
      expect(result.current.isContractor).toBe(false);
      expect(result.current.isAdmin).toBe(false);
    });

    it("should identify contractor correctly", async () => {
      const mockUser = {
        _id: "123",
        email: "contractor@example.com",
        name: "Contractor",
        role: "contractor",
      };

      vi.mocked(authApi.login).mockResolvedValueOnce({
        success: true,
        data: { user: mockUser, token: "token" },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login("contractor@example.com", "password");
      });

      expect(result.current.isCustomer).toBe(false);
      expect(result.current.isContractor).toBe(true);
      expect(result.current.isAdmin).toBe(false);
    });

    it("should identify admin correctly", async () => {
      const mockUser = {
        _id: "123",
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
      };

      vi.mocked(authApi.login).mockResolvedValueOnce({
        success: true,
        data: { user: mockUser, token: "token" },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login("admin@example.com", "password");
      });

      expect(result.current.isCustomer).toBe(false);
      expect(result.current.isContractor).toBe(false);
      expect(result.current.isAdmin).toBe(true);
    });
  });
});
