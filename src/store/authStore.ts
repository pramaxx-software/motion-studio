import { create } from 'zustand';
import type { User } from '../types/auth';

type ViewMode = 'login' | 'dashboard' | 'editor';

interface AuthStore {
  user: User | null;
  token: string | null;
  currentView: ViewMode;

  setAuth: (user: User | null, token: string | null) => void;
  setView: (view: ViewMode) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: JSON.parse(localStorage.getItem('plm_user') || 'null'),
  token: localStorage.getItem('plm_token') || null,
  currentView: localStorage.getItem('plm_token') ? 'dashboard' : 'login',

  setAuth: (user, token) => {
    if (token && user) {
      localStorage.setItem('plm_token', token);
      localStorage.setItem('plm_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('plm_token');
      localStorage.removeItem('plm_user');
    }
    set({ user, token, currentView: token ? 'dashboard' : 'login' });
  },

  setView: (currentView) => set({ currentView }),

  logout: () => {
    localStorage.removeItem('plm_token');
    localStorage.removeItem('plm_user');
    set({ user: null, token: null, currentView: 'login' });
  },
}));