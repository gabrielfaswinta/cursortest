import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'user' | 'business' | 'artist' | 'admin';
  avatar?: string;
  isVerified: boolean;
  businessInfo?: {
    companyName: string;
    businessType: string;
    licenseStatus: 'pending' | 'active' | 'suspended' | 'expired';
    lmkRegistrationNumber?: string;
    subscriptionPlan: 'basic' | 'premium' | 'enterprise';
    maxSimultaneousPlays: number;
    address?: {
      street: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
    };
  };
  artistInfo?: {
    stageName: string;
    genre: string[];
    lmkMemberNumber?: string;
    bankAccount?: {
      accountName: string;
      accountNumber: string;
      bankName: string;
    };
  };
  preferences: {
    language: string;
    timezone: string;
  };
  lastLogin?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user: User) =>
        set(() => ({
          user,
          isAuthenticated: true,
        })),

      setToken: (token: string) =>
        set(() => ({
          token,
        })),

      login: (user: User, token: string) =>
        set(() => ({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })),

      logout: () =>
        set(() => ({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })),

      setLoading: (loading: boolean) =>
        set(() => ({
          isLoading: loading,
        })),

      updateUser: (updates: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);