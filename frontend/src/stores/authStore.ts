import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  // Authentication state
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  showLoginModal: boolean;
  showRegisterModal: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
  setUser: (user: User) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  showLogin: () => void;
  showRegister: () => void;
  hideModals: () => void;
  checkAuthStatus: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      showLoginModal: false,
      showRegisterModal: false,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
          }

          const data = await response.json();
          
          set({
            isAuthenticated: true,
            user: data.user,
            token: data.token,
            refreshToken: data.refresh_token,
            isLoading: false,
            error: null,
            showLoginModal: false,
          });

          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null,
          });
          return false;
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
          }

          const data = await response.json();
          
          set({
            isAuthenticated: true,
            user: data.user,
            token: data.token,
            refreshToken: data.refresh_token,
            isLoading: false,
            error: null,
            showRegisterModal: false,
          });

          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({ 
            isLoading: false, 
            error: errorMessage,
          });
          return false;
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
          error: null,
          showLoginModal: false,
          showRegisterModal: false,
        });
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();
          
          set({
            token: data.token,
            refreshToken: data.refresh_token,
            user: data.user,
            isAuthenticated: true,
          });

          return true;
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          return false;
        }
      },

      setUser: (user: User) => set({ user }),
      setError: (error: string | null) => set({ error }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
      showLogin: () => set({ showLoginModal: true, showRegisterModal: false, error: null }),
      showRegister: () => set({ showRegisterModal: true, showLoginModal: false, error: null }),
      hideModals: () => set({ showLoginModal: false, showRegisterModal: false, error: null }),

      checkAuthStatus: () => {
        const { token, refreshToken } = get();
        if (!token && !refreshToken) {
          return false;
        }
        
        // Check if token is expired (simplified check)
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            
            if (payload.exp < currentTime) {
              // Token expired, try to refresh
              get().refreshAuth();
              return false;
            }
            return true;
          } catch (error) {
            get().logout();
            return false;
          }
        }
        
        return false;
      },
    })),
    {
      name: 'arcane-chess-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);