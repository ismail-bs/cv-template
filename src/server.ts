import { createApp } from './app';
import { config, validateConfig } from './config';
import logger from './utils/logger';

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();
    logger.info('Configuration validated successfully');

    // Create Express app
    const app = await createApp();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Server started successfully`, {
        port: config.port,
        environment: config.nodeEnv,
        template: config.templateName,
      });
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received, starting graceful shutdown`);

      server.close(async () => {
        logger.info('HTTP server closed');

        // Cleanup resources
        if (app.locals.pdfGenerator) {
          await app.locals.pdfGenerator.cleanup();
        }

        logger.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled rejection', { reason });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

// Start the server
startServer();

