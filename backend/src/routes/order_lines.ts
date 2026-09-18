import { FastifyInstance } from 'fastify';
import pool from '../db/index.js';

export default async function orderLinesRoutes(fastify: FastifyInstance) {
  // GET /api/order-lines - Liste des lignes de commande
  fastify.get<{ Querystring: { commande_id?: string } }>('/', async (request, reply) => {
    try {
      const { commande_id } = request.query;
      let query = 'SELECT * FROM order_lines';
      const params: any[] = [];
      if (commande_id) {
        query += ' WHERE UPPER(commande_id) = UPPER($1)';
        params.push(commande_id);
      }
      query += ' ORDER BY id ASC LIMIT 200';
      const result = await pool.query(query, params);
      return { count: result.rows.length, data: result.rows };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la récupération des lignes de commande' });
    }
  });

  // GET /api/order-lines/:id - Détail d'une ligne
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const result = await pool.query('SELECT * FROM order_lines WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Not Found', message: `Ligne de commande ${id} non trouvée` });
      }
      return result.rows[0];
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la recherche de la ligne de commande' });
    }
  });
}
