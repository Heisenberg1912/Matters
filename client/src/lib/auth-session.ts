import type { User } from "./api";

type TokenProvider = () => Promise<string | null>;

let cachedToken: string | null = null;
let tokenProvider: TokenProvider | null = null;
let currentUser: User | null = null;
let authenticated = false;

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
  },
  setUser: (user: User | null) => {
    currentUser = user;
  },
  getUser: () => currentUser,
  setAuthenticated: (value: boolean) => {
    authenticated = value;
  },
  isAuthenticated: () => authenticated,
  clear: () => {
    cachedToken = null;
    currentUser = null;
    authenticated = false;
  },
};
