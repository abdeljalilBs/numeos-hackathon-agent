import { FastifyInstance } from 'fastify';
import pool from '../db/index.js';

export default async function productsRoutes(fastify: FastifyInstance) {
  // GET /api/products - Liste des produits
  fastify.get('/', async (request, reply) => {
    try {
      const result = await pool.query('SELECT * FROM products ORDER BY ref ASC');
      return { count: result.rows.length, data: result.rows };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la récupération des produits' });
    }
  });

  // GET /api/products/:ref - Détail d'un produit par référence
  fastify.get<{ Params: { ref: string } }>('/:ref', async (request, reply) => {
    try {
      const { ref } = request.params;
      const result = await pool.query('SELECT * FROM products WHERE UPPER(ref) = UPPER($1) LIMIT 1', [ref]);
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Not Found', message: `Produit avec la référence ${ref} introuvable` });
      }
      return result.rows[0];
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Erreur lors de la récupération du produit' });
    }
  });
}
