import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, type User } from "../lib/api";
import { authSession } from "../lib/auth-session";

type AuthRole = "user" | "contractor";
type OAuthProvider = "google" | "github" | "apple";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isClerkSignedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string; role?: string }) => Promise<{
    status: "complete" | "needs_verification";
  }>;
  signInWithOAuth: (provider: OAuthProvider, redirectTo?: string) => Promise<void>;
  signUpWithOAuth: (provider: OAuthProvider, options?: { redirectTo?: string; role?: AuthRole }) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  logout: (logoutAll?: boolean) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (code: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_PROFILE_KEY = "matters-guest-profile";

const createFallbackUser = (overrides?: Partial<User>): User => {
  const now = new Date().toISOString();
  return {
    _id: "guest",
    email: "guest@matters.local",
    name: "Guest User",
    role: "user",
    isVerified: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

const loadLocalProfile = (): Partial<User> | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Partial<User>) : null;
  } catch {
    return null;
  }
};

const saveLocalProfile = (profile: Partial<User>) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage errors
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hydrateUser = (nextUser: User | null) => {
    setUser(nextUser);
    authSession.setUser(nextUser);
    authSession.setAuthenticated(true);
  };

  const loadSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.getMe();
      if (response.success && response.data?.user) {
        hydrateUser(response.data.user);
        saveLocalProfile({
          name: response.data.user.name,
          email: response.data.user.email,
          phone: response.data.user.phone,
          company: response.data.user.company,
          specializations: response.data.user.specializations,
          avatar: response.data.user.avatar,
        });
        return;
      }
    } catch (err) {
      console.warn("Session fetch failed, using local guest profile.");
    }

    const localProfile = loadLocalProfile();
    const fallbackUser = createFallbackUser(localProfile || undefined);
    hydrateUser(fallbackUser);
  };

  useEffect(() => {
    authSession.setTokenProvider(async () => null);
    authSession.setAuthenticated(true);
    loadSession().finally(() => setIsLoading(false));
  }, []);

  const updateProfile = async (data: Partial<User>) => {
    setError(null);
    const nextLocal = {
      ...(user || createFallbackUser()),
      ...data,
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await authApi.updateMe(data);
      if (response.success && response.data?.user) {
        hydrateUser(response.data.user);
        saveLocalProfile({
          name: response.data.user.name,
          email: response.data.user.email,
          phone: response.data.user.phone,
          company: response.data.user.company,
          specializations: response.data.user.specializations,
          avatar: response.data.user.avatar,
        });
        return;
      }
    } catch (err) {
      // Fall back to local-only profile updates
    }

    hydrateUser(nextLocal);
    saveLocalProfile({
      name: nextLocal.name,
      email: nextLocal.email,
      phone: nextLocal.phone,
      company: nextLocal.company,
      specializations: nextLocal.specializations,
      avatar: nextLocal.avatar,
    });
  };

  const disabledAction = async () => {
    const message = "Authentication is disabled in this build.";
    setError(message);
    throw new Error(message);
  };

  const clearError = () => setError(null);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated: true,
    isClerkSignedIn: false,
    isLoading,
    error,
    login: disabledAction,
    register: async () => ({ status: "complete" as const }),
    signInWithOAuth: disabledAction,
    signUpWithOAuth: disabledAction,
    verifyEmail: disabledAction,
    logout: async () => {
      clearError();
      const fallbackUser = createFallbackUser(loadLocalProfile() || undefined);
      hydrateUser(fallbackUser);
    },
    updateProfile,
    forgotPassword: disabledAction,
    resetPassword: disabledAction,
    changePassword: disabledAction,
    refreshUser: loadSession,
    clearError,
  }), [error, isLoading, user]);

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
