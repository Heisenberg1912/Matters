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

const getClerkErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "errors" in err) {
    const errors = (err as { errors?: Array<{ message?: string; longMessage?: string }> }).errors;
    if (errors && errors.length > 0) {
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

const readPendingOAuthRole = (): AuthRole | null => {
  if (typeof window === "undefined") return null;
  return normalizeRole(localStorage.getItem(OAUTH_ROLE_STORAGE_KEY));
};

const setPendingOAuthRole = (role: AuthRole | null) => {
  if (typeof window === "undefined") return;
  if (!role) {
    localStorage.removeItem(OAUTH_ROLE_STORAGE_KEY);
    return;
  }
  localStorage.setItem(OAUTH_ROLE_STORAGE_KEY, role);
};

const clearPendingOAuthRole = () => {
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

  const ensureClerkRole = useCallback(async () => {
    const pendingRole = readPendingOAuthRole();
    if (!pendingRole) return true;
    if (!clerkUser) return false;

    const existingRole = getClerkMetadataRole(clerkUser);
    if (!existingRole) {
      try {
        await clerkUser.update({
          unsafeMetadata: {
            ...(clerkUser.unsafeMetadata || {}),
            role: pendingRole,
          },
        });
      } catch (err) {
        console.error("Failed to persist Clerk role metadata:", err);
        return false;
      }
    }

    clearPendingOAuthRole();
    return true;
  }, [clerkUser]);

  const syncToken = useCallback(async () => {
    if (!clerkLoaded || !isSignedIn) {
      authSession.setToken(null);
      return;
    }
    const token = await getToken();
    authSession.setToken(token || null);
  }, [clerkLoaded, getToken, isSignedIn]);

  const refreshUser = useCallback(async () => {
    if (!isSignedIn) return;

    await syncToken();

    const canProceed = await ensureClerkRole();
    if (!canProceed) {
      return;
    }

    const response = await authApi.getMe();
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      authSession.setUser(response.data.user);
    }
  }, [ensureClerkRole, isSignedIn, syncToken]);

  useEffect(() => {
    if (!clerkLoaded) {
      return;
    }

    authSession.setTokenProvider(async () => {
      if (!isSignedIn) return null;
      return getToken();
    });
  }, [clerkLoaded, getToken, isSignedIn]);

  useEffect(() => {
    authSession.setAuthenticated(isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!clerkLoaded) return;

    const pendingRole = readPendingOAuthRole();
    if (isSignedIn && pendingRole && !clerkUserLoaded) {
      return;
    }

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

  useEffect(() => {
    if (!clerkLoaded || !isSignedIn) {
      return () => undefined;
    }

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

  const login = useCallback(async (email: string, password: string) => {
    setIsBusy(true);
    setError(null);
    clearPendingOAuthRole();
    try {
      if (!signInLoaded || !signIn) {
        throw new Error("Sign in is not ready yet.");
      }

      const result = await signIn.create({ identifier: email, password });
      if (result.status !== "complete") {
        throw new Error("Sign in requires additional verification.");
      }

      await setActiveSignIn({ session: result.createdSessionId });
      resetPusherClient();
      await refreshUser();
      await acceptPendingInvite();
    } catch (err) {
      const message = getClerkErrorMessage(err, "Login failed");
      setError(message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [acceptPendingInvite, refreshUser, setActiveSignIn, signIn, signInLoaded]);

  const register = useCallback(async (data: { email: string; password: string; name: string; phone?: string; role?: string }) => {
    setIsBusy(true);
    setError(null);
    clearPendingOAuthRole();
    try {
      if (!signUpLoaded || !signUp) {
        throw new Error("Sign up is not ready yet.");
      }

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
      const message = getClerkErrorMessage(err, "Registration failed");
      setError(message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [acceptPendingInvite, refreshUser, setActiveSignUp, signUp, signUpLoaded]);

  const signInWithOAuth = useCallback(async (provider: OAuthProvider, redirectTo?: string) => {
    setIsBusy(true);
    setError(null);
    try {
      if (!signInLoaded || !signIn) {
        throw new Error("Sign in is not ready yet.");
      }

      clearPendingOAuthRole();

      const strategy = `oauth_${provider}` as const;
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: redirectTo || "/home",
      });
    } catch (err) {
      const message = getClerkErrorMessage(err, "Social sign-in failed");
      setError(message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [signIn, signInLoaded]);

  const signUpWithOAuth = useCallback(async (provider: OAuthProvider, options?: { redirectTo?: string; role?: AuthRole }) => {
    setIsBusy(true);
    setError(null);
    try {
      if (!signUpLoaded || !signUp) {
        throw new Error("Sign up is not ready yet.");
      }

      const role = normalizeRole(options?.role);
      setPendingOAuthRole(role);

      const strategy = `oauth_${provider}` as const;
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: options?.redirectTo || "/home",
      });
    } catch (err) {
      clearPendingOAuthRole();
      const message = getClerkErrorMessage(err, "Social sign-up failed");
      setError(message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [signUp, signUpLoaded]);

  const verifyEmail = useCallback(async (code: string) => {
    setIsBusy(true);
    setError(null);
    try {
      if (!signUpLoaded || !signUp) {
        throw new Error("Email verification is not ready yet.");
      }

      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status !== "complete") {
        throw new Error("Email verification failed.");
      }

      await setActiveSignUp({ session: result.createdSessionId });
      resetPusherClient();
      await refreshUser();
      await acceptPendingInvite();
    } catch (err) {
      const message = getClerkErrorMessage(err, "Email verification failed");
      setError(message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [acceptPendingInvite, refreshUser, setActiveSignUp, signUp, signUpLoaded]);

  const logout = useCallback(async (_logoutAll = false) => {
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
      const message = getClerkErrorMessage(err, "Profile update failed");
      setError(message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    setIsBusy(true);
    setError(null);
    try {
      if (!signInLoaded || !signIn) {
        throw new Error("Password reset is not ready yet.");
      }

      const result = await signIn.create({ identifier: email });
      const canReset = result.supportedFirstFactors?.some(
        (factor) => factor.strategy === "reset_password_email_code"
      );

      if (!canReset) {
        throw new Error("Password reset via email code is unavailable.");
      }

      await signIn.prepareFirstFactor({ strategy: "reset_password_email_code" });
    } catch (err) {
      const message = getClerkErrorMessage(err, "Failed to send reset email");
      setError(message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [signIn, signInLoaded]);

  const resetPassword = useCallback(async (code: string, password: string) => {
    setIsBusy(true);
    setError(null);
    try {
      if (!signInLoaded || !signIn) {
        throw new Error("Password reset is not initialized. Please request a reset code again.");
      }

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
      const message = getClerkErrorMessage(err, "Password reset failed");
      setError(message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [refreshUser, setActiveSignIn, signIn, signInLoaded]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setIsBusy(true);
    setError(null);
    try {
      if (!clerkUser) {
        throw new Error("User is not ready.");
      }
      await clerkUser.updatePassword({ currentPassword, newPassword });
    } catch (err) {
      const message = getClerkErrorMessage(err, "Password change failed");
      setError(message);
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [clerkUser]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      return () => undefined;
    }

    const channelName = getUserChannelName(user._id);
    const channel = subscribeToChannel(channelName);

    if (!channel) {
      return () => undefined;
    }

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
    isAuthenticated,
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
