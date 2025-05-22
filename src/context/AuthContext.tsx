import React, { createContext, useState, useContext, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthUser } from '@/types/api';

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (user: AuthUser, accessToken: string) => void;
  logout: () => void;
  user: AuthUser | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    accessToken: string | null;
    user: AuthUser | null;
  }>(() => ({
    isAuthenticated: localStorage.getItem('accessToken') !== null,
    accessToken: localStorage.getItem('accessToken'),
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  }));
  const navigate = useNavigate();

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

  const refreshToken = async (): Promise<boolean> => {
    try {
      // Implement your token refresh logic here
      // This is just a placeholder implementation
      const response = await axios.post('/api/refresh-token');
      const newToken = response.data.accessToken;
      const user = response.data?.user;
      login(user, newToken);
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  };

  const login = (user: AuthUser, accessToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthState({ isAuthenticated: true, accessToken, user: user });
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setAuthState({ isAuthenticated: false, accessToken: null, user: null });
  };

  const value = {
    isAuthenticated: authState.isAuthenticated,
    accessToken: authState.accessToken,
    login,
    logout,
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