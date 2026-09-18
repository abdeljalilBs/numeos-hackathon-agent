import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

dotenv.config();

const app = Fastify({
  logger: {
    transport: {
      target: '@fastify/one-line-logger',
    },
  },
});

await app.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
});

app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`🚀 Serveur Numeos Agent démarré sur http://0.0.0.0:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
