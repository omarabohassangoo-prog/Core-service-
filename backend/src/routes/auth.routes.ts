import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { authLimiter } from '../middlewares/rateLimit';
import { asyncHandler } from '../utils/asyncHandler';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../schemas/auth.schema';

const router = Router();

router.post(
  '/login',
  authLimiter,
  validate(loginSchema, 'body'),
  asyncHandler(authController.login.bind(authController))
);

router.post(
  '/register',
  authLimiter,
  validate(registerSchema, 'body'),
  asyncHandler(authController.register.bind(authController))
);

router.post(
  '/refresh',
  validate(refreshTokenSchema, 'body'),
  asyncHandler(authController.refresh.bind(authController))
);

router.post(
  '/logout',
  asyncHandler(authController.logout.bind(authController))
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema, 'body'),
  asyncHandler(authController.forgotPassword.bind(authController))
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema, 'body'),
  asyncHandler(authController.resetPassword.bind(authController))
);

router.get(
  '/me',
  authenticate,
  asyncHandler(authController.me.bind(authController))
);

export default router;
