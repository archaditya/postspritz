import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'superadmin' | 'admin' | 'user';
  profileImageUrl?: string;
  bio?: string;
  company?: string;
  phone?: string;
  timezone?: string;
  walletBalancePaise: number;
  planId?: string;
  subscriptionStatus?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setToken: (token: string | null) => void;
  updateWalletBalance: (balancePaise: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => {
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('postspritz_access_token', token);
        } else if (typeof window !== 'undefined') {
          localStorage.removeItem('postspritz_access_token');
          localStorage.removeItem('sharepostsync_access_token');
          localStorage.removeItem('pushpost_access_token');
        }
        set({ token, isAuthenticated: !!token });
      },
      updateWalletBalance: (balancePaise) =>
        set((state) => ({
          user: state.user ? { ...state.user, walletBalancePaise: balancePaise } : null,
        })),
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('postspritz_access_token');
          localStorage.removeItem('postspritz_refresh_token');
          localStorage.removeItem('sharepostsync_access_token');
          localStorage.removeItem('sharepostsync_refresh_token');
          localStorage.removeItem('pushpost_access_token');
          localStorage.removeItem('pushpost_refresh_token');
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'postspritz-auth-storage',
    }
  )
);
