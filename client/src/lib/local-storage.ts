/**
 * Local Storage utility for persistent data storage
 * Provides type-safe localStorage operations
 */

export const storage = {
  /**
   * Get item from localStorage with type safety
   * @param key - Storage key
   * @param defaultValue - Default value if key doesn't exist
   * @returns Parsed value or default
   */
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Set item in localStorage
   * @param key - Storage key
   * @param value - Value to store
   */
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  },

  /**
   * Remove item from localStorage
   * @param key - Storage key to remove
   */
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  },

  /**
   * Clear all items from localStorage
   */
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },

  /**
   * Check if key exists in localStorage
   * @param key - Storage key to check
   * @returns True if key exists
   */
  has: (key: string): boolean => {
    return localStorage.getItem(key) !== null;
  }
};

/**
 * Storage keys used throughout the app
 */
export const STORAGE_KEYS = {
  BUDGET_EXPENSES: 'matters-budget-expenses',
  BUDGET_CATEGORIES: 'matters-budget-categories',
  INVENTORY_ITEMS: 'matters-inventory-items',
  SCHEDULE_TASKS: 'matters-schedule-tasks',
  CONTRACTORS: 'matters-contractors',
  SUPPORT_TICKETS: 'matters-support-tickets',
  PLANS: 'matters-plans',
  GALLERY_PHOTOS: 'matters-gallery-photos',
  THEME: 'matters-theme',
  USER_PROFILE: 'matters-user-profile'
} as const;
