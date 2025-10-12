import { Router, Request, Response } from 'express';
import logger from '../utils/logger';

/**
 * Health check routes
 */
export function createHealthRoutes(): Router {
  const router = Router();

  /**
   * GET /health
   * Basic health check endpoint
   */
  router.get('/', (_req: Request, res: Response) => {
    logger.debug('Health check requested');

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  return router;
}

