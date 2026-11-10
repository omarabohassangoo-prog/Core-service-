import { z } from 'zod';

export const contactMessageSchema = z.object({
  name: z.string().min(2, 'الاسم يجب ألا يقل عن حرفين').max(100),
  email: z.string().email('البريد الإلكتروني غير صالح').toLowerCase().trim(),
  phone: z.string().max(20).optional(),
  subject: z.string().min(3, 'الموضوع يجب ألا يقل عن 3 أحرف').max(200),
  message: z.string().min(10, 'الرسالة يجب أن لا تقل عن 10 أحرف').max(2000),
});

export const pageSlugParamSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'معرف الصفحة غير صالح'),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
export type PageSlugParamInput = z.infer<typeof pageSlugParamSchema>;
