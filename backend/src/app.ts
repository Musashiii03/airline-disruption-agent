import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { setupErrorHandling } from './middleware/error.js';
import { requestLogger } from './middleware/logger.js';
import routes from './routes/index.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      data: {
        service: 'Airline Resolution Agent Backend',
        version: '1.0.0',
      },
    });
  });

  // All routes
  app.use('/', routes);

  // Error handling (must be last)
  setupErrorHandling(app);

  return app;
}
