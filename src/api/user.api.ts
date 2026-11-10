import { apiClient } from './client';
import { ApiResponse, PaginatedResult, NotificationItem, UserItem } from '../types';

export const userApi = {
  getProfile: async (): Promise<ApiResponse<UserItem>> => {
    const res = await apiClient.get<ApiResponse<UserItem>>('/user/profile');
    return res.data;
  },

  updateProfile: async (data: {
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<ApiResponse<UserItem>> => {
    const res = await apiClient.put<ApiResponse<UserItem>>('/user/profile', data);
    return res.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse> => {
    const res = await apiClient.post<ApiResponse>('/user/change-password', data);
    return res.data;
  },

  getNotifications: async (
    page = 1,
    limit = 15
  ): Promise<ApiResponse<PaginatedResult<NotificationItem>>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResult<NotificationItem>>>(
      '/user/notifications',
      { params: { page, limit } }
    );
    return res.data;
  },

  markNotificationAsRead: async (id: number): Promise<ApiResponse> => {
    const res = await apiClient.put<ApiResponse>(`/user/notifications/${id}/read`);
    return res.data;
  },

  getSummary: async (): Promise<
    ApiResponse<{
      unreadNotifications: number;
      totalNotifications: number;
      recentActivity: Array<{ id: number; action: string; createdAt: string; ipAddress?: string }>;
    }>
  > => {
    const res = await apiClient.get<
      ApiResponse<{
        unreadNotifications: number;
        totalNotifications: number;
        recentActivity: Array<{ id: number; action: string; createdAt: string; ipAddress?: string }>;
      }>
    >('/user/summary');
    return res.data;
  },
};
