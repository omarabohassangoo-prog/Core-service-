import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح').toLowerCase().trim(),
  password: z.string().min(8, 'كلمة المرور يجب أن لا تقل عن 8 أحرف'),
  firstName: z.string().min(2, 'الاسم الأول مطلوب'),
  lastName: z.string().min(2, 'الاسم الأخير مطلوب'),
  phone: z.string().optional(),
  roleId: z.number().int().positive('معرف الدور غير صالح'),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']).default('ACTIVE'),
});

export const updateUserSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح').toLowerCase().trim().optional(),
  password: z.string().min(8).optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  roleId: z.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']).optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  roleId: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.enum(['id', 'createdAt', 'email', 'firstName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createRoleSchema = z.object({
  name: z.string().min(2, 'اسم الدور مطلوب'),
  slug: z.string().min(2).regex(/^[a-z0-9_]+$/, 'معرف الدور يجب أن يكون أحرفاً وأرقاماً فقط'),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export const updateSettingSchema = z.object({
  value: z.string(),
});

export const testServiceSchema = z.object({
  serviceType: z.enum(['email', 'sms', 'whatsapp', 'paypal', 'storage']),
  target: z.string().optional(),
});

export const createPageSchema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  title: z.string().min(2),
  content: z.string().min(5),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isPublished: z.boolean().default(true),
});

export const updatePageSchema = createPageSchema.partial();

export const factoryResetSchema = z.object({
  confirmText: z.literal('RESET', {
    message: 'يجب كتابة كلمة RESET لتأكيد إعادة ضبط المصنع',
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
export type TestServiceInput = z.infer<typeof testServiceSchema>;
export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type FactoryResetInput = z.infer<typeof factoryResetSchema>;
