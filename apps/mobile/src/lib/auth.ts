import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
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
  login: (tenantCode: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  init: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  login: async (tenantCode, email, password) => {
    const { access_token, user } = await authApi.login(tenantCode, email, password);
    await SecureStore.setItemAsync('access_token', access_token);
    set({ user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    set({ user: null });
  },

  init: async () => {
    const token = await SecureStore.getItemAsync('access_token');
    if (!token) { set({ isLoading: false }); return; }
    try {
      const user = await authApi.me();
      set({ user, isLoading: false });
    } catch {
      await SecureStore.deleteItemAsync('access_token');
      set({ user: null, isLoading: false });
    }
  },
}));
