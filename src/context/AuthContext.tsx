import React, { createContext, useState, useContext, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthUser } from '@/types/api';
import { apiClient } from '@/api/client';
import { clearTelemetryUser, setTelemetryUser } from '@/lib/telemetry';

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (user: AuthUser, accessToken: string, rememberMe?: boolean) => void;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  user: AuthUser | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getStoredAuth = (): { accessToken: string | null; user: AuthUser | null; storage: "local" | "session" | null } => {
    const localToken = localStorage.getItem("accessToken");
    const sessionToken = sessionStorage.getItem("accessToken");
    const storage: "local" | "session" | null = localToken ? "local" : sessionToken ? "session" : null;
    const token = localToken ?? sessionToken ?? null;
    const userRaw =
      storage === "local"
        ? localStorage.getItem("user")
        : storage === "session"
          ? sessionStorage.getItem("user")
          : null;
    const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null;
    return { accessToken: token, user, storage };
  };

  const storageFor = (rememberMe: boolean) => (rememberMe ? localStorage : sessionStorage);

  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    accessToken: string | null;
    user: AuthUser | null;
    storage: "local" | "session" | null;
  }>(() => {
    const stored = getStoredAuth();
    return {
      isAuthenticated: stored.accessToken !== null,
      accessToken: stored.accessToken,
      user: stored.user,
      storage: stored.storage,
    };
  });
  const navigate = useNavigate();

  // Attach user context to telemetry (Sentry), if enabled.
  useEffect(() => {
    const u = authState.user;
    if (!authState.isAuthenticated || !u) {
      clearTelemetryUser();
      return;
    }
    setTelemetryUser({
      id: u.id,
      username: u.username,
      email: u.email,
      role: (u as any).role,
    });
  }, [authState.isAuthenticated, authState.user]);

  useEffect(() => {
    if (authState.accessToken) {
      // Set up axios interceptor for adding the token to requests
      const requestInterceptor = axios.interceptors.request.use((config) => {
        config.headers.Authorization = `Bearer ${authState.accessToken}`;
        return config;
      });



      // Response interceptor
      const responseInterceptor = axios.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
          if (error.response?.status === 403) {
            // Try to refresh the token
            const refreshed = await refreshToken();
            if (refreshed && error.config) {
              // Retry the original request with the new token
              return axios(error.config);
            } else {
              // If refresh failed, logout and redirect to login page
              logout();
              navigate('/login');
            }
          }
          return Promise.reject(error);
        }
      );

      // Clean up the interceptor when the component unmounts or the token changes
      return () => {
        axios.interceptors.request.eject(requestInterceptor);
        axios.interceptors.response.eject(responseInterceptor);
      };
    }
  }, [authState.accessToken, navigate]);

  // Ensure we always have up-to-date permissions in localStorage/user state
  useEffect(() => {
    const hasPerms = Array.isArray(authState.user?.permissions) && authState.user!.permissions!.length > 0;
    if (!authState.accessToken || hasPerms === true) return;

    let cancelled = false;
    (async () => {
      try {
        const resp = await apiClient.get("/auth/profile");
        const u = resp?.data?.data as AuthUser | undefined;
        if (!u || cancelled) return;
        // preserve existing role/fields if backend returns partial
        const merged: AuthUser = { ...(authState.user ?? ({} as any)), ...u };
        const store = authState.storage === "session" ? sessionStorage : localStorage;
        store.setItem("user", JSON.stringify(merged));
        setAuthState((prev) => ({ ...prev, user: merged }));
      } catch {
        // ignore; UI will treat as no permissions and backend will still enforce
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.accessToken]);

  const refreshToken = async (): Promise<boolean> => {
    try {
      // Implement your token refresh logic here
      // This is just a placeholder implementation
      const response = await axios.post('/api/refresh-token');
      const newToken = response.data.accessToken;
      const user = response.data?.user;
      login(user, newToken, authState.storage === "session" ? false : true);
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  };

  const login = (user: AuthUser, accessToken: string, rememberMe: boolean = true) => {
    const store = storageFor(Boolean(rememberMe));
    const other = store === localStorage ? sessionStorage : localStorage;

    // Ensure we don't keep stale auth in the other storage
    other.removeItem("accessToken");
    other.removeItem("user");

    store.setItem("accessToken", accessToken);
    store.setItem("user", JSON.stringify(user));
    setAuthState({ isAuthenticated: true, accessToken, user: user, storage: rememberMe ? "local" : "session" });
  };

  const updateUser = (patch: Partial<AuthUser>) => {
    setAuthState((prev) => {
      const merged = { ...(prev.user ?? ({} as any)), ...patch } as AuthUser;
      const store = prev.storage === "session" ? sessionStorage : localStorage;
      store.setItem("user", JSON.stringify(merged));
      return { ...prev, user: merged };
    });
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");
    setAuthState({ isAuthenticated: false, accessToken: null, user: null, storage: null });
  };

  const value = {
    isAuthenticated: authState.isAuthenticated,
    accessToken: authState.accessToken,
    login,
    logout,
    updateUser,
    user: authState.user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};