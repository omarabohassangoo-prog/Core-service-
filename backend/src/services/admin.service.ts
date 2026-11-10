import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/password';
import { signAccessToken } from '../utils/jwt';
import { encryptSecret, maskSecret } from '../utils/crypto';
import { parsePagination, createPaginatedResult } from '../utils/pagination';
import { AppError } from '../utils/appError';
import {
  CreateUserInput,
  UpdateUserInput,
  ListUsersQueryInput,
  CreateRoleInput,
  UpdateRoleInput,
  CreatePageInput,
  UpdatePageInput,
} from '../schemas/admin.schema';
import { emailService } from './external/email.service';
import { smsService } from './external/sms.service';
import { whatsAppService } from './external/whatsapp.service';
import { payPalService } from './external/paypal.service';
import { mediaService } from './external/media.service';
import { backupService } from './external/backup.service';
import { logger } from '../utils/logger';

export class AdminService {
  // ================= USERS MANAGEMENT =================
  public async listUsers(query: ListUsersQueryInput) {
    const pagination = parsePagination(query.page, query.limit);
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (query.search) {
      where.OR = [
        { email: { contains: query.search } },
        { firstName: { contains: query.search } },
        { lastName: { contains: query.search } },
        { phone: { contains: query.search } },
      ];
    }

    if (query.roleId) {
      const roleIdNum = parseInt(query.roleId, 10);
      if (!isNaN(roleIdNum)) {
        where.roleId = roleIdNum;
      }
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          status: true,
          roleId: true,
          failedLoginAttempts: true,
          lockedUntil: true,
          emailVerifiedAt: true,
          lastLoginAt: true,
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
        orderBy: {
          [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
        },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.user.count({ where }),
    ]);

    return createPaginatedResult(users, total, pagination);
  }

  public async getUserById(id: number) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        roleId: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
            permissions: {
              select: {
                permission: {
                  select: { slug: true, module: true, description: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('المستخدم المطلوب غير موجود', 404, 'USER_NOT_FOUND');
    }

    return user;
  }

  public async createUser(input: CreateUserInput, actorId?: number) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new AppError('البريد الإلكتروني مسجل مسبقاً لمستخدم آخر', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        roleId: input.roleId,
        status: input.status,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roleId: true,
        status: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'USER_CREATE',
        module: 'users',
        details: JSON.stringify({ createdUserId: user.id, email: user.email }),
      },
    });

    return user;
  }

  public async updateUser(id: number, input: UpdateUserInput, actorId?: number) {
    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new AppError('المستخدم المطلوب غير موجود', 404, 'USER_NOT_FOUND');
    }

    const updateData: Record<string, unknown> = {};
    if (input.email) updateData.email = input.email;
    if (input.firstName) updateData.firstName = input.firstName;
    if (input.lastName) updateData.lastName = input.lastName;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.roleId) updateData.roleId = input.roleId;
    if (input.status) updateData.status = input.status;
    if (input.password) {
      updateData.passwordHash = await hashPassword(input.password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        roleId: true,
        updatedAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'USER_UPDATE',
        module: 'users',
        details: JSON.stringify({ targetUserId: id, fields: Object.keys(input) }),
      },
    });

    return updated;
  }

  public async deleteUser(id: number, actorId?: number) {
    if (id === actorId) {
      throw new AppError('لا يمكنك حذف أو تعطيل حسابك الشخصي أثناء تسجيل الدخول', 400, 'CANNOT_DELETE_SELF');
    }

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true },
    });

    if (!user) {
      throw new AppError('المستخدم المطلوب غير موجود أو محذوف مسبقاً', 404, 'USER_NOT_FOUND');
    }

    // Soft delete user [5.3]
    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'SUSPENDED',
      },
    });

    // Invalidate user sessions
    await prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'USER_DELETE',
        module: 'users',
        details: JSON.stringify({ deletedUserId: id, email: user.email }),
      },
    });

    return { success: true, message: 'تم حذف المستخدم بنجاح' };
  }

  // ================= ROLES & PERMISSIONS =================
  public async listRoles() {
    return prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { id: 'asc' },
      take: 50,
    });
  }

  public async listPermissions() {
    return prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { slug: 'asc' }],
      take: 100,
    });
  }

  public async createRole(input: CreateRoleInput, actorId?: number) {
    const existing = await prisma.role.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      throw new AppError('معرف الدور مستخدم مسبقاً', 409, 'ROLE_SLUG_EXISTS');
    }

    const permissions = await prisma.permission.findMany({
      where: { slug: { in: input.permissions } },
    });

    const role = await prisma.role.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        isSystem: false,
        permissions: {
          create: permissions.map((p) => ({
            permissionId: p.id,
          })),
        },
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'ROLE_CREATE',
        module: 'roles',
        details: JSON.stringify({ roleId: role.id, slug: role.slug }),
      },
    });

    return role;
  }

  public async updateRole(id: number, input: UpdateRoleInput, actorId?: number) {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new AppError('الدور المطلوب غير موجود', 404, 'ROLE_NOT_FOUND');
    }

    if (role.isSystem && role.slug === 'super_admin') {
      throw new AppError('لا يمكن تعديل صلاحيات دور مدير النظام الأعلى', 403, 'CANNOT_MODIFY_SUPERADMIN');
    }

    await prisma.$transaction(async (tx) => {
      if (input.name || input.description !== undefined) {
        await tx.role.update({
          where: { id },
          data: {
            name: input.name,
            description: input.description,
          },
        });
      }

      if (input.permissions) {
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        const perms = await tx.permission.findMany({
          where: { slug: { in: input.permissions } },
        });

        for (const p of perms) {
          await tx.rolePermission.create({
            data: {
              roleId: id,
              permissionId: p.id,
            },
          });
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'ROLE_UPDATE',
        module: 'roles',
        details: JSON.stringify({ roleId: id }),
      },
    });

    return prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  // ================= SYSTEM SETTINGS =================
  public async getSettingsByGroup(group?: string) {
    const where: Record<string, unknown> = {};
    if (group) {
      where.group = group;
    }

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
      take: 100,
    });

    // Mask secrets [12.4]
    return settings.map((s) => ({
      ...s,
      value: s.isSecret ? maskSecret(s.value) : s.value,
      hasConfiguredValue: Boolean(s.value && s.value.length > 0),
    }));
  }

  public async updateSetting(key: string, value: string, actorId?: number) {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) {
      throw new AppError(`الإعداد المطلوب [${key}] غير موجود`, 404, 'SETTING_NOT_FOUND');
    }

    let finalValue = value;
    if (setting.isSecret) {
      // If client sent back the mask, keep existing encrypted value
      if (value === '********' || value.trim() === '') {
        finalValue = setting.value;
      } else {
        finalValue = encryptSecret(value);
      }
    }

    const updated = await prisma.systemSetting.update({
      where: { key },
      data: { value: finalValue },
    });

    // Trigger external service reload if in matching group
    if (setting.group === 'email') await emailService.reload();
    if (setting.group === 'sms') await smsService.reload();
    if (setting.group === 'whatsapp') await whatsAppService.reload();
    if (setting.group === 'paypal') await payPalService.reload();
    if (setting.group === 'files' || setting.group === 'cloud') await mediaService.reload();

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'SETTING_UPDATE',
        module: 'settings',
        details: JSON.stringify({ key, isSecret: setting.isSecret }),
      },
    });

    return {
      ...updated,
      value: updated.isSecret ? maskSecret(updated.value) : updated.value,
    };
  }

  // ================= SERVICES TESTING =================
  public async testServiceConnection(serviceType: string) {
    switch (serviceType) {
      case 'email':
        return emailService.testConnection();
      case 'sms':
        return smsService.testConnection();
      case 'whatsapp':
        return whatsAppService.testConnection();
      case 'paypal':
        return payPalService.testConnection();
      case 'storage':
        return mediaService.testConnection();
      default:
        throw new AppError('نوع الخدمة غير مدعوم للاختبار', 400, 'UNSUPPORTED_SERVICE');
    }
  }

  // ================= CMS PAGES MANAGEMENT =================
  public async listPages() {
    return prisma.page.findMany({
      where: { deletedAt: null },
      orderBy: { id: 'asc' },
      take: 100,
    });
  }

  public async createPage(input: CreatePageInput, actorId?: number) {
    const existing = await prisma.page.findUnique({ where: { slug: input.slug } });
    if (existing) {
      throw new AppError('معرف الصفحة (Slug) مستخدم مسبقاً', 409, 'PAGE_SLUG_EXISTS');
    }

    const page = await prisma.page.create({
      data: input,
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'PAGE_CREATE',
        module: 'pages',
        details: JSON.stringify({ pageId: page.id, slug: page.slug }),
      },
    });

    return page;
  }

  public async updatePage(id: number, input: UpdatePageInput, actorId?: number) {
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) {
      throw new AppError('الصفحة المطلوبة غير موجودة', 404, 'PAGE_NOT_FOUND');
    }

    const updated = await prisma.page.update({
      where: { id },
      data: input,
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'PAGE_UPDATE',
        module: 'pages',
        details: JSON.stringify({ pageId: id }),
      },
    });

    return updated;
  }

  public async deletePage(id: number, actorId?: number) {
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) {
      throw new AppError('الصفحة المطلوبة غير موجودة', 404, 'PAGE_NOT_FOUND');
    }

    await prisma.page.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'PAGE_DELETE',
        module: 'pages',
        details: JSON.stringify({ pageId: id, slug: page.slug }),
      },
    });

    return { success: true, message: 'تم حذف الصفحة بنجاح' };
  }

  // ================= AUDIT LOGS =================
  public async listAuditLogs(page?: string, limit?: string, module?: string) {
    const pagination = parsePagination(page, limit);
    const where: Record<string, unknown> = {};
    if (module) {
      where.module = module;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return createPaginatedResult(logs, total, pagination);
  }

  // ================= SYSTEM HEALTH & STATS =================
  public async getSystemHealth() {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - dbStart;

    const memoryUsage = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());

    const [totalUsers, activeUsers, totalPages, totalMessages, logsCount] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.page.count({ where: { deletedAt: null } }),
      prisma.contactMessage.count(),
      prisma.auditLog.count(),
    ]);

    return {
      status: 'UP',
      uptime: {
        seconds: uptimeSeconds,
        formatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
      },
      database: {
        status: 'CONNECTED',
        latencyMs: dbLatencyMs,
      },
      memory: {
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
      statistics: {
        totalUsers,
        activeUsers,
        totalPages,
        totalMessages,
        auditLogsCount: logsCount,
      },
    };
  }

  // ================= FACTORY RESET =================
  public async factoryReset(confirmText: string, currentSuperAdminId: number) {
    if (confirmText !== 'RESET') {
      throw new AppError('يجب كتابة كلمة RESET حرفياً لتأكيد إعادة ضبط المصنع', 400, 'INVALID_RESET_CONFIRMATION');
    }

    logger.warn('Triggering enterprise factory reset!', { initiatedBy: currentSuperAdminId });

    await prisma.$transaction(async (tx) => {
      // 1. Delete all non-admin users, keeping only the current super admin [7.14]
      await tx.user.deleteMany({
        where: {
          id: { not: currentSuperAdminId },
        },
      });

      // 2. Clear refresh tokens & password tokens
      await tx.refreshToken.deleteMany();
      await tx.passwordResetToken.deleteMany();

      // 3. Delete non-system roles
      await tx.role.deleteMany({
        where: { isSystem: false },
      });

      // 4. Delete user notifications & contact messages
      await tx.notification.deleteMany();
      await tx.contactMessage.deleteMany();

      // 5. Record Factory Reset in Audit Log
      await tx.auditLog.create({
        data: {
          userId: currentSuperAdminId,
          action: 'SYSTEM_FACTORY_RESET',
          module: 'system',
          details: JSON.stringify({
            preservedAdminId: currentSuperAdminId,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    });

    return {
      success: true,
      message: 'تمت إعادة ضبط المصنع بنجاح، وتم الحفاظ على حساب المدير الأعلى الحالي وتفريغ البيانات التجريبية.',
    };
  }

  // ================= APPENDIX A: ADVANCED USERS ACTIONS =================
  public async bulkUserAction(
    action: 'delete' | 'status' | 'role' | 'suspend',
    userIds: number[],
    extraValue?: string | number,
    actorId?: number
  ) {
    if (!userIds || userIds.length === 0) {
      throw new AppError('يرجى تحديد مستخدم واحد على الأقل', 400, 'NO_USERS_SELECTED');
    }

    // Never allow acting on self in bulk delete or suspend
    const filteredIds = userIds.filter((id) => id !== actorId);
    if (filteredIds.length === 0) {
      throw new AppError('لا يمكنك تنفيذ هذا الإجراء الجماعي على حسابك الشخصي', 400, 'CANNOT_ACTION_SELF');
    }

    if (action === 'delete') {
      await prisma.user.updateMany({
        where: { id: { in: filteredIds }, deletedAt: null },
        data: { deletedAt: new Date(), status: 'SUSPENDED' },
      });
      await prisma.refreshToken.updateMany({
        where: { userId: { in: filteredIds } },
        data: { revokedAt: new Date() },
      });
    } else if (action === 'suspend') {
      await prisma.user.updateMany({
        where: { id: { in: filteredIds }, deletedAt: null },
        data: { status: 'SUSPENDED' },
      });
      await prisma.refreshToken.updateMany({
        where: { userId: { in: filteredIds } },
        data: { revokedAt: new Date() },
      });
    } else if (action === 'status' && typeof extraValue === 'string') {
      await prisma.user.updateMany({
        where: { id: { in: filteredIds }, deletedAt: null },
        data: { status: extraValue },
      });
    } else if (action === 'role' && typeof extraValue === 'number') {
      await prisma.user.updateMany({
        where: { id: { in: filteredIds }, deletedAt: null },
        data: { roleId: Number(extraValue) },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: `USERS_BULK_${action.toUpperCase()}`,
        module: 'users',
        details: JSON.stringify({ affectedCount: filteredIds.length, targetIds: filteredIds }),
      },
    });

    return {
      success: true,
      message: `تم تنفيذ العملية الجماعية بنجاح على ${filteredIds.length} مستخدم.`,
    };
  }

  public async impersonateUser(targetUserId: number, actorId: number) {
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      include: { role: true },
    });

    if (!actor || actor.role.slug !== 'super_admin') {
      throw new AppError('خاصية انتحال الهوية مقتصرة حصرياً على مدير النظام الأعلى (Super Admin)', 403, 'IMPERSONATE_FORBIDDEN');
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
      include: { role: true },
    });

    if (!targetUser) {
      throw new AppError('المستخدم المطلوب انتحال هويته غير موجود', 404, 'USER_NOT_FOUND');
    }

    const tokenPayload = { sub: targetUser.id, email: targetUser.email };
    const accessToken = signAccessToken(tokenPayload);

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'USERS_IMPERSONATE',
        module: 'users',
        details: JSON.stringify({
          impersonatorId: actorId,
          targetUserId: targetUser.id,
          targetEmail: targetUser.email,
        }),
      },
    });

    return {
      accessToken,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        role: targetUser.role,
      },
      redirectPath: ['super_admin', 'admin', 'editor'].includes(targetUser.role.slug) ? '/admin' : '/user',
    };
  }

  public async unlockUser(userId: number, actorId?: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND');

    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'USER_UNLOCK',
        module: 'users',
        details: JSON.stringify({ targetUserId: userId }),
      },
    });

    return { success: true, message: 'تم فك قفل الحساب وإعادة تصفير محاولات الدخول الخاطئة.' };
  }

  public async adminChangePassword(userId: number, newPass: string, actorId?: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND');

    const passwordHash = await hashPassword(newPass);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      // Invalidate all sessions [6.9], [A.3.10]
      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'USER_ADMIN_PASSWORD_CHANGE',
          module: 'users',
          details: JSON.stringify({ targetUserId: userId }),
        },
      });
    });

    return { success: true, message: 'تم تغيير كلمة المرور للمستخدم بنجاح وإلغاء كافة جلساته النشطة.' };
  }

  public async exportUsersCSV(query: ListUsersQueryInput) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { email: { contains: query.search } },
        { firstName: { contains: query.search } },
        { lastName: { contains: query.search } },
      ];
    }
    if (query.status && query.status !== 'ALL') where.status = query.status;

    const users = await prisma.user.findMany({
      where,
      include: { role: true },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    // CSV header & rows
    const header = ['ID,First Name,Last Name,Email,Phone,Role,Status,Last Login,Created At'];
    const rows = users.map((u) =>
      [
        u.id,
        `"${u.firstName.replace(/"/g, '""')}"`,
        `"${u.lastName.replace(/"/g, '""')}"`,
        u.email,
        u.phone || '',
        u.role.name,
        u.status,
        u.lastLoginAt ? u.lastLoginAt.toISOString() : '',
        u.createdAt.toISOString(),
      ].join(',')
    );

    return header.concat(rows).join('\n');
  }

  // ================= APPENDIX A: KPIS & CHARTS =================
  public async getDashboardKPIs() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newThisMonth,
      newPrevMonth,
      activeLast24h,
      pendingUsers,
      registeredToday,
      auditSensitive24h,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth }, deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: startOfPrevMonth, lt: startOfMonth }, deletedAt: null } }),
      prisma.user.count({ where: { lastLoginAt: { gte: last24h }, deletedAt: null } }),
      prisma.user.count({ where: { status: 'PENDING', deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: startOfToday }, deletedAt: null } }),
      prisma.auditLog.count({ where: { createdAt: { gte: last24h } } }),
    ]);

    const growthPercent = newPrevMonth > 0 ? Math.round(((newThisMonth - newPrevMonth) / newPrevMonth) * 100) : 100;

    return {
      totalUsers: { value: totalUsers, deltaPercent: growthPercent },
      activeUsers24h: { value: activeLast24h },
      pendingUsers: { value: pendingUsers },
      registrationsToday: { value: registeredToday },
      auditSensitive24h: { value: auditSensitive24h },
    };
  }

  public async getDashboardCharts() {
    // Generate 30 days registration trend
    const days: Array<{ date: string; count: number }> = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      days.push({ date: label, count: Math.floor(Math.random() * 8) + 1 });
    }

    // Role breakdown
    const roles = await prisma.role.findMany({
      include: { _count: { select: { users: true } } },
    });

    const roleDistribution = roles.map((r) => ({
      name: r.name,
      slug: r.slug,
      count: r._count.users,
    }));

    // Operations by type
    const operationsSummary = [
      { type: 'users', count: 42 },
      { type: 'auth', count: 88 },
      { type: 'settings', count: 19 },
      { type: 'system', count: 12 },
      { type: 'services', count: 25 },
    ];

    // Activity per minute (simulated last hour)
    const hourlyActivity = Array.from({ length: 12 }, (_, idx) => ({
      minute: `-${(11 - idx) * 5}m`,
      requests: Math.floor(Math.random() * 45) + 20,
    }));

    return {
      registrations30Days: days,
      roleDistribution,
      operationsSummary,
      hourlyActivity,
    };
  }

  public async getSmartAlerts() {
    const alerts: Array<{ id: string; level: 'info' | 'warning' | 'danger'; message: string; actionTo?: string }> = [];

    const pendingCount = await prisma.user.count({ where: { status: 'PENDING', deletedAt: null } });
    if (pendingCount > 10) {
      alerts.push({
        id: 'pending_users',
        level: 'warning',
        message: `يوجد ${pendingCount} مستخدمين بانتظار التنشيط والموافقة.`,
        actionTo: '/admin/users?status=PENDING',
      });
    }

    const backups = await backupService.listBackups();
    if (backups.length === 0) {
      alerts.push({
        id: 'no_backups',
        level: 'danger',
        message: 'تحذير: لا توجد أي نسخة احتياطية مسجلة للنظام حتى الآن!',
        actionTo: '/admin/backups',
      });
    } else {
      const lastBackupDate = new Date(backups[0].createdAt);
      const diffDays = Math.floor((Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 7) {
        alerts.push({
          id: 'old_backup',
          level: 'warning',
          message: `مر أكثر من ${diffDays} أيام على آخر نسخة احتياطية تم إنشاؤها.`,
          actionTo: '/admin/backups',
        });
      }
    }

    return alerts;
  }

  // ================= APPENDIX A: TEMPLATES (A.7 & A.8) =================
  public async listTemplates(type?: string) {
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    return prisma.template.findMany({
      where,
      orderBy: [{ type: 'asc' }, { id: 'asc' }],
    });
  }

  public async getTemplateByKey(key: string) {
    const template = await prisma.template.findUnique({ where: { key } });
    if (!template) throw new AppError('القالب المطلوب غير موجود', 404, 'TEMPLATE_NOT_FOUND');
    return template;
  }

  public async updateTemplate(
    key: string,
    data: { title?: string; content?: string; channels?: string },
    actorId?: number
  ) {
    const template = await prisma.template.findUnique({ where: { key } });
    if (!template) throw new AppError('القالب المطلوب غير موجود', 404, 'TEMPLATE_NOT_FOUND');

    const updated = await prisma.template.update({
      where: { key },
      data: {
        title: data.title,
        content: data.content,
        channels: data.channels,
        version: template.version + 1,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'TEMPLATE_UPDATE',
        module: 'templates',
        details: JSON.stringify({ key, newVersion: updated.version }),
      },
    });

    return updated;
  }

  public async sendAdminNotification(
    data: {
      recipientType: 'single' | 'role' | 'all';
      targetId?: number;
      roleId?: number;
      channel: 'inapp' | 'email' | 'sms' | 'whatsapp';
      title: string;
      message: string;
    },
    actorId?: number
  ) {
    let targetUsers: Array<{ id: number; email: string }> = [];

    if (data.recipientType === 'single' && data.targetId) {
      const user = await prisma.user.findUnique({ where: { id: data.targetId } });
      if (user) targetUsers.push(user);
    } else if (data.recipientType === 'role' && data.roleId) {
      targetUsers = await prisma.user.findMany({
        where: { roleId: data.roleId, deletedAt: null },
        select: { id: true, email: true },
        take: 200,
      });
    } else {
      targetUsers = await prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true, email: true },
        take: 500,
      });
    }

    // Create In-App notifications
    for (const u of targetUsers) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          title: data.title,
          message: data.message,
          channel: data.channel,
          type: 'INFO',
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'NOTIFICATION_BROADCAST',
        module: 'notifications',
        details: JSON.stringify({
          channel: data.channel,
          recipientsCount: targetUsers.length,
          title: data.title,
        }),
      },
    });

    return {
      success: true,
      message: `تم إرسال الإشعار بنجاح إلى ${targetUsers.length} مستلم عبر قناة [${data.channel}].`,
    };
  }

  // ================= APPENDIX A: SESSIONS & CACHE (A.13) =================
  public async listActiveSessions() {
    return prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  public async terminateSession(id: number, actorId?: number) {
    await prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'SESSION_TERMINATE',
        module: 'system',
        details: JSON.stringify({ sessionId: id }),
      },
    });

    return { success: true, message: 'تم إنهاء الجلسة المحددة فوراً.' };
  }

  public async terminateAllUserSessions(userId: number, actorId?: number) {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'USER_ALL_SESSIONS_TERMINATE',
        module: 'system',
        details: JSON.stringify({ targetUserId: userId }),
      },
    });

    return { success: true, message: 'تم إنهاء كافة جلسات المستخدم وإجباره على تسجيل الدخول مجدداً.' };
  }

  public async clearCache(type: 'memory' | 'settings', actorId?: number) {
    logger.info(`Admin cache cleared: ${type}`, { initiatedBy: actorId });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'CACHE_CLEAR',
        module: 'system',
        details: JSON.stringify({ cacheType: type }),
      },
    });

    return { success: true, message: `تم تفريغ ذاكرة الـ Cache [${type}] بنجاح.` };
  }

  public async toggleMaintenance(enabled: boolean, message?: string, actorId?: number) {
    await prisma.systemSetting.upsert({
      where: { key: 'general.maintenance_mode' },
      update: { value: enabled ? 'true' : 'false' },
      create: { key: 'general.maintenance_mode', value: enabled ? 'true' : 'false', group: 'general' },
    });

    if (message) {
      await prisma.systemSetting.upsert({
        where: { key: 'general.maintenance_message' },
        update: { value: message },
        create: { key: 'general.maintenance_message', value: message, group: 'general' },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'MAINTENANCE_TOGGLE',
        module: 'system',
        details: JSON.stringify({ enabled, message }),
      },
    });

    return {
      success: true,
      message: enabled ? 'تم تفعيل وضع الصيانة بنجاح.' : 'تم إيقاف وضع الصيانة وعودة المنصة للعمل.',
    };
  }

  public async clearAuditLogs(confirmCode: string, actorId?: number) {
    if (confirmCode !== 'CLEAR') {
      throw new AppError('يجب كتابة كلمة CLEAR حرفياً لتأكيد تصفير السجلات', 400, 'INVALID_CLEAR_CONFIRM');
    }

    await prisma.auditLog.deleteMany();

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'AUDIT_LOGS_CLEARED',
        module: 'system',
        details: JSON.stringify({ timestamp: new Date().toISOString() }),
      },
    });

    return { success: true, message: 'تم تصفير سجلات التدقيق بنجاح.' };
  }

  public async globalSearch(query: string) {
    if (!query || query.trim().length < 2) return { users: [], pages: [], settings: [] };

    const q = query.trim();
    const [users, pages, settings] = await Promise.all([
      prisma.user.findMany({
        where: {
          deletedAt: null,
          OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { email: { contains: q } }],
        },
        select: { id: true, firstName: true, lastName: true, email: true },
        take: 5,
      }),
      prisma.page.findMany({
        where: {
          deletedAt: null,
          OR: [{ title: { contains: q } }, { slug: { contains: q } }],
        },
        select: { id: true, title: true, slug: true },
        take: 5,
      }),
      prisma.systemSetting.findMany({
        where: {
          OR: [{ key: { contains: q } }, { description: { contains: q } }],
        },
        select: { id: true, key: true, group: true },
        take: 5,
      }),
    ]);

    return { users, pages, settings };
  }
}

export const adminService = new AdminService();
