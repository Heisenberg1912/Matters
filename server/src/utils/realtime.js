import Pusher from 'pusher';
import Notification from '../models/Notification.js';

const isPusherEnabled = () =>
  process.env.PUSHER_ENABLED === 'true' &&
  process.env.PUSHER_APP_ID &&
  process.env.PUSHER_KEY &&
  process.env.PUSHER_SECRET &&
  process.env.PUSHER_CLUSTER;

let pusherClient = null;

export const getPusherServer = () => {
  if (!isPusherEnabled()) {
    return null;
  }

  if (!pusherClient) {
    pusherClient = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  return pusherClient;
};

export const triggerEvent = async (channel, event, payload) => {
  const pusher = getPusherServer();
  if (!pusher) {
    return false;
  }

  try {
    await pusher.trigger(channel, event, payload);
    return true;
  } catch (error) {
    console.error('Pusher trigger error:', error);
    return false;
  }
};

export const triggerProjectEvent = async (projectId, event, payload) => {
  if (!projectId) {
    return false;
  }
  return triggerEvent(`private-project-${projectId}`, event, payload);
};

export const triggerUserEvent = async (userId, event, payload) => {
  if (!userId) {
    return false;
  }
  return triggerEvent(`private-user-${userId}`, event, payload);
};

// Send notification to user (saves to DB and triggers real-time event)
export const sendNotification = async ({
  userId,
  type,
  title,
  message,
  data = {},
  link = null,
  projectId = null,
  jobId = null,
}) => {
  if (!userId) {
    return null;
  }

  try {
    // Save notification to database
    const notification = await Notification.createNotification({
      user: userId,
      type,
      title,
      message,
      data,
      link,
      project: projectId,
      job: jobId,
    });

    // Trigger real-time event
    await triggerUserEvent(userId, type, {
      id: notification._id,
      type,
      title,
      message,
      data,
      link,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (error) {
    console.error('Send notification error:', error);
    return null;
  }
};

// Send notification to multiple users
export const sendNotificationToUsers = async (userIds, notificationData) => {
  const results = await Promise.allSettled(
    userIds.map((userId) => sendNotification({ userId, ...notificationData }))
  );
  return results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
};
