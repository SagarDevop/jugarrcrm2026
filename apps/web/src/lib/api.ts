import { ApiResponse } from '@agencyos/shared';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private accessToken: string | null = null;
  private isRefreshing: boolean = false;

  setToken(token: string | null) {
    this.accessToken = token;
  }

  getToken(): string | null {
    if (!this.accessToken) {
      try {
        const stored = localStorage.getItem('agencyos-auth-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          this.accessToken = parsed?.state?.accessToken || null;
        }
      } catch (e) {}
    }
    return this.accessToken;
  }

  async request<T = any>(endpoint: string, options: RequestInit & { _isRetry?: boolean } = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // sends cookies
    });

    // Handle 401 Unauthorized by attempting to refresh token
    if (
      response.status === 401 &&
      !options._isRetry &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/refresh')
    ) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        try {
          const authStorage = localStorage.getItem('agencyos-auth-storage');
          let refreshToken: string | null = null;
          if (authStorage) {
            try {
              const parsed = JSON.parse(authStorage);
              refreshToken = parsed?.state?.refreshToken || null;
            } catch (e) {}
          }

          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newAccessToken = refreshData?.data?.accessToken;
            if (newAccessToken) {
              this.setToken(newAccessToken);
              if (authStorage) {
                try {
                  const parsed = JSON.parse(authStorage);
                  parsed.state.accessToken = newAccessToken;
                  if (refreshData?.data?.refreshToken) {
                    parsed.state.refreshToken = refreshData.data.refreshToken;
                  }
                  localStorage.setItem('agencyos-auth-storage', JSON.stringify(parsed));
                } catch (e) {}
              }
              this.isRefreshing = false;
              // Retry original request with new token
              return this.request<T>(endpoint, { ...options, _isRetry: true });
            }
          }
        } catch (refreshErr) {
          // Refresh failed
        } finally {
          this.isRefreshing = false;
        }

        // If refresh failed or was unauthorized, clear auth and redirect to login
        this.setToken(null);
        localStorage.removeItem('agencyos-auth-storage');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    const data: ApiResponse<T> = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      (error as any).errors = data.errors;
      (error as any).status = response.status;
      throw error;
    }

    return data.data as T;
  }

  get<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
