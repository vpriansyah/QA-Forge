import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  settings?: Record<string, any>;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  updateUserSettings: (settings: Record<string, any>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUserSettings: (settings) =>
        set((state) => ({
          user: state.user ? { ...state.user, settings: { ...state.user.settings, ...settings } } : null,
        })),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'qaforge-auth-storage',
    }
  )
);
