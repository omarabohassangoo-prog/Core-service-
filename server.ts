import http from 'http';
import path from 'path';
import express from 'express';
import { createApp } from './backend/src/app';
import { env } from './backend/src/config/env';
import { prisma } from './backend/src/config/prisma';
import { logger } from './backend/src/utils/logger';

async function bootstrap() {
  const app = createApp();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);
  const port = env.PORT || 3000;

  server.listen(port, '0.0.0.0', () => {
    logger.info(`Enterprise Server active on http://0.0.0.0:${port} [Mode: ${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully stopping server...`);
    server.close(async () => {
      try {
        await prisma.$disconnect();
        logger.info('Prisma disconnected.');
        process.exit(0);
      } catch (err) {
        logger.error('Error disconnecting Prisma', { error: String(err) });
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error('Forced exit timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Failed to start enterprise server', { error: String(err) });
  process.exit(1);
});
