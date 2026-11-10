import { Router, Request, Response } from 'express';
import installRoutes from './install.routes';
import authRoutes from './auth.routes';
import publicRoutes from './public.routes';
import adminRoutes from './admin.routes';
import userRoutes from './user.routes';
import { prisma } from '../config/prisma';

const rootRouter = Router();

// Health Check Endpoints [10.4], [10.5]
rootRouter.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'LIVE',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

rootRouter.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'READY',
      database: 'CONNECTED',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'UNAVAILABLE',
      database: 'DISCONNECTED',
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// Mount the 5 decoupled systems
rootRouter.use('/install', installRoutes);
rootRouter.use('/auth', authRoutes);
rootRouter.use('/public', publicRoutes);
rootRouter.use('/admin', adminRoutes);
rootRouter.use('/user', userRoutes);

export default rootRouter;
