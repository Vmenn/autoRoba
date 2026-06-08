'use client';

import { create } from 'zustand';
import { authApi } from './api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  roles: string[];
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  init: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  login: async (email, password) => {
    const { access_token, user } = await authApi.login(email, password);
    localStorage.setItem('access_token', access_token);
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null });
    window.location.href = '/login';
  },

  init: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const user = await authApi.me();
      set({ user, isLoading: false });
    } catch {
      localStorage.removeItem('access_token');
      set({ user: null, isLoading: false });
    }
  },
}));
