import { FastifyError, FastifyInstance } from 'fastify';

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error(error);

    if (reply.statusCode >= 400 && reply.statusCode < 500) {
      return reply.send({ error: { message: error.message || 'Bad request' } });
    }

    reply.status(500).send({ error: { message: 'Internal server error' } });
  });
}
