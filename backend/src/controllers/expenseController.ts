import { FastifyRequest, FastifyReply } from 'fastify';
import { expenseService, ExpenseInput, ValidationError } from '../services/expenseService.js';

export const expenseController = {
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = expenseService.validateExpensePayload(request.body);
      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
      const expense = await expenseService.createExpense(payload, idempotencyKey);
      return reply.status(201).send({ data: expense });
    } catch (error) {
      if (error instanceof ValidationError) {
        return reply.status(error.statusCode).send({
          error: {
            message: error.message,
            details: error.details,
          },
        });
      }
      request.log.error(error);
      return reply.status(500).send({ error: { message: 'Failed to create expense' } });
    }
  },

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as { category?: string; sort?: string };
      const expenses = await expenseService.listExpenses(query);
      const totalAmountCents = expenses.reduce((sum, item) => sum + item.amountCents, 0);
      return reply.send({ data: expenses, meta: { totalAmountCents } });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: { message: 'Unable to fetch expenses' } });
    }
  },
};
