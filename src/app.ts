import fastify from 'fastify';
import { config } from './config/index.js';
import { expenseRoutes } from './routes/expenseRoutes.js';
import requestLogger from './middlewares/requestLogger.js';
import { registerErrorHandler } from './middlewares/errorHandler.js';

export function buildApp() {
  const app = fastify({
    logger: {
      level: config.logLevel,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    },
  });

  app.register(requestLogger);
  app.register(expenseRoutes);
  registerErrorHandler(app);

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}
