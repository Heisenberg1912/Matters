import Pusher from 'pusher';

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
