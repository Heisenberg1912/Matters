import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import Pusher from 'pusher-js';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export interface PersistentNotification {
  id: string;
  type: 'bid-submitted' | 'bid-accepted' | 'bid-rejected' | 'job-started' | 'job-completed' | 'progress-update' | 'comment-added' | 'message-received' | 'budget-alert' | 'task-completed' | 'weather-warning' | 'payment-received' | 'payment-due' | 'project-update' | 'team-invite' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  link?: string | null;
  createdAt: Date;
  time?: string;
}

interface NotificationContextType {
  notifications: PersistentNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || '';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<PersistentNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pusherRef = useRef<Pusher | null>(null);

  const getAuthToken = () => localStorage.getItem('matters-auth-token');

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    const token = getAuthToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/notifications?limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data.notifications.map((n: any) => ({
            ...n,
            createdAt: new Date(n.createdAt),
          })));
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initialize Pusher and fetch notifications when user logs in
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Cleanup pusher if user logs out
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
      setNotifications([]);
      return;
    }

    // Fetch existing notifications
    fetchNotifications();

    // Check if Pusher is enabled
    const pusherKey = import.meta.env.VITE_PUSHER_KEY;
    const pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER || 'mt1';

    if (!pusherKey) {
      console.warn('Pusher key not configured. Real-time notifications disabled.');
      return;
    }

    // Initialize Pusher
    const pusherClient = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: `${API_URL}/api/realtime/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      },
    });

    pusherRef.current = pusherClient;

    // Subscribe to user's private channel
    const userChannel = pusherClient.subscribe(`private-user-${user._id}`);

    // Generic handler for all notification types
    const handleNotification = (eventType: string, data: any) => {
      const notification: PersistentNotification = {
        id: data.id || Date.now().toString(),
        type: eventType as PersistentNotification['type'],
        title: data.title,
        message: data.message,
        data: data.data,
        read: false,
        link: data.link,
        createdAt: new Date(data.createdAt || Date.now()),
      };

      setNotifications(prev => {
        // Avoid duplicates
        if (prev.some(n => n.id === notification.id)) {
          return prev;
        }
        return [notification, ...prev];
      });

      // Show toast based on type
      const toastMethod = eventType.includes('rejected') || eventType.includes('alert') ? toast.error :
                         eventType.includes('accepted') || eventType.includes('completed') ? toast.success :
                         toast;

      toastMethod(notification.title, {
        duration: 4000,
      });
    };

    // Bind all notification event types
    const eventTypes = [
      'bid-submitted', 'bid-accepted', 'bid-rejected',
      'job-started', 'job-completed', 'progress-update',
      'comment-added', 'message-received', 'budget-alert',
      'task-completed', 'weather-warning', 'payment-received',
      'payment-due', 'project-update', 'team-invite', 'system'
    ];

    eventTypes.forEach(eventType => {
      userChannel.bind(eventType, (data: any) => handleNotification(eventType, data));
    });

    // Cleanup on unmount
    return () => {
      eventTypes.forEach(eventType => {
        userChannel.unbind(eventType);
      });
      pusherClient.unsubscribe(`private-user-${user._id}`);
      pusherClient.disconnect();
    };
  }, [user, isAuthenticated, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    const token = getAuthToken();
    if (!token) return;

    // Optimistic update
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    );

    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Revert on error
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    // Optimistic update
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));

    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const deleteNotification = useCallback(async (id: string) => {
    const token = getAuthToken();
    if (!token) return;

    // Optimistic update
    setNotifications(prev => prev.filter(notif => notif.id !== id));

    try {
      await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const clearNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    // Optimistic update
    setNotifications([]);

    try {
      await fetch(`${API_URL}/api/notifications`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        deleteNotification,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const usePersistentNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('usePersistentNotifications must be used within NotificationProvider');
  }
  return context;
};

// Keep old name for backward compatibility but log deprecation warning
export const useNotificationContext = usePersistentNotifications;
