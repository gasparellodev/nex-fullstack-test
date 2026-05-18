import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUserDto } from '@nex/shared';

interface AuthState {
  token: string | null;
  user: AuthUserDto | null;
  expiresIn: string | null;
  setSession: (params: { token: string; user: AuthUserDto; expiresIn: string }) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      expiresIn: null,
      setSession: ({ token, user, expiresIn }) => set({ token, user, expiresIn }),
      clear: () => set({ token: null, user: null, expiresIn: null }),
    }),
    {
      name: 'nex.auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        expiresIn: state.expiresIn,
      }),
    },
  ),
);

export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => Boolean(s.token));
}

export function useCurrentUser(): AuthUserDto | null {
  return useAuthStore((s) => s.user);
}
