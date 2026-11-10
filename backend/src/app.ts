import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from './config/env';
import { requestId } from './middlewares/requestId';
import { notFoundHandler } from './middlewares/notFound';
import { errorHandler } from './middlewares/error';
import rootRouter from './routes/index';

export const createApp = (): Express => {
  const app = express();

  // 1. Security Headers [7.1]
  app.use(
    helmet({
      contentSecurityPolicy: false, // Vite Dev / SPA compatibility
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
      frameguard: false, // Allows iframe embedding in AI Studio preview
    })
  );

  // 2. Disable x-powered-by [7.3]
  app.disable('x-powered-by');

  // 3. CORS with configured origin [7.2]
  app.use(
    cors({
      origin: env.CORS_ORIGIN || true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    })
  );

  // 4. Compression [8.1]
  app.use(
    compression({
      threshold: 1024,
      level: 6,
    })
  );

  // 5. JSON Body Parser with 1mb limit [7.4]
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 6. Request ID middleware [10.1], [7.11]
  app.use(requestId);

  // 7. Mount Core Enterprise API Routes
  app.use('/api', rootRouter);

  // 8. 404 handler for unmatched /api routes [9.7]
  app.use('/api/*', notFoundHandler);

  // 9. Central Error Handler [9.2], [9.4]
  app.use(errorHandler);

  return app;
};
