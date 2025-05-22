import { useState } from 'react';
import axios from 'axios';

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      username: string;
      email: string;
      role: string;
      isActive: number;
      createdAt: string;
      updatedAt: string;
      lastLogin: string | null;
    };
    accessToken: string;
    refreshToken: string;
  };
}

interface LoginError {
  message: string;
}

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post<LoginResponse>(`${baseURL}/auth/login`, {
        username: email,
        password,
      });

      setIsLoading(false);

      if (response.data.success) {
        // You might want to store the tokens in localStorage or a secure storage
        localStorage.setItem('accessToken', response.data.data.accessToken);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        return response.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setIsLoading(false);
      if (axios.isAxiosError(err) && err.response) {
        setError((err.response.data as LoginError).message || 'An error occurred during login');
      } else {
        setError('An unexpected error occurred');
      }
      return null;
    }
  };

  return { login, isLoading, error };
};

export default useLogin;