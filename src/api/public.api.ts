import { apiClient } from './client';
import { ApiResponse, PageItem } from '../types';

export const publicApi = {
  getPage: async (slug: string): Promise<ApiResponse<PageItem>> => {
    const res = await apiClient.get<ApiResponse<PageItem>>(`/public/pages/${slug}`);
    return res.data;
  },

  listPages: async (): Promise<ApiResponse<Array<Pick<PageItem, 'id' | 'slug' | 'title'>>>> => {
    const res = await apiClient.get<ApiResponse<Array<Pick<PageItem, 'id' | 'slug' | 'title'>>>>(
      '/public/pages'
    );
    return res.data;
  },

  submitContact: async (data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }): Promise<ApiResponse<{ messageId: number }>> => {
    const res = await apiClient.post<ApiResponse<{ messageId: number }>>('/public/contact', data);
    return res.data;
  },

  getSettings: async (): Promise<ApiResponse<Record<string, string>>> => {
    const res = await apiClient.get<ApiResponse<Record<string, string>>>('/public/settings');
    return res.data;
  },
};
