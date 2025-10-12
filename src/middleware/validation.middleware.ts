import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import logger from '../utils/logger';

/**
 * Validation middleware factory
 * Creates middleware that validates request body against a Joi schema
 */
export function validateRequest(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join('; ');

      logger.warn('Request validation failed', {
        path: req.path,
        errors: error.details,
      });

      res.status(400).json({
        error: `Validation error: ${errorMessage}`,
      });
      return;
    }

    // Replace request body with validated and sanitized value
    req.body = value;
    next();
  };
}

