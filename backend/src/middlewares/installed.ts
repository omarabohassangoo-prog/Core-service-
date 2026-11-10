import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/appError';

export const isSystemInstalled = async (): Promise<boolean> => {
  const superAdminRole = await prisma.role.findUnique({
    where: { slug: 'super_admin' },
  });

  if (!superAdminRole) {
    return false;
  }

  const superAdmin = await prisma.user.findFirst({
    where: {
      roleId: superAdminRole.id,
      deletedAt: null,
    },
  });

  return !!superAdmin;
};

export const requireNotInstalled = async (
  _req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const installed = await isSystemInstalled();
    if (installed) {
      throw new AppError(
        'نظام Enterprise مثبت مسبقاً، وتم تعطيل معالج التنصيب للأمان.',
        403,
        'SYSTEM_ALREADY_INSTALLED'
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};
