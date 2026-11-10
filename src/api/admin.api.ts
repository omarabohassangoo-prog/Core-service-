import { apiClient } from './client';
import {
  ApiResponse,
  PaginatedResult,
  UserItem,
  RoleItem,
  PermissionItem,
  SettingItem,
  PageItem,
  AuditLogItem,
  SystemHealthData,
} from '../types';

export const adminApi = {
  // Users
  listUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    roleId?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<PaginatedResult<UserItem>>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResult<UserItem>>>('/admin/users', { params });
    return res.data;
  },

  getUser: async (id: number): Promise<ApiResponse<UserItem>> => {
    const res = await apiClient.get<ApiResponse<UserItem>>(`/admin/users/${id}`);
    return res.data;
  },

  createUser: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roleId: number;
    status: string;
  }): Promise<ApiResponse<UserItem>> => {
    const res = await apiClient.post<ApiResponse<UserItem>>('/admin/users', data);
    return res.data;
  },

  updateUser: async (
    id: number,
    data: {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      roleId?: number;
      status?: string;
    }
  ): Promise<ApiResponse<UserItem>> => {
    const res = await apiClient.put<ApiResponse<UserItem>>(`/admin/users/${id}`, data);
    return res.data;
  },

  deleteUser: async (id: number): Promise<ApiResponse> => {
    const res = await apiClient.delete<ApiResponse>(`/admin/users/${id}`);
    return res.data;
  },

  // Roles & Permissions
  listRoles: async (): Promise<ApiResponse<RoleItem[]>> => {
    const res = await apiClient.get<ApiResponse<RoleItem[]>>('/admin/roles');
    return res.data;
  },

  listPermissions: async (): Promise<ApiResponse<PermissionItem[]>> => {
    const res = await apiClient.get<ApiResponse<PermissionItem[]>>('/admin/permissions');
    return res.data;
  },

  createRole: async (data: {
    name: string;
    slug: string;
    description?: string;
    permissions: string[];
  }): Promise<ApiResponse<RoleItem>> => {
    const res = await apiClient.post<ApiResponse<RoleItem>>('/admin/roles', data);
    return res.data;
  },

  updateRole: async (
    id: number,
    data: {
      name?: string;
      description?: string;
      permissions?: string[];
    }
  ): Promise<ApiResponse<RoleItem>> => {
    const res = await apiClient.put<ApiResponse<RoleItem>>(`/admin/roles/${id}`, data);
    return res.data;
  },

  // Settings
  listSettings: async (group?: string): Promise<ApiResponse<SettingItem[]>> => {
    const res = await apiClient.get<ApiResponse<SettingItem[]>>('/admin/settings', {
      params: { group },
    });
    return res.data;
  },

  updateSetting: async (key: string, value: string): Promise<ApiResponse<SettingItem>> => {
    const res = await apiClient.put<ApiResponse<SettingItem>>(`/admin/settings/${key}`, { value });
    return res.data;
  },

  testService: async (serviceType: string): Promise<ApiResponse<{ connected: boolean; message: string }>> => {
    const res = await apiClient.post<ApiResponse<{ connected: boolean; message: string }>>(
      '/admin/services/test',
      { serviceType }
    );
    return res.data;
  },

  // Pages
  listPages: async (): Promise<ApiResponse<PageItem[]>> => {
    const res = await apiClient.get<ApiResponse<PageItem[]>>('/admin/pages');
    return res.data;
  },

  createPage: async (data: {
    slug: string;
    title: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    isPublished: boolean;
  }): Promise<ApiResponse<PageItem>> => {
    const res = await apiClient.post<ApiResponse<PageItem>>('/admin/pages', data);
    return res.data;
  },

  updatePage: async (id: number, data: Partial<PageItem>): Promise<ApiResponse<PageItem>> => {
    const res = await apiClient.put<ApiResponse<PageItem>>(`/admin/pages/${id}`, data);
    return res.data;
  },

  deletePage: async (id: number): Promise<ApiResponse> => {
    const res = await apiClient.delete<ApiResponse>(`/admin/pages/${id}`);
    return res.data;
  },

  // Audit Logs
  listAuditLogs: async (page = 1, limit = 20, module?: string): Promise<ApiResponse<PaginatedResult<AuditLogItem>>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResult<AuditLogItem>>>('/admin/audit-logs', {
      params: { page, limit, module },
    });
    return res.data;
  },

  // Health
  getHealth: async (): Promise<ApiResponse<SystemHealthData>> => {
    const res = await apiClient.get<ApiResponse<SystemHealthData>>('/admin/health');
    return res.data;
  },

  // Backups
  listBackups: async (): Promise<ApiResponse<Array<{ filename: string; sizeBytes: number; createdAt: string }>>> => {
    const res = await apiClient.get<ApiResponse<Array<{ filename: string; sizeBytes: number; createdAt: string }>>>(
      '/admin/backups'
    );
    return res.data;
  },

  createBackup: async (): Promise<ApiResponse<{ filename: string; sizeBytes: number; createdAt: string }>> => {
    const res = await apiClient.post<ApiResponse<{ filename: string; sizeBytes: number; createdAt: string }>>(
      '/admin/backups'
    );
    return res.data;
  },

  restoreBackup: async (filename: string, confirmCode: string): Promise<ApiResponse> => {
    const res = await apiClient.post<ApiResponse>('/admin/backups/restore', { filename, confirmCode });
    return res.data;
  },

  // Factory Reset
  factoryReset: async (confirmText: string): Promise<ApiResponse> => {
    const res = await apiClient.post<ApiResponse>('/admin/system/reset', { confirmText });
    return res.data;
  },

  // Appendix A: Users Advanced Actions
  bulkUserAction: async (
    action: 'delete' | 'status' | 'role' | 'suspend',
    userIds: number[],
    extraValue?: string | number
  ): Promise<ApiResponse> => {
    const res = await apiClient.post<ApiResponse>('/admin/users/bulk-action', {
      action,
      userIds,
      extraValue,
    });
    return res.data;
  },

  impersonateUser: async (id: number): Promise<ApiResponse<any>> => {
    const res = await apiClient.post<ApiResponse<any>>(`/admin/users/${id}/impersonate`);
    return res.data;
  },

  unlockUser: async (id: number): Promise<ApiResponse> => {
    const res = await apiClient.post<ApiResponse>(`/admin/users/${id}/unlock`);
    return res.data;
  },

  adminChangePassword: async (id: number, password: string): Promise<ApiResponse> => {
    const res = await apiClient.post<ApiResponse>(`/admin/users/${id}/change-password`, { password });
    return res.data;
  },

  exportUsers: async (params?: any): Promise<Blob> => {
    const res = await apiClient.get('/admin/users/export', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },

  // Appendix A: KPIs, Charts & Alerts
  getDashboardKPIs: async (): Promise<ApiResponse<any>> => {
    const res = await apiClient.get<ApiResponse<any>>('/admin/dashboard/kpis');
    return res.data;
  },

  getDashboardCharts: async (): Promise<ApiResponse<any>> => {
    const res = await apiClient.get<ApiResponse<any>>('/admin/dashboard/charts');
    return res.data;
  },

  getSmartAlerts: async (): Promise<ApiResponse<any[]>> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/dashboard/smart-alerts');
    return res.data;
  },

  // Appendix A: Templates & Notifications
  listTemplates: async (type?: string): Promise<ApiResponse<any[]>> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/templates', { params: { type } });
    return res.data;
  },

  getTemplate: async (key: string): Promise<ApiResponse<any>> => {
    const res = await apiClient.get<ApiResponse<any>>(`/admin/templates/${key}`);
    return res.data;
  },

  updateTemplate: async (key: string, data: { title?: string; content?: string; channels?: string }): Promise<ApiResponse<any>> => {
    const res = await apiClient.put<ApiResponse<any>>(`/admin/templates/${key}`, data);
    return res.data;
  },

  sendAdminNotification: async (data: {
    recipientType: 'single' | 'role' | 'all';
    targetId?: number;
    roleId?: number;
    channel: 'inapp' | 'email' | 'sms' | 'whatsapp';
    title: string;
    message: string;
  }): Promise<ApiResponse> => {
    const res = await apiClient.post<ApiResponse>('/admin/notifications/send', data);
    return res.data;
  },

  // Appendix A: Sessions, Cache, Maintenance
  listSessions: async (): Promise<ApiResponse<any[]>> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/sessions');
    return res.data;
  },

  terminateSession: async (id: number): Promise<ApiResponse> => {
    const res = await apiClient.delete<ApiResponse>(`/admin/sessions/${id}`);
    return res.data;
  },

  terminateAllUserSessions: async (userId: number): Promise<ApiResponse> => {
    const res = await apiClient.delete<ApiResponse>(`/admin/sessions/user/${userId}`);
    return res.data;
  },

  clearCache: async (type: 'memory' | 'settings'): Promise<ApiResponse> => {
    const res = await apiClient.post<ApiResponse>('/admin/system/cache/clear', { type });
    return res.data;
  },

  toggleMaintenance: async (enabled: boolean, message?: string): Promise<ApiResponse> => {
    const res = await apiClient.post<ApiResponse>('/admin/system/maintenance', { enabled, message });
    return res.data;
  },

  clearAuditLogs: async (confirmCode: string): Promise<ApiResponse> => {
    const res = await apiClient.post<ApiResponse>('/admin/audit-logs/clear', { confirmCode });
    return res.data;
  },

  globalSearch: async (q: string): Promise<ApiResponse<{ users: any[]; pages: any[]; settings: any[] }>> => {
    const res = await apiClient.get<ApiResponse<{ users: any[]; pages: any[]; settings: any[] }>>('/admin/search', {
      params: { q },
    });
    return res.data;
  },
};
