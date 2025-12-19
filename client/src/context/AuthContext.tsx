import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, authStorage, projectsApi, type User, type AuthTokens } from '../lib/api';
import { getUserChannelName, resetPusherClient, subscribeToChannel, unsubscribeFromChannel } from '@/lib/realtime';
import { useNotifications } from '@/hooks/use-notifications';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string, clientId?: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string; role?: string }) => Promise<void>;
  logout: (logoutAll?: boolean) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useNotifications();
  const [user, setUser] = useState<User | null>(authStorage.getUser());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user && authStorage.isAuthenticated();

  const acceptPendingInvite = useCallback(async () => {
    const token = localStorage.getItem('pending-invite-token');
    if (!token) return;
    try {
      await projectsApi.acceptInvite(token);
      localStorage.removeItem('pending-invite-token');
    } catch (err) {
      console.error('Failed to accept pending invite:', err);
    }
  }, []);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (authStorage.isAuthenticated()) {
        try {
          const response = await authApi.getMe();
          if (response.success && response.data?.user) {
            setUser(response.data.user);
          } else {
            // Token is invalid, clear storage
            authStorage.clear();
            setUser(null);
          }
        } catch (err) {
          console.error('Auth check failed:', err);
          // Don't clear storage on network errors
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(email, password);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        resetPusherClient();
        await acceptPendingInvite();
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (credential: string, clientId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.googleAuth(credential, clientId);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        resetPusherClient();
        await acceptPendingInvite();
      } else {
        throw new Error(response.error || 'Google login failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: { email: string; password: string; name: string; phone?: string; role?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.register(data);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        resetPusherClient();
        await acceptPendingInvite();
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (logoutAll = false) => {
    setIsLoading(true);
    try {
      await authApi.logout(logoutAll);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      resetPusherClient();
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.updateMe(data);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        throw new Error(response.error || 'Profile update failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Profile update failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.forgotPassword(email);
      if (!response.success) {
        throw new Error(response.error || 'Failed to send reset email');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.resetPassword(token, password);
      if (!response.success) {
        throw new Error(response.error || 'Password reset failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.changePassword(currentPassword, newPassword);
      if (!response.success) {
        throw new Error(response.error || 'Password change failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password change failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!authStorage.isAuthenticated()) return;

    try {
      const response = await authApi.getMe();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, []);

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
        type: 'success',
        message: 'Project created',
        description: payload.project?.name || 'A new project is ready.',
      });
    };

    const handleProjectDeleted = () => {
      showToast({
        type: 'warning',
        message: 'Project removed',
        description: 'A project was deleted.',
      });
    };

    channel.bind('project.created', handleProjectCreated);
    channel.bind('project.deleted', handleProjectDeleted);

    return () => {
      channel.unbind('project.created', handleProjectCreated);
      channel.unbind('project.deleted', handleProjectDeleted);
      unsubscribeFromChannel(channelName);
    };
  }, [isAuthenticated, showToast, user?._id]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginWithGoogle,
    register,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
