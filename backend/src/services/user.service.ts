import { prisma } from '../config/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { AppError } from '../utils/appError';
import { UpdateProfileInput, ChangePasswordInput } from '../schemas/user.schema';
import { parsePagination, createPaginatedResult } from '../utils/pagination';

export class UserService {
  public async getProfile(userId: number) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND');
    }

    return user;
  }

  public async updateProfile(userId: number, input: UpdateProfileInput) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  public async changePassword(userId: number, input: ChangePasswordInput) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await comparePassword(input.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('كلمة المرور الحالية غير صحيحة', 400, 'INVALID_CURRENT_PASSWORD');
    }

    const newPasswordHash = await hashPassword(input.newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      // Invalidate all previous refresh sessions
      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'USER_PASSWORD_CHANGE',
          module: 'user',
        },
      });
    });

    return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
  }

  public async getNotifications(userId: number, page?: string, limit?: string) {
    const pagination = parsePagination(page, limit);

    // Strictly restricted by userId [7.12]
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return createPaginatedResult(notifications, total, pagination);
  }

  public async markNotificationAsRead(userId: number, notificationId: number) {
    // Strictly restricted by userId to prevent IDOR [7.12]
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new AppError('الإشعار غير موجود أو لا تملك حق الوصول إليه', 404, 'NOTIFICATION_NOT_FOUND');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    return { success: true, message: 'تم تحديد الإشعار كمقروء' };
  }

  public async getUserDashboardSummary(userId: number) {
    // Strictly scoped to the user
    const [unreadCount, totalNotifications, recentLogs] = await Promise.all([
      prisma.notification.count({ where: { userId, readAt: null } }),
      prisma.notification.count({ where: { userId } }),
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, action: true, createdAt: true, ipAddress: true },
      }),
    ]);

    return {
      unreadNotifications: unreadCount,
      totalNotifications,
      recentActivity: recentLogs,
    };
  }
}

export const userService = new UserService();
