import { FastifyInstance } from 'fastify';
import pool from '../db/index.js';

export default async function escalationsRoutes(fastify: FastifyInstance) {
  // GET /api/escalations - Liste des escalades
  fastify.get('/', async (request, reply) => {
    try {
      const result = await pool.query('SELECT * FROM escalations ORDER BY id ASC');
      return { count: result.rows.length, data: result.rows };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la récupération des escalades' });
    }
  });

  // GET /api/escalations/:id - Détail d'une escalade
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const result = await pool.query('SELECT * FROM escalations WHERE id = $1', [Number(id)]);
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Not Found', message: `Escalade ${id} non trouvée` });
      }
      return result.rows[0];
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la recherche de l escalade' });
    }
  });
}
