import { FastifyInstance } from 'fastify';
import pool from '../db/index.js';

export default async function ordersRoutes(fastify: FastifyInstance) {
  // GET /api/orders - Liste des commandes
  fastify.get('/', async (request, reply) => {
    try {
      const result = await pool.query('SELECT * FROM orders ORDER BY date DESC, commande_id ASC');
      return { count: result.rows.length, data: result.rows };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la récupération des commandes' });
    }
  });

  // GET /api/orders/:id - Détail d'une commande (avec ses lignes)
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const orderRes = await pool.query('SELECT * FROM orders WHERE UPPER(commande_id) = UPPER($1)', [id]);
      if (orderRes.rows.length === 0) {
        return reply.code(404).send({ error: 'Not Found', message: `Commande ${id} non trouvée` });
      }
      const linesRes = await pool.query('SELECT * FROM order_lines WHERE UPPER(commande_id) = UPPER($1)', [id]);
      return { ...orderRes.rows[0], lines: linesRes.rows };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la recherche de la commande' });
    }
  });
}
