import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { CVProcessorService } from './services/cv-processor.service';
import { PDFGeneratorService } from './services/pdf-generator.service';
import { createCVRoutes } from './routes/cv.routes';
import { createHealthRoutes } from './routes/health.routes';
import {
  errorHandler,
  notFoundHandler,
} from './middleware/error.middleware';
import logger from './utils/logger';

/**
 * Create and configure Express application
 */
export async function createApp(): Promise<Express> {
  const app: Express = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );

  // Body parser middleware with size limit
  app.use(express.json({ limit: config.maxRequestSize }));
  app.use(express.urlencoded({ extended: true, limit: config.maxRequestSize }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Initialize services
  logger.info('Initializing services');
  const cvProcessor = new CVProcessorService();
  const pdfGenerator = new PDFGeneratorService();
  await pdfGenerator.initialize();

  // Routes
  app.use('/health', createHealthRoutes());
  app.use('/cv', createCVRoutes(cvProcessor, pdfGenerator));

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Store services on app for cleanup
  app.locals.pdfGenerator = pdfGenerator;

  logger.info('Express application configured successfully');

  return app;
}

