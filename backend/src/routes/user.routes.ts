import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { updateProfileSchema, changePasswordSchema } from '../schemas/user.schema';

const router = Router();

// Protect ALL user routes with authenticate
router.use(authenticate);

router.get(
  '/profile',
  asyncHandler(userController.getProfile.bind(userController))
);

router.put(
  '/profile',
  validate(updateProfileSchema, 'body'),
  asyncHandler(userController.updateProfile.bind(userController))
);

router.post(
  '/change-password',
  validate(changePasswordSchema, 'body'),
  asyncHandler(userController.changePassword.bind(userController))
);

router.get(
  '/notifications',
  asyncHandler(userController.getNotifications.bind(userController))
);

router.put(
  '/notifications/:id/read',
  asyncHandler(userController.markNotificationAsRead.bind(userController))
);

router.get(
  '/summary',
  asyncHandler(userController.getDashboardSummary.bind(userController))
);

export default router;
