import { FastifyInstance } from 'fastify';
import pool from '../db/index.js';

export default async function deliveryZonesRoutes(fastify: FastifyInstance) {
  // GET /api/delivery-zones - Liste des zones de livraison
  fastify.get('/', async (request, reply) => {
    try {
      const result = await pool.query('SELECT * FROM delivery_zones ORDER BY ville ASC');
      return { count: result.rows.length, data: result.rows };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la récupération des zones de livraison' });
    }
  });

  // GET /api/delivery-zones/:ville - Détail d'une zone par ville
  fastify.get<{ Params: { ville: string } }>('/:ville', async (request, reply) => {
    try {
      const { ville } = request.params;
      const result = await pool.query('SELECT * FROM delivery_zones WHERE UPPER(ville) = UPPER($1)', [ville]);
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Not Found', message: `Zone de livraison pour ${ville} non trouvée` });
      }
      return result.rows[0];
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la recherche de la zone de livraison' });
    }
  });
}
