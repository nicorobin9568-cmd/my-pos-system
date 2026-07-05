import { create } from 'zustand';
import type { Profile, Tenant } from '@/types';

interface AuthState {
  profile: Profile | null;
  tenant: Tenant | null;
  setProfile: (profile: Profile | null) => void;
  setTenant: (tenant: Tenant | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  tenant: null,
  setProfile: (profile) => set({ profile }),
  setTenant: (tenant) => set({ tenant }),
  clear: () => set({ profile: null, tenant: null }),
}));
