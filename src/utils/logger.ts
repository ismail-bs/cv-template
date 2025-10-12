import winston from 'winston';
import { config } from '../config';

/**
 * Structured logger using Winston
 */
const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'cv-to-pdf-api' },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => {
          const { timestamp, level, message, ...meta } = info;
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 0 && meta.service) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { service, ...rest } = meta;
            if (Object.keys(rest).length > 0) {
              msg += ` ${JSON.stringify(rest)}`;
            }
          }
          return msg;
        })
      ),
    }),
  ],
});

// Add file transport in production
if (config.nodeEnv === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
    })
  );
}

export default logger;

