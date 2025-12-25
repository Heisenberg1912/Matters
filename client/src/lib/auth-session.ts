import type { User } from "./api";

type TokenProvider = () => Promise<string | null>;

const TOKEN_KEY = "matters-auth-token";
const USER_KEY = "matters-auth-user";

let cachedToken: string | null = null;
let tokenProvider: TokenProvider | null = null;
let currentUser: User | null = null;
let authenticated = false;

// Initialize from localStorage
if (typeof window !== "undefined") {
  cachedToken = localStorage.getItem(TOKEN_KEY);
  const storedUser = localStorage.getItem(USER_KEY);
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
      authenticated = !!cachedToken;
    } catch {
      // Invalid stored user
    }
  }
}

export const authSession = {
  setTokenProvider: (provider: TokenProvider | null) => {
    tokenProvider = provider;
  },
  getToken: async () => {
    if (tokenProvider) {
      const token = await tokenProvider();
      cachedToken = token;
      return token;
    }
    return cachedToken;
  },
  getCachedToken: () => cachedToken,
  setToken: (token: string | null) => {
    cachedToken = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  },
  setUser: (user: User | null) => {
    currentUser = user;
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    }
  },
  getUser: () => currentUser,
  setAuthenticated: (value: boolean) => {
    authenticated = value;
  },
  isAuthenticated: () => authenticated && !!cachedToken,
  clear: () => {
    cachedToken = null;
    currentUser = null;
    authenticated = false;
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },
};
