import { FastifyInstance } from 'fastify';
import { chatWithAgent } from '../agents/numeos-agent.js';

export default async function whatsappRoutes(fastify: FastifyInstance) {
  fastify.log.info('📱 Routes WhatsApp initialisées');

  // POST /api/webhooks/whatsapp - Reçoit les messages entrants de Twilio
  fastify.post('/webhooks/whatsapp', async (request: any, reply: any) => {
    try {
      const { Body: userMessage, From: senderNumber } = (request.body as any) || {};
      
      if (!userMessage) {
        fastify.log.warn('⚠️ Message WhatsApp vide reçu');
        return '';
      }

      fastify.log.info(`📩 WhatsApp [${senderNumber}]: "${userMessage}"`);

      // 1. Appeler l'agent Numeos
      const agentResponse = await chatWithAgent(userMessage);
      
      // 2. Préparer la réponse TwiML (format XML de Twilio)
      let twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(agentResponse.reply)}</Message>`;

      // 3. Si des produits sont trouvés dans l'action_result (si présent)
      const actionResult = (agentResponse as any).action_result;
      if (actionResult?.products?.length > 0) {
        const productsText = actionResult.products
          .map((p: any) => `• ${p.modele} - ${p.prix_mad} MAD (Stock: ${p.stock})`)
          .join('\n');
        
        twimlResponse += `\n\n${escapeXml(productsText)}`;
      }

      twimlResponse += `
</Response>`;

      fastify.log.info(`📤 Réponse envoyée à ${senderNumber}`);
      
      // Retourner en Content-Type XML obligatoire pour Twilio
      reply.header('Content-Type', 'text/xml');
      return twimlResponse;

    } catch (error: any) {
      fastify.log.error(error, 'Erreur Webhook WhatsApp');
      reply.header('Content-Type', 'text/xml');
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Désolé, j'ai eu un problème technique. Réessayez dans un instant.</Message>
</Response>`;
    }
  });

  // GET /api/webhooks/whatsapp - Vérification de Twilio (required)
  fastify.get('/webhooks/whatsapp', async (request, reply) => {
    const { hub_challenge } = request.query as any;
    return hub_challenge || 'ok';
  });
}

// Fonction utilitaire pour échapper les caractères XML
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
