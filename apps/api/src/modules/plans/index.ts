import { FastifyInstance } from 'fastify';
import { plansRoutes } from './plans.routes';

export async function registerPlansModule(app: FastifyInstance) {
  // Aparentemente plansRoutes está sendo registrado sem prefixo, mas main.ts já define um.
  // Pode ser que isso esteja causando problemas.
  // Vamos remover o prefixo interno se for o caso, ou garantir que ele está apenas no main.ts
  await app.register(plansRoutes);
}
