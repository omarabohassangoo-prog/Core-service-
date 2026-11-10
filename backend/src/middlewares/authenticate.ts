import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/appError';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('يرجى تسجيل الدخول للوصول إلى هذا المورد', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new AppError('رمز المصادقة غير صالح', 401, 'UNAUTHORIZED');
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new AppError('انتهت صلاحية الجلسة أو الرمز غير صالح', 401, 'TOKEN_EXPIRED');
    }

    const user = await prisma.user.findFirst({
      where: {
        id: payload.sub,
        deletedAt: null,
      },
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
      throw new AppError('المستخدم غير موجود أو تم تعطيل الحساب', 401, 'USER_NOT_FOUND');
    }

    if (user.status === 'SUSPENDED') {
      throw new AppError('تم إيقاف هذا الحساب. يرجى التواصل مع إدارة النظام', 403, 'ACCOUNT_SUSPENDED');
    }

    const permissions = user.role.permissions.map((rp) => rp.permission.slug);

    req.user = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleSlug: user.role.slug,
      permissions,
    };

    next();
  } catch (error) {
    next(error);
  }
};
