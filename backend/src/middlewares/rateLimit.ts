import rateLimit from 'express-rate-limit';

export const readLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح لطلبات القراءة. يرجى الانتظار قليلاً.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح للإرسال والتعديل. يرجى الانتظار قليلاً.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تم تجاوز عدد محاولات الدخول المسموحة. يرجى المحاولة بعد 15 دقيقة.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});
