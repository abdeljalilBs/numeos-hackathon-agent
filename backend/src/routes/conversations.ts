import { FastifyInstance } from 'fastify';
import pool from '../db/index.js';

export default async function conversationsRoutes(fastify: FastifyInstance) {
  // GET /api/conversations - Liste des conversations
  fastify.get<{ Querystring: { client_id?: string } }>('/', async (request, reply) => {
    try {
      const { client_id } = request.query;
      let query = 'SELECT * FROM conversations';
      const params: any[] = [];
      if (client_id) {
        query += ' WHERE UPPER(client_id) = UPPER($1)';
        params.push(client_id);
      }
      query += ' ORDER BY id ASC LIMIT 100';
      const result = await pool.query(query, params);
      return { count: result.rows.length, data: result.rows };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la récupération des conversations' });
    }
  });

  // GET /api/conversations/:id - Détail d'une conversation (avec ses messages)
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const isNum = !isNaN(Number(id));
      const convRes = await pool.query(
        isNum 
          ? 'SELECT * FROM conversations WHERE id = $1 OR UPPER(conv_code) = UPPER($2)'
          : 'SELECT * FROM conversations WHERE UPPER(conv_code) = UPPER($1)',
        isNum ? [Number(id), id] : [id]
      );
      if (convRes.rows.length === 0) {
        return reply.code(404).send({ error: 'Not Found', message: `Conversation ${id} non trouvée` });
      }
      const conv = convRes.rows[0];
      const msgRes = await pool.query(
        'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY id ASC',
        [conv.id]
      );
      return { ...conv, messages: msgRes.rows };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la recherche de la conversation' });
    }
  });
}
