import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`المسار المطلوب [${req.method} ${req.originalUrl}] غير موجود`, 404, 'NOT_FOUND'));
};
