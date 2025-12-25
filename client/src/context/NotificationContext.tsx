import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Pusher from 'pusher-js';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'bid-submitted' | 'bid-accepted' | 'bid-rejected' | 'job-started' | 'job-completed' | 'progress-update' | 'comment-added';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pusher, setPusher] = useState<Pusher | null>(null);

  // Initialize Pusher when user logs in
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Cleanup pusher if user logs out
      if (pusher) {
        pusher.disconnect();
        setPusher(null);
      }
      setNotifications([]);
      return;
    }

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
      authEndpoint: `${import.meta.env.VITE_API_URL || ''}/api/realtime/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('matters-auth-token')}`,
        },
      },
    });

    setPusher(pusherClient);

    // Subscribe to user's private channel
    const userChannel = pusherClient.subscribe(`private-user-${user._id}`);

    // Bid submitted notification (for job posters)
    userChannel.bind('bid-submitted', (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'bid-submitted',
        title: 'New Bid Received',
        message: `${data.contractor?.name || 'A contractor'} submitted a bid of ₹${data.amount?.toLocaleString()} on your job "${data.jobTitle}"`,
        data,
        read: false,
        createdAt: new Date(),
      };
      setNotifications(prev => [notification, ...prev]);
      toast.success(notification.title);
    });

    // Bid accepted notification (for contractors)
    userChannel.bind('bid-accepted', (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'bid-accepted',
        title: 'Bid Accepted! 🎉',
        message: `Your bid on "${data.jobTitle}" has been accepted!`,
        data,
        read: false,
        createdAt: new Date(),
      };
      setNotifications(prev => [notification, ...prev]);
      toast.success(notification.message, { duration: 5000 });
    });

    // Bid rejected notification (for contractors)
    userChannel.bind('bid-rejected', (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'bid-rejected',
        title: 'Bid Not Accepted',
        message: `Your bid on "${data.jobTitle}" was not accepted.`,
        data,
        read: false,
        createdAt: new Date(),
      };
      setNotifications(prev => [notification, ...prev]);
      toast.error(notification.message);
    });

    // Job started notification (for customers)
    userChannel.bind('job-started', (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'job-started',
        title: 'Job Started',
        message: `Work has started on "${data.jobTitle}"`,
        data,
        read: false,
        createdAt: new Date(),
      };
      setNotifications(prev => [notification, ...prev]);
      toast.success(notification.message);
    });

    // Job completed notification (for customers)
    userChannel.bind('job-completed', (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'job-completed',
        title: 'Job Completed! ✅',
        message: `"${data.jobTitle}" has been marked as completed`,
        data,
        read: false,
        createdAt: new Date(),
      };
      setNotifications(prev => [notification, ...prev]);
      toast.success(notification.message, { duration: 5000 });
    });

    // Progress update notification (for customers)
    userChannel.bind('progress-update', (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'progress-update',
        title: 'New Progress Update',
        message: `${data.contractor?.name || 'Contractor'} posted an update: "${data.description?.substring(0, 50)}..."`,
        data,
        read: false,
        createdAt: new Date(),
      };
      setNotifications(prev => [notification, ...prev]);
      toast.info(notification.title);
    });

    // Comment added notification
    userChannel.bind('comment-added', (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'comment-added',
        title: 'New Comment',
        message: `${data.commenter?.name || 'Someone'} commented: "${data.text?.substring(0, 50)}..."`,
        data,
        read: false,
        createdAt: new Date(),
      };
      setNotifications(prev => [notification, ...prev]);
      toast.info(notification.title);
    });

    // Cleanup on unmount
    return () => {
      userChannel.unbind_all();
      pusherClient.unsubscribe(`private-user-${user._id}`);
      pusherClient.disconnect();
    };
  }, [user, isAuthenticated]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
