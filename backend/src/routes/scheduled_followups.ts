import { FastifyInstance } from 'fastify';
import pool from '../db/index.js';

export default async function scheduledFollowupsRoutes(fastify: FastifyInstance) {
  // GET /api/scheduled-followups - Liste des relances planifiées
  fastify.get('/', async (request, reply) => {
    try {
      const result = await pool.query('SELECT * FROM scheduled_followups ORDER BY scheduled_at ASC');
      return { count: result.rows.length, data: result.rows };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la récupération des relances' });
    }
  });

  // GET /api/scheduled-followups/:id - Détail d'une relance
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const result = await pool.query('SELECT * FROM scheduled_followups WHERE id = $1', [Number(id)]);
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Not Found', message: `Relance ${id} non trouvée` });
      }
      return result.rows[0];
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la recherche de la relance' });
    }
  });
}
