import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export const requirePermission = (permissionSlug: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('غير مصرح لك بالوصول', 401, 'UNAUTHORIZED'));
    }

    // super_admin has all permissions
    if (req.user.roleSlug === 'super_admin') {
      return next();
    }

    if (!req.user.permissions.includes(permissionSlug)) {
      return next(
        new AppError('ليس لديك الصلاحية المطلوبة لتنفيذ هذا الإجراء', 403, 'FORBIDDEN')
      );
    }

    next();
  };
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('غير مصرح لك بالوصول', 401, 'UNAUTHORIZED'));
    }

    if (req.user.roleSlug === 'super_admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.roleSlug)) {
      return next(
        new AppError('دورك الحالي لا يسمح بالوصول لهذه الصفحة', 403, 'FORBIDDEN')
      );
    }

    next();
  };
};
