export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
  requestId?: string;
  errors?: Record<string, string[]>;
}

export interface AuthUser {
  id: number;
  email: string;
  roleId: number;
  roleSlug: string;
  permissions: string[];
}
