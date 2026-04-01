'use client';

import { create } from 'zustand';
import { apiFetch } from '@/lib/api';
import { clearToken, getToken, saveToken } from '@/lib/token';

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: 'CUSTOMER' | 'ADMIN';
};

type AuthResponse = {
  token: string;
  user: AdminUser;
};

type AuthStore = {
  hydrated: boolean;
  isAuthenticated: boolean;
  user: AdminUser | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  hydrated: false,
  isAuthenticated: false,
  user: null,

  hydrate: async () => {
    try {
      const token =
        typeof window !== 'undefined' ? getToken() : null;

      if (!token) {
        set({
          hydrated: true,
          isAuthenticated: false,
          user: null,
        });
        return;
      }

      const user = await apiFetch<AdminUser>('/auth/me');

      set({
        hydrated: true,
        isAuthenticated: true,
        user,
      });
    } catch {
      if (typeof window !== 'undefined') {
        clearToken();
      }

      set({
        hydrated: true,
        isAuthenticated: false,
        user: null,
      });
    }
  },

  login: async (email, password) => {
    const data = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    saveToken(data.token);

    set({
      hydrated: true,
      isAuthenticated: true,
      user: data.user,
    });
  },

  logout: () => {
    clearToken();

    set({
      hydrated: true,
      isAuthenticated: false,
      user: null,
    });
  },
}));