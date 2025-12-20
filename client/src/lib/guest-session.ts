const GUEST_MODE_KEY = "matters-guest-mode";

export const guestSession = {
  isEnabled: (): boolean => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(GUEST_MODE_KEY) === "true";
  },
  enable: (): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(GUEST_MODE_KEY, "true");
  },
  disable: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(GUEST_MODE_KEY);
  },
};
