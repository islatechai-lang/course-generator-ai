// Memory fallback for session-level persistence if localStorage is blocked
const memoryStore: Record<string, string> = {};

export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to read ${key} from localStorage:`, e);
      return memoryStore[key] || null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Storage] Failed to write ${key} to localStorage:`, e);
      memoryStore[key] = value;
    }
  }
};
