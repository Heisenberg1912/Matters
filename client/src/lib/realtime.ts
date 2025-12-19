import Pusher, { type Channel } from 'pusher-js';
import { authStorage } from './api';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY as string | undefined;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER as string | undefined;
const PUSHER_ENABLED = (import.meta.env.VITE_PUSHER_ENABLED as string | undefined) !== 'false';

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (typeof window !== 'undefined' ? window.location.origin : '');
const API_PREFIX = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api';

let pusherClient: Pusher | null = null;

const getAuthHeaders = () => {
  const token = authStorage.getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const resetPusherClient = () => {
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }
};

export const getPusherClient = () => {
  if (!PUSHER_ENABLED || !PUSHER_KEY || !PUSHER_CLUSTER || !API_BASE_URL) {
    return null;
  }

  if (!pusherClient) {
    pusherClient = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      authEndpoint: `${API_BASE_URL}${API_PREFIX}/realtime/auth`,
      auth: { headers: getAuthHeaders() },
    });
  }

  return pusherClient;
};

export const getProjectChannelName = (projectId: string) => `private-project-${projectId}`;
export const getUserChannelName = (userId: string) => `private-user-${userId}`;

export const subscribeToChannel = (channelName: string): Channel | null => {
  const client = getPusherClient();
  if (!client) {
    return null;
  }
  return client.subscribe(channelName);
};

export const unsubscribeFromChannel = (channelName: string) => {
  const client = getPusherClient();
  if (!client) {
    return;
  }
  client.unsubscribe(channelName);
};
