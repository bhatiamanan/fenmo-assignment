import { FastifyInstance } from 'fastify';
import { expenseController } from '../controllers/expenseController.js';

export async function expenseRoutes(app: FastifyInstance) {
  app.post('/expenses', expenseController.create);
  app.get('/expenses', expenseController.list);
}
