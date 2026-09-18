import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import pool from './db/index.js';
import productsRoutes from './routes/products.js';

dotenv.config();

const app = Fastify({
  logger: { transport: { target: '@fastify/one-line-logger' } },
});

// Configuration CORS
await app.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
});

// Enregistrement des routes avec préfixe
await app.register(productsRoutes, { prefix: '/api/products' });

// Route santé
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// Route test DB
app.get('/api/test-db', async () => {
  const result = await pool.query('SELECT COUNT(*) as product_count FROM products');
  return { products: Number(result.rows[0].product_count) };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`🚀 Serveur Numeos Agent démarré sur http://0.0.0.0:${port}`);
    
    // Test connexion DB au démarrage
    const res = await pool.query('SELECT 1 as db_check');
    app.log.info(`✅ PostgreSQL connecté: ${res.rows[0].db_check === 1}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
