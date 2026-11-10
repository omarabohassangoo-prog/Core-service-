import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح').toLowerCase().trim(),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const registerSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'كلمة المرور يجب أن لا تقل عن 8 أحرف')
    .regex(/[A-Z]/, 'يجب أن تحتوي كلمة المرور على حرف كبير')
    .regex(/[0-9]/, 'يجب أن تحتوي كلمة المرور على رقم'),
  firstName: z.string().min(2, 'الاسم الأول مطلوب'),
  lastName: z.string().min(2, 'الاسم الأخير مطلوب'),
  phone: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'رمز الاستعادة غير صالح'),
  password: z
    .string()
    .min(8, 'كلمة المرور يجب أن لا تقل عن 8 أحرف')
    .regex(/[A-Z]/, 'يجب أن تحتوي كلمة المرور على حرف كبير')
    .regex(/[0-9]/, 'يجب أن تحتوي كلمة المرور على رقم'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'توكن التجديد مطلوب'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
