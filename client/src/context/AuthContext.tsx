import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth as useClerkAuth, useClerk, useSignIn, useSignUp, useUser } from "@clerk/clerk-react";
import { authApi, projectsApi, type User } from "../lib/api";
import { authSession } from "../lib/auth-session";
import { getUserChannelName, resetPusherClient, subscribeToChannel, unsubscribeFromChannel } from "@/lib/realtime";
import { useNotifications } from "@/hooks/use-notifications";

type AuthRole = "user" | "contractor";
type OAuthProvider = "google" | "github" | "apple";

const OAUTH_ROLE_STORAGE_KEY = "pending-oauth-role";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
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

// Extract error message from Clerk errors or generic errors
const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === "object" && "errors" in err) {
    const errors = (err as { errors?: Array<{ message?: string; longMessage?: string }> }).errors;
    if (errors?.[0]) {
      return errors[0].longMessage || errors[0].message || fallback;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
};

const normalizeRole = (value: unknown): AuthRole | null => {
  if (value === "contractor") return "contractor";
  if (value === "user") return "user";
  return null;
};

const getClerkMetadataRole = (clerkUser: {
  publicMetadata?: Record<string, unknown>;
  unsafeMetadata?: Record<string, unknown>;
} | null): AuthRole | null => {
  if (!clerkUser) return null;
  const rawRole = clerkUser.publicMetadata?.role ?? clerkUser.unsafeMetadata?.role;
  return normalizeRole(rawRole);
};

// Pending OAuth role helpers
const getPendingOAuthRole = (): AuthRole | null => {
  if (typeof window === "undefined") return null;
  return normalizeRole(localStorage.getItem(OAUTH_ROLE_STORAGE_KEY));
};

const setPendingOAuthRole = (role: AuthRole | null): void => {
  if (typeof window === "undefined") return;
  if (role) {
    localStorage.setItem(OAUTH_ROLE_STORAGE_KEY, role);
  } else {
    localStorage.removeItem(OAUTH_ROLE_STORAGE_KEY);
  }
};

const clearPendingOAuthRole = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OAUTH_ROLE_STORAGE_KEY);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useNotifications();
  const { isLoaded: clerkLoaded, isSignedIn, getToken } = useClerkAuth();
  const { signOut } = useClerk();
  const { user: clerkUser, isLoaded: clerkUserLoaded } = useUser();
  const { isLoaded: signInLoaded, signIn, setActive: setActiveSignIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp();

  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user && isSignedIn;

  // Accept pending project invite after login/register
  const acceptPendingInvite = useCallback(async () => {
    const token = localStorage.getItem("pending-invite-token");
    if (!token) return;
    try {
      await projectsApi.acceptInvite(token);
      localStorage.removeItem("pending-invite-token");
    } catch (err) {
      console.error("Failed to accept pending invite:", err);
    }
  }, []);

  // Ensure Clerk user has role metadata set
  const ensureClerkRole = useCallback(async (): Promise<boolean> => {
    const pendingRole = getPendingOAuthRole();
    if (!pendingRole || !clerkUser) return true;

    const existingRole = getClerkMetadataRole(clerkUser);
    if (!existingRole) {
      try {
        await clerkUser.update({
          unsafeMetadata: { ...clerkUser.unsafeMetadata, role: pendingRole },
        });
      } catch (err) {
        console.error("Failed to persist Clerk role metadata:", err);
        return false;
      }
    }

    clearPendingOAuthRole();
    return true;
  }, [clerkUser]);

  // Sync auth token with session storage
  const syncToken = useCallback(async () => {
    if (!clerkLoaded || !isSignedIn) {
      authSession.setToken(null);
      return;
    }
    const token = await getToken();
    authSession.setToken(token || null);
  }, [clerkLoaded, getToken, isSignedIn]);

  // Fetch current user from backend
  const refreshUser = useCallback(async () => {
    if (!isSignedIn) return;

    await syncToken();

    const canProceed = await ensureClerkRole();
    if (!canProceed) return;

    const response = await authApi.getMe();
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      authSession.setUser(response.data.user);
    }
  }, [ensureClerkRole, isSignedIn, syncToken]);

  // Set up token provider
  useEffect(() => {
    if (!clerkLoaded) return;

    authSession.setTokenProvider(async () => {
      if (!isSignedIn) return null;
      return getToken();
    });
  }, [clerkLoaded, getToken, isSignedIn]);

  // Sync authentication state
  useEffect(() => {
    authSession.setAuthenticated(!!isAuthenticated);
  }, [isAuthenticated]);

  // Bootstrap auth on mount
  useEffect(() => {
    if (!clerkLoaded) return;

    const pendingRole = getPendingOAuthRole();
    if (isSignedIn && pendingRole && !clerkUserLoaded) return;

    const bootstrap = async () => {
      if (!isSignedIn) {
        authSession.clear();
        setUser(null);
        setIsInitializing(false);
        return;
      }

      try {
        await refreshUser();
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    bootstrap();
  }, [clerkLoaded, clerkUserLoaded, isSignedIn, refreshUser]);

  // Refresh token periodically
  useEffect(() => {
    if (!clerkLoaded || !isSignedIn) return;

    let isActive = true;

    const refresh = async () => {
      try {
        const token = await getToken();
        if (isActive) {
          authSession.setToken(token || null);
        }
      } catch (err) {
        console.error("Failed to refresh Clerk token:", err);
      }
    };

    refresh();
    const interval = setInterval(refresh, 4 * 60 * 1000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [clerkLoaded, getToken, isSignedIn]);

  // Login with email and password
  const login = useCallback(async (email: string, password: string) => {
    if (!signInLoaded || !signIn) {
      throw new Error("Sign in is not ready yet.");
    }

    setIsBusy(true);
    setError(null);
    clearPendingOAuthRole();

    try {
      const result = await signIn.create({ identifier: email, password });

      if (result.status !== "complete") {
        throw new Error("Sign in requires additional verification.");
      }

      await setActiveSignIn({ session: result.createdSessionId });
      resetPusherClient();
      await refreshUser();
      await acceptPendingInvite();
    } catch (err) {
      const message = getErrorMessage(err, "Login failed");
      setError(message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [acceptPendingInvite, refreshUser, setActiveSignIn, signIn, signInLoaded]);

  // Register new user
  const register = useCallback(async (data: { email: string; password: string; name: string; phone?: string; role?: string }) => {
    if (!signUpLoaded || !signUp) {
      throw new Error("Sign up is not ready yet.");
    }

    setIsBusy(true);
    setError(null);
    clearPendingOAuthRole();

    try {
      const trimmedName = data.name.trim();
      const [firstName, ...rest] = trimmedName.split(" ");
      const lastName = rest.join(" ") || undefined;
      const role = data.role === "contractor" ? "contractor" : "user";

      const result = await signUp.create({
        emailAddress: data.email,
        password: data.password,
        firstName: firstName || undefined,
        lastName,
        unsafeMetadata: { role },
      });

      if (result.status === "complete") {
        await setActiveSignUp({ session: result.createdSessionId });
        resetPusherClient();
        await refreshUser();
        await acceptPendingInvite();
        return { status: "complete" as const };
      }

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      return { status: "needs_verification" as const };
    } catch (err) {
      const message = getErrorMessage(err, "Registration failed");
      setError(message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [acceptPendingInvite, refreshUser, setActiveSignUp, signUp, signUpLoaded]);

  // Sign in with OAuth provider (Google, GitHub, etc.)
  const signInWithOAuth = useCallback(async (provider: OAuthProvider, redirectTo?: string) => {
    if (!signInLoaded || !signIn) {
      throw new Error("Sign in is not ready yet.");
    }

    // If user is still signed in, don't proceed - the calling component should handle logout first
    if (isSignedIn) {
      throw new Error("Please sign out before signing in with a different account.");
    }

    setError(null);
    clearPendingOAuthRole();

    try {
      const strategy = `oauth_${provider}` as const;
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: redirectTo || "/home",
      });
      // Note: Page will redirect, so no need to handle success or reset loading
    } catch (err) {
      const message = getErrorMessage(err, "Social sign-in failed");
      setError(message);
      throw err;
    }
  }, [isSignedIn, signIn, signInLoaded]);

  // Sign up with OAuth provider
  const signUpWithOAuth = useCallback(async (provider: OAuthProvider, options?: { redirectTo?: string; role?: AuthRole }) => {
    if (!signUpLoaded || !signUp) {
      throw new Error("Sign up is not ready yet.");
    }

    setError(null);
    const role = normalizeRole(options?.role);
    setPendingOAuthRole(role);

    try {
      const strategy = `oauth_${provider}` as const;
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: options?.redirectTo || "/home",
      });
      // Note: Page will redirect, so no need to handle success or reset loading
    } catch (err) {
      clearPendingOAuthRole();
      const message = getErrorMessage(err, "Social sign-up failed");
      setError(message);
      throw err;
    }
  }, [signUp, signUpLoaded]);

  // Verify email with code
  const verifyEmail = useCallback(async (code: string) => {
    if (!signUpLoaded || !signUp) {
      throw new Error("Email verification is not ready yet.");
    }

    setIsBusy(true);
    setError(null);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status !== "complete") {
        throw new Error("Email verification failed.");
      }

      await setActiveSignUp({ session: result.createdSessionId });
      resetPusherClient();
      await refreshUser();
      await acceptPendingInvite();
    } catch (err) {
      const message = getErrorMessage(err, "Email verification failed");
      setError(message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [acceptPendingInvite, refreshUser, setActiveSignUp, signUp, signUpLoaded]);

  // Logout
  const logout = useCallback(async () => {
    setIsBusy(true);
    try {
      await signOut();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      authSession.clear();
      resetPusherClient();
      setIsBusy(false);
    }
  }, [signOut]);

  // Update user profile
  const updateProfile = useCallback(async (data: Partial<User>) => {
    setIsBusy(true);
    setError(null);

    try {
      const response = await authApi.updateMe(data);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        authSession.setUser(response.data.user);
      } else {
        throw new Error(response.error || "Profile update failed");
      }
    } catch (err) {
      const message = getErrorMessage(err, "Profile update failed");
      setError(message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, []);

  // Request password reset
  const forgotPassword = useCallback(async (email: string) => {
    if (!signInLoaded || !signIn) {
      throw new Error("Password reset is not ready yet.");
    }

    setIsBusy(true);
    setError(null);

    try {
      const result = await signIn.create({ identifier: email });
      const resetFactor = result.supportedFirstFactors?.find(
        (factor) => factor.strategy === "reset_password_email_code"
      );

      if (!resetFactor || !("emailAddressId" in resetFactor)) {
        throw new Error("Password reset via email code is unavailable.");
      }

      await signIn.prepareFirstFactor({
        strategy: "reset_password_email_code",
        emailAddressId: resetFactor.emailAddressId as string,
      });
    } catch (err) {
      const message = getErrorMessage(err, "Failed to send reset email");
      setError(message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [signIn, signInLoaded]);

  // Reset password with code
  const resetPassword = useCallback(async (code: string, password: string) => {
    if (!signInLoaded || !signIn) {
      throw new Error("Password reset is not initialized. Please request a reset code again.");
    }

    setIsBusy(true);
    setError(null);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status !== "complete") {
        throw new Error("Password reset failed.");
      }

      await setActiveSignIn({ session: result.createdSessionId });
      resetPusherClient();
      await refreshUser();
    } catch (err) {
      const message = getErrorMessage(err, "Password reset failed");
      setError(message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [refreshUser, setActiveSignIn, signIn, signInLoaded]);

  // Change password (when logged in)
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!clerkUser) {
      throw new Error("User is not ready.");
    }

    setIsBusy(true);
    setError(null);

    try {
      await clerkUser.updatePassword({ currentPassword, newPassword });
    } catch (err) {
      const message = getErrorMessage(err, "Password change failed");
      setError(message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [clerkUser]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Subscribe to real-time events for authenticated user
  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;

    const channelName = getUserChannelName(user._id);
    const channel = subscribeToChannel(channelName);
    if (!channel) return;

    const handleProjectCreated = (payload: { project?: { name?: string } }) => {
      showToast({
        type: "success",
        message: "Project created",
        description: payload.project?.name || "A new project is ready.",
      });
    };

    const handleProjectDeleted = () => {
      showToast({
        type: "warning",
        message: "Project removed",
        description: "A project was deleted.",
      });
    };

    channel.bind("project.created", handleProjectCreated);
    channel.bind("project.deleted", handleProjectDeleted);

    return () => {
      channel.unbind("project.created", handleProjectCreated);
      channel.unbind("project.deleted", handleProjectDeleted);
      unsubscribeFromChannel(channelName);
    };
  }, [isAuthenticated, showToast, user?._id]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!isAuthenticated,
    isLoading: isInitializing || isBusy,
    error,
    login,
    register,
    signInWithOAuth,
    signUpWithOAuth,
    verifyEmail,
    logout,
    updateProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    refreshUser,
    clearError,
  };

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
