import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from '../utils/jwt';
import { AppError } from '../utils/appError';
import { LoginInput, RegisterInput, ResetPasswordInput } from '../schemas/auth.schema';
import { logger } from '../utils/logger';

export interface AuthSuccessPayload {
  accessToken: string;
  refreshToken: string;
  user: {
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
  };
  redirectPath: string;
}

export class AuthService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  public async login(
    input: LoginInput,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuthSuccessPayload> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Unified error message for security [6.7]
    const invalidCredentialsError = new AppError('بيانات الدخول غير صحيحة', 401, 'INVALID_CREDENTIALS');

    if (!user || user.deletedAt !== null) {
      throw invalidCredentialsError;
    }

    // Check account lockout [6.8]
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000));
      throw new AppError(
        `تم قفل الحساب مؤقتاً بسبب تكرار المحاولات الخاطئة. يرجى المحاولة بعد ${remainingMinutes} دقيقة`,
        429,
        'ACCOUNT_LOCKED'
      );
    }

    if (user.status === 'SUSPENDED') {
      throw new AppError('تم إيقاف هذا الحساب. يرجى مراجعة إدارة النظام', 403, 'ACCOUNT_SUSPENDED');
    }

    const isMatch = await comparePassword(input.password, user.passwordHash);

    if (!isMatch) {
      const newAttempts = user.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;

      if (newAttempts >= this.MAX_FAILED_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MS);
        logger.warn('User account locked due to excessive failed attempts', {
          userId: user.id,
          email: user.email,
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil,
        },
      });

      throw invalidCredentialsError;
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    const permissions = user.role.permissions.map((rp) => rp.permission.slug);
    const tokenPayload = { sub: user.id, email: user.email };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);
    const tokenDigest = hashToken(refreshToken);

    // Save hashed refresh token in database [6.2]
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: tokenDigest,
        expiresAt: refreshExpiresAt,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });

    // Record login audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        module: 'auth',
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });

    const isStaff = ['super_admin', 'admin', 'editor'].includes(user.role.slug);
    const redirectPath = isStaff ? '/admin' : '/user';

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: {
          id: user.role.id,
          name: user.role.name,
          slug: user.role.slug,
        },
        permissions,
      },
      redirectPath,
    };
  }

  public async register(
    input: RegisterInput,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuthSuccessPayload> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new AppError('البريد الإلكتروني مسجل مسبقاً في النظام', 409, 'EMAIL_ALREADY_EXISTS');
    }

    const userRole = await prisma.role.findUnique({
      where: { slug: 'user' },
    });

    if (!userRole) {
      throw new AppError('الدور الافتراضي غير مهيأ في النظام', 500, 'DEFAULT_ROLE_MISSING');
    }

    const passwordHash = await hashPassword(input.password);

    const newUser = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        roleId: userRole.id,
        status: 'ACTIVE',
      },
      include: {
        role: true,
      },
    });

    // Auto welcome notification
    await prisma.notification.create({
      data: {
        userId: newUser.id,
        title: 'مرحباً بك في نظام Enterprise',
        message: 'تم تفعيل حسابك بنجاح. يمكنك استعراض خدماتك وملفك الشخصي الآن.',
        type: 'SUCCESS',
      },
    });

    const tokenPayload = { sub: newUser.id, email: newUser.email };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);
    const tokenDigest = hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        userId: newUser.id,
        tokenHash: tokenDigest,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: {
          id: newUser.role.id,
          name: newUser.role.name,
          slug: newUser.role.slug,
        },
        permissions: [],
      },
      redirectPath: '/user',
    };
  }

  public async refreshToken(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new AppError('توكن التجديد منتهي الصلاحية أو غير صالح', 401, 'INVALID_REFRESH_TOKEN');
    }

    const tokenDigest = hashToken(rawRefreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: tokenDigest },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt !== null || storedToken.expiresAt < new Date()) {
      throw new AppError('جلسة التجديد ملغاة أو منتهية', 401, 'REFRESH_TOKEN_EXPIRED');
    }

    // Revoke old token and issue new token pair (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const newPayload = { sub: storedToken.user.id, email: storedToken.user.email };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);
    const newDigest = hashToken(newRefreshToken);

    await prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        tokenHash: newDigest,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  public async logout(rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      const digest = hashToken(rawRefreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash: digest },
        data: { revokedAt: new Date() },
      });
    }
  }

  public async forgotPassword(email: string): Promise<{ message: string; debugToken?: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Never leak email existence
    if (!user || user.deletedAt !== null) {
      return { message: 'إذا كان البريد مسجلاً، فسيتم إرسال تعليمات إعادة التعيين إليه.' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    logger.info('Password reset initiated for user', { userId: user.id, email: user.email });

    return {
      message: 'إذا كان البريد مسجلاً، فسيتم إرسال تعليمات إعادة التعيين إليه.',
      // returned for development convenience when testing without mail server
      debugToken: rawToken,
    };
  }

  public async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenHash = hashToken(input.token);
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt !== null || resetRecord.expiresAt < new Date()) {
      throw new AppError('رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية', 400, 'INVALID_RESET_TOKEN');
    }

    const newHash = await hashPassword(input.password);

    await prisma.$transaction(async (tx) => {
      // 1. Update password
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash: newHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      // 2. Mark token used
      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });

      // 3. Invalidate ALL sessions for this user [6.9]
      await tx.refreshToken.updateMany({
        where: { userId: resetRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      // 4. Log event
      await tx.auditLog.create({
        data: {
          userId: resetRecord.userId,
          action: 'PASSWORD_RESET',
          module: 'auth',
        },
      });
    });
  }

  public async getCurrentUser(userId: number): Promise<AuthSuccessPayload['user']> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND');
    }

    const permissions = user.role.permissions.map((rp) => rp.permission.slug);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: {
        id: user.role.id,
        name: user.role.name,
        slug: user.role.slug,
      },
      permissions,
    };
  }
}

export const authService = new AuthService();
