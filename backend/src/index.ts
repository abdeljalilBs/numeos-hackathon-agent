import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import pool from './db/index.js';

// Imports des modules de routes
import productsRoutes from './routes/products.js';
import clientsRoutes from './routes/clients.js';
import ordersRoutes from './routes/orders.js';
import orderLinesRoutes from './routes/order_lines.js';
import deliveryZonesRoutes from './routes/delivery_zones.js';
import promotionsRoutes from './routes/promotions.js';
import conversationsRoutes from './routes/conversations.js';
import messagesRoutes from './routes/messages.js';
import escalationsRoutes from './routes/escalations.js';
import scheduledFollowupsRoutes from './routes/scheduled_followups.js';

dotenv.config();

const app = Fastify({
  logger: { transport: { target: '@fastify/one-line-logger' } },
});

// Middleware CORS
await app.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
});

// Route santé
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// Route test DB
app.get('/api/test-db', async () => {
  const result = await pool.query('SELECT COUNT(*) as product_count FROM products');
  return { products: Number(result.rows[0].product_count) };
});

// Enregistrement modulaire des routes avec leurs préfixes distincts
await app.register(productsRoutes, { prefix: '/api/products' });
await app.register(clientsRoutes, { prefix: '/api/clients' });
await app.register(ordersRoutes, { prefix: '/api/orders' });
await app.register(orderLinesRoutes, { prefix: '/api/order-lines' });
await app.register(deliveryZonesRoutes, { prefix: '/api/delivery-zones' });
await app.register(promotionsRoutes, { prefix: '/api/promotions' });
await app.register(conversationsRoutes, { prefix: '/api/conversations' });
await app.register(messagesRoutes, { prefix: '/api/messages' });
await app.register(escalationsRoutes, { prefix: '/api/escalations' });
await app.register(scheduledFollowupsRoutes, { prefix: '/api/scheduled-followups' });

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`🚀 Serveur Numeos Agent démarré sur http://0.0.0.0:${port}`);
    
    const res = await pool.query('SELECT COUNT(*) as count FROM products');
    app.log.info(`✅ PostgreSQL connecté - ${res.rows[0].count} produits chargés`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
