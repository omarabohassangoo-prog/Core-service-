import { apiClient } from './client';
import { ApiResponse } from '../types';

export interface InstallInput {
  siteName: string;
  siteUrl: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  adminPhone?: string;
}

export const installApi = {
  getStatus: async (): Promise<ApiResponse<{ isInstalled: boolean; installedAt?: string }>> => {
    const res = await apiClient.get<ApiResponse<{ isInstalled: boolean; installedAt?: string }>>(
      '/install/status'
    );
    return res.data;
  },

  setup: async (input: InstallInput): Promise<ApiResponse> => {
    const res = await apiClient.post<ApiResponse>('/install/setup', input);
    return res.data;
  },
};
