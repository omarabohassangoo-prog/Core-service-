import { Router } from 'express';
import { installController } from '../controllers/install.controller';
import { requireNotInstalled } from '../middlewares/installed';
import { validate } from '../middlewares/validate';
import { installSetupSchema } from '../schemas/install.schema';
import { asyncHandler } from '../utils/asyncHandler';
import { writeLimiter, readLimiter } from '../middlewares/rateLimit';

const router = Router();

// GET /api/install/status
router.get(
  '/status',
  readLimiter,
  asyncHandler(installController.getStatus.bind(installController))
);

// POST /api/install/setup - executes initial bootstrap setup
router.post(
  '/setup',
  writeLimiter,
  requireNotInstalled,
  validate(installSetupSchema, 'body'),
  asyncHandler(installController.setup.bind(installController))
);

export default router;
