import { Router } from 'express';
import { publicController } from '../controllers/public.controller';
import { validate } from '../middlewares/validate';
import { readLimiter, writeLimiter } from '../middlewares/rateLimit';
import { asyncHandler } from '../utils/asyncHandler';
import { contactMessageSchema, pageSlugParamSchema } from '../schemas/public.schema';

const router = Router();

router.get(
  '/pages',
  readLimiter,
  asyncHandler(publicController.listPages.bind(publicController))
);

router.get(
  '/pages/:slug',
  readLimiter,
  validate(pageSlugParamSchema, 'params'),
  asyncHandler(publicController.getPage.bind(publicController))
);

router.post(
  '/contact',
  writeLimiter,
  validate(contactMessageSchema, 'body'),
  asyncHandler(publicController.submitContact.bind(publicController))
);

router.get(
  '/settings',
  readLimiter,
  asyncHandler(publicController.getSettings.bind(publicController))
);

export default router;
