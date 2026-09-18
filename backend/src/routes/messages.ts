import { FastifyInstance } from 'fastify';
import pool from '../db/index.js';

export default async function messagesRoutes(fastify: FastifyInstance) {
  // GET /api/messages - Liste des messages
  fastify.get<{ Querystring: { conversation_id?: string } }>('/', async (request, reply) => {
    try {
      const { conversation_id } = request.query;
      let query = 'SELECT * FROM messages';
      const params: any[] = [];
      if (conversation_id) {
        query += ' WHERE conversation_id = $1';
        params.push(Number(conversation_id));
      }
      query += ' ORDER BY id ASC LIMIT 200';
      const result = await pool.query(query, params);
      return { count: result.rows.length, data: result.rows };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la récupération des messages' });
    }
  });

  // GET /api/messages/:id - Détail d'un message
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const result = await pool.query('SELECT * FROM messages WHERE id = $1', [Number(id)]);
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Not Found', message: `Message ${id} non trouvé` });
      }
      return result.rows[0];
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la recherche du message' });
    }
  });
}
