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
  firstName: string;
  lastName: string;
  role: {
    id: number;
    name: string;
    slug: string;
  };
  permissions: string[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  redirectPath: string;
}

export interface UserItem {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  roleId: number;
  failedLoginAttempts: number;
  lockedUntil?: string | null;
  emailVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  role: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface RoleItem {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  isSystem: boolean;
  createdAt: string;
  permissions: Array<{
    permission: {
      id: number;
      slug: string;
      module: string;
      description: string;
    };
  }>;
  _count?: {
    users: number;
  };
}

export interface PermissionItem {
  id: number;
  slug: string;
  module: string;
  description: string;
}

export interface SettingItem {
  id: number;
  key: string;
  value: string;
  group: string;
  isSecret: boolean;
  isSystem: boolean;
  description?: string | null;
  updatedAt: string;
  hasConfiguredValue?: boolean;
}

export interface PageItem {
  id: number;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogItem {
  id: number;
  userId?: number | null;
  action: string;
  module: string;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  readAt?: string | null;
  createdAt: string;
}

export interface SystemHealthData {
  status: string;
  uptime: {
    seconds: number;
    formatted: string;
  };
  database: {
    status: string;
    latencyMs: number;
  };
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
  };
  statistics: {
    totalUsers: number;
    activeUsers: number;
    totalPages: number;
    totalMessages: number;
    auditLogsCount: number;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
