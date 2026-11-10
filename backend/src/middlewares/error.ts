import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const reqId = req.id || 'N/A';
  res.setHeader('X-Request-Id', reqId);

  // 1. Zod Validation Error -> 422
  if (err instanceof ZodError) {
    const formattedErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const field = issue.path.join('.') || 'input';
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(issue.message);
    }

    logger.warn('Validation error occurred', {
      requestId: reqId,
      path: req.originalUrl,
      method: req.method,
      errors: formattedErrors,
    });

    res.status(422).json({
      success: false,
      message: 'بيانات الإدخال غير صالحة',
      code: 'VALIDATION_ERROR',
      requestId: reqId,
      errors: formattedErrors,
    });
    return;
  }

  // 2. Prisma Known Request Error
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    let statusCode = 400;
    let message = 'خطأ في عملية قاعدة البيانات';
    let code = `PRISMA_${err.code}`;

    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'القيمة المدخلة مستخدمة مسبقاً ومكررة في النظام';
      code = 'RESOURCE_ALREADY_EXISTS';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'المورد المطلوب غير موجود في قاعدة البيانات';
      code = 'RESOURCE_NOT_FOUND';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'فشل التحقق من قيود العلاقات المرتبطة في السجل';
      code = 'FOREIGN_KEY_VIOLATION';
    }

    logger.warn(`Prisma error ${err.code}`, {
      requestId: reqId,
      code: err.code,
      message,
    });

    res.status(statusCode).json({
      success: false,
      message,
      code,
      requestId: reqId,
    });
    return;
  }

  // 3. Operational AppError
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.code}]: ${err.message}`, {
      requestId: reqId,
      statusCode: err.statusCode,
    });

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      requestId: reqId,
    });
    return;
  }

  // 4. Unknown / Internal Error -> 500
  const isProd = env.NODE_ENV === 'production';
  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  const errorStack = err instanceof Error ? err.stack : undefined;

  logger.error('Unhandled internal server error', {
    requestId: reqId,
    error: errorMessage,
    stack: errorStack,
  });

  res.status(500).json({
    success: false,
    message: 'حدث خطأ غير متوقع في الخادم',
    code: 'INTERNAL_SERVER_ERROR',
    requestId: reqId,
    ...(isProd ? {} : { details: errorMessage, stack: errorStack }),
  });
};
