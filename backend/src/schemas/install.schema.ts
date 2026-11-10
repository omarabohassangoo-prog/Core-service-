import { z } from 'zod';

export const installSetupSchema = z.object({
  siteName: z.string().min(2, 'اسم الموقع يجب ألا يقل عن حرفين').max(100),
  siteUrl: z.string().url('الرابط يجب أن يكون عنوان URL صالحاً'),
  adminEmail: z.string().email('البريد الإلكتروني غير صالح'),
  adminPassword: z
    .string()
    .min(8, 'كلمة المرور يجب أن لا تقل عن 8 أحرف')
    .regex(/[A-Z]/, 'يجب أن تحتوي كلمة المرور على حرف كبير على الأقل')
    .regex(/[0-9]/, 'يجب أن تحتوي كلمة المرور على رقم على الأقل'),
  adminFirstName: z.string().min(2, 'الاسم الأول يجب أن لا يقل عن حرفين'),
  adminLastName: z.string().min(2, 'الاسم الأخير يجب أن لا يقل عن حرفين'),
  adminPhone: z.string().optional(),
});

export type InstallSetupInput = z.infer<typeof installSetupSchema>;
