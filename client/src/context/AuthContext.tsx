import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "../lib/api";
import { authApi } from "../lib/api";
import { authSession } from "../lib/auth-session";
import { useNavigate } from "react-router-dom";

type AuthRole = "user" | "contractor" | "admin" | "superadmin";

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: "user" | "contractor";
  company?: { name?: string };
  specializations?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // Role helpers
  isCustomer: boolean;
  isContractor: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasRole: (roles: AuthRole | AuthRole[]) => boolean;
  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authSession.getUser());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hydrateUser = (nextUser: User | null) => {
    setUser(nextUser);
    authSession.setUser(nextUser);
    authSession.setAuthenticated(!!nextUser);
  };

  const loadSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if we have a token
      const token = authSession.getCachedToken();

      if (token) {
        // Validate token and get current user from backend
        const response = await authApi.getMe();
        if (response.success && response.data?.user) {
          hydrateUser(response.data.user);
        } else {
          // Token invalid, clear session
          authSession.clear();
          hydrateUser(null);
        }
      } else {
        hydrateUser(null);
      }
    } catch (err) {
      // Token expired or invalid, clear session
      authSession.clear();
      hydrateUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await authApi.login(email, password);
      if (response.success && response.data?.user) {
        hydrateUser(response.data.user);
      } else {
        throw new Error(response.error || "Login failed");
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err.message || "Login failed. Please try again.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await authApi.register(data);
      if (response.success && response.data?.user) {
        hydrateUser(response.data.user);
      } else {
        throw new Error(response.error || "Registration failed");
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err.message || "Registration failed. Please try again.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    authSession.clear();
    hydrateUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    setError(null);
    if (!user) return;

    const updatedUser = {
      ...user,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    hydrateUser(updatedUser);
  };

  const clearError = () => setError(null);

  // Role helper functions
  const currentRole = user?.role || "user";
  const isCustomer = currentRole === "user";
  const isContractor = currentRole === "contractor";
  const isAdmin = currentRole === "admin" || currentRole === "superadmin";
  const isSuperAdmin = currentRole === "superadmin";

  const hasRole = (roles: AuthRole | AuthRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(currentRole as AuthRole);
  };

  const isAuthenticated = !!user && authSession.isAuthenticated();

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated,
    isLoading,
    error,
    // Role helpers
    isCustomer,
    isContractor,
    isAdmin,
    isSuperAdmin,
    hasRole,
    // Auth methods
    login,
    register,
    logout,
    updateProfile,
    refreshUser: loadSession,
    clearError,
  }), [error, isLoading, user, isAuthenticated, isCustomer, isContractor, isAdmin, isSuperAdmin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
