import type { User } from '@/types/auth';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';
const REMEMBER_ME_KEY = 'rememberMe';

export const authStorage = {
  // Token management
  setToken(token: string, rememberMe: boolean = false): void {
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
  },

  // User data management
  setUser(user: User): void {
    const isRemembered = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    const storage = isRemembered ? localStorage : sessionStorage;
    storage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      return null;
    }
  },

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  // Clear all authentication data
  clearAll(): void {
    this.removeToken();
    this.removeUser();
  },

  // Check if user chose to be remembered
  isRemembered(): boolean {
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  },

  // Initialize auth state from storage
  initializeAuthState(): { token: string | null; user: User | null } {
    const token = this.getToken();
    const user = this.getUser();
    
    // If token exists but no user, clear token (corrupted state)
    if (token && !user) {
      this.removeToken();
      return { token: null, user: null };
    }
    
    // If user exists but no token, clear user (corrupted state)
    if (user && !token) {
      this.removeUser();
      return { token: null, user: null };
    }
    
    return { token, user };
  }
};
