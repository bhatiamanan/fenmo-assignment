import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';

const requestLogger: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (request) => {
    request.log.info({ method: request.method, url: request.url }, 'Incoming request');
  });
};

export default fp(requestLogger);
