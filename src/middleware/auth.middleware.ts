import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * API Key Authentication Middleware
 * Validates X-API-Key header
 */
export function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    logger.warn('API request without API key', {
      ip: req.ip,
      path: req.path,
    });
    res.status(401).json({ error: 'API key is required' });
    return;
  }

  if (apiKey !== config.apiKey) {
    logger.warn('API request with invalid API key', {
      ip: req.ip,
      path: req.path,
    });
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  logger.debug('API key authenticated successfully', {
    path: req.path,
  });

  next();
}

