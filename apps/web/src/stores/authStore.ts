import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Organization } from '@agencyos/shared';
import { api } from '../lib/api';
import { getSocket, disconnectSocket } from '../lib/socket';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, organization: Organization, accessToken: string, refreshToken?: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      organization: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, organization, accessToken, refreshToken) => {
        api.setToken(accessToken);
        getSocket(accessToken);
        set({
          user,
          organization,
          accessToken,
          refreshToken: refreshToken !== undefined ? refreshToken : get().refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (e) {
          // ignore error on logout
        } finally {
          api.setToken(null);
          disconnectSocket();
          set({
            user: null,
            organization: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      checkAuth: async () => {
        try {
          const currentToken = get().accessToken;
          if (currentToken) {
            api.setToken(currentToken);
          }

          const res = await api.get<{ user: User; organization: Organization }>('/auth/me');
          if (res?.user) {
            set({
              user: res.user,
              organization: res.organization,
              isAuthenticated: true,
              isLoading: false,
            });
            if (currentToken) {
              getSocket(currentToken);
            }
          } else {
            set({ user: null, organization: null, accessToken: null, isAuthenticated: false, isLoading: false });
          }
        } catch (err) {
          // Try to refresh token
          try {
            const currentRefresh = get().refreshToken;
            const refreshRes = await api.post<{ accessToken: string; refreshToken?: string }>('/auth/refresh', {
              refreshToken: currentRefresh,
            });
            if (refreshRes?.accessToken) {
              api.setToken(refreshRes.accessToken);
              const meRes = await api.get<{ user: User; organization: Organization }>('/auth/me');
              set({
                user: meRes.user,
                organization: meRes.organization,
                accessToken: refreshRes.accessToken,
                refreshToken: refreshRes.refreshToken || currentRefresh,
                isAuthenticated: true,
                isLoading: false,
              });
              getSocket(refreshRes.accessToken);
              return;
            }
          } catch (refreshErr) {
            // refresh failed
          }

          set({
            user: null,
            organization: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'agencyos-auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        organization: state.organization,
      }),
    }
  )
);
