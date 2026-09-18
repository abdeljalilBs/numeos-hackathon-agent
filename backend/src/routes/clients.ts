import { FastifyInstance } from 'fastify';
import pool from '../db/index.js';

export default async function clientsRoutes(fastify: FastifyInstance) {
  // GET /api/clients - Liste des clients
  fastify.get('/', async (request, reply) => {
    try {
      const result = await pool.query('SELECT * FROM clients ORDER BY client_id ASC');
      return { count: result.rows.length, data: result.rows };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la récupération des clients' });
    }
  });

  // GET /api/clients/:id - Détail d'un client
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const result = await pool.query(
        'SELECT * FROM clients WHERE UPPER(client_id) = UPPER($1) OR telephone = $1',
        [id]
      );
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Not Found', message: `Client ${id} non trouvé` });
      }
      return result.rows[0];
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la recherche du client' });
    }
  });
}
