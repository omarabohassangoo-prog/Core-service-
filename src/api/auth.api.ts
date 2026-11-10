import { apiClient } from './client';
import { ApiResponse, AuthSession, AuthUser } from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<AuthSession>> => {
    const res = await apiClient.post<ApiResponse<AuthSession>>('/auth/login', { email, password });
    return res.data;
  },

  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<ApiResponse<AuthSession>> => {
    const res = await apiClient.post<ApiResponse<AuthSession>>('/auth/register', data);
    return res.data;
  },

  logout: async (refreshToken?: string): Promise<ApiResponse> => {
    const res = await apiClient.post<ApiResponse>('/auth/logout', { refreshToken });
    return res.data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<{ debugToken?: string }>> => {
    const res = await apiClient.post<ApiResponse<{ debugToken?: string }>>('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (token: string, password: string): Promise<ApiResponse> => {
    const res = await apiClient.post<ApiResponse>('/auth/reset-password', { token, password });
    return res.data;
  },

  me: async (): Promise<ApiResponse<AuthUser>> => {
    const res = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
    return res.data;
  },
};
