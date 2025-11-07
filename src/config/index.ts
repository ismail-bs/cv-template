import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Application Configuration
 */
export const config = {
  // Server
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiKey: process.env.API_KEY || 'default-dev-key',

  // Template
  templateName: process.env.TEMPLATE_NAME || 'option-premium-clean.hbs',
  templateDir: path.join(process.cwd(), process.env.TEMPLATE_DIR || 'templates'),

  // PDF Generation
  puppeteerTimeout: parseInt(process.env.PUPPETEER_TIMEOUT || '30000', 10),
  pdfRetryAttempts: parseInt(process.env.PDF_RETRY_ATTEMPTS || '1', 10),

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Request Size
  maxRequestSize: process.env.MAX_REQUEST_SIZE || '2mb',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  const required = ['apiKey'];
  const missing = required.filter((key) => !config[key as keyof typeof config]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (config.nodeEnv === 'production' && config.apiKey === 'default-dev-key') {
    throw new Error('API_KEY must be set in production environment');
  }
}

