import { AzureOpenAI, OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const isAzure = Boolean(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY);

const client = isAzure
  ? new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1',
  })
  : new OpenAI({
    apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || 'dummy_key',
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  });

const modelName = isAzure
  ? (process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1')
  : (process.env.LLM_MODEL || 'gpt-4o');

// Prompt système pour la détection d'intention et des actions
const SYSTEM_PROMPT = `Tu es l'agent commercial IA de la marque marocaine Kenza (mode, maroquinerie, artisanat haut de gamme).
Tu aides les clients à trouver des articles dans le catalogue.

RÈGLE DE LANGUE ABSOLUE :
- Utilisateur parle DARIJA (bghit, chhal, dyal, dirham, sac, jild, kenz...) → Réponds EN DARIJA.
- Utilisateur parle FRANÇAIS → Réponds EN FRANÇAIS.
- Ne mélange JAMAIS les langues.

RÈGLE DE MÉMOIRE CONVERSATIONNELLE :
- Analyse TOUT l'historique de la conversation pour comprendre le contexte complet.
- Si un budget, matière ou catégorie a été mentionné plus tôt, conserve-le pour la suite de la recherche sauf si l'utilisateur change d'avis.
- Si l'utilisateur dit "ah", "werrini", "3tini nchof", "montre moi", "le premier", etc., réfère-toi au dernier sujet abordé.

ACTIONS POSSIBLES :
1. "search_products" : Quand le client cherche des produits, demande à voir des articles, filtre par budget, catégorie, couleur ou matière.
   Traduis les termes en français pour la base de données :
   - jild -> "cuir", qten -> "coton", hrir -> "soie"
   - sac / sak -> "Sac à main", sebbat -> "Chaussures", serwal -> "Pantalon", qamija -> "Chemise", caftan -> "Caftan", robe / keswa -> "Robe", smata -> "Ceinture", foulard -> "Foulard", veste -> "Veste"
   - k7el -> "noir", byed -> "blanc cassé", 7mer -> "bordeaux", khder -> "vert olive", zre9 -> "bleu nuit"

2. "get_product_detail" : Quand le client demande des infos précises sur une référence spécifique (ex: "REF-0015", "REF-0007").

FORMAT DE RÉPONSE OBLIGATOIRE (JSON pur) :
Si une action est nécessaire :
{
  "action": {
    "type": "search_products",
    "params": {
      "category": "Sac à main",
      "matiere": "cuir",
      "price_max": 300
    }
  },
  "reply": ""
}

Si AUCUNE action n'est requise (salutations, questions générales de livraison, politesse) :
{
  "action": null,
  "reply": "Marhba bik! 👋 Kifach n9der n3awnek lyoum f les collections dyal Kenza?"
}`;

const GROUNDING_SYSTEM_PROMPT = `Tu es l'agent commercial Kenza (Maroc). Tu viens d'exécuter une recherche dans le catalogue et tu disposes des VRAIS résultats de la base de données.

RÈGLE DE LANGUE STRICTE :
- Client en DARIJA -> Réponds EN DARIJA naturel, chaleureux et professionnel.
- Client en FRANÇAIS -> Réponds EN FRANÇAIS.

RÈGLES DE VÉRACITÉ ABSOLUE (ZÉRO HALLUCINATION) :
1. Si count > 0 : Annonce avec enthousiasme les produits trouvés (les cartes produits s'affichent automatiquement sous ton message). Reste concis (1 phrase).
2. Si count === 0 :
   - Dis CLAIREMENT et HONNÊTEMENT qu'aucun produit n'a été trouvé avec ces critères précis ou dans ce budget.
   - Si un budget était spécifié (ex: 300 DH pour des sacs) et que le catalogue hint indique les vrais prix (ex: sacs à partir de 600 DH), mentionne le vrai prix de départ et propose une alternative (ex: autre matière, augmenter le budget, ou voir d'autres articles cuir comme pantalon/ceinture).
   - Si l'article est en rupture de stock (stock: 0), signale-le honnêtement.
   - NE DIS JAMAIS "Hada wahd l'ikhtiyar" OU "Hahoma" quand count est 0 !
3. Reste concis, commercial, vendeur et très poli (1 à 2 phrases max).
4. Réponds UNIQUEMENT avec le texte de ta réponse (texte brut sans format JSON).`;

export interface AgentResponse {
  reply: string;
  action?: {
    type: 'search_products' | 'get_product_detail' | 'check_stock';
    params: Record<string, any>;
  };
}

export type MessageHistoryItem = { role: string; content: string } | string;

function buildHistoryMessages(history?: MessageHistoryItem[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (!history || !Array.isArray(history)) return [];
  const result: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  for (const h of history) {
    if (typeof h === 'string' && h.trim().length > 0) {
      result.push({ role: 'user', content: h.trim() });
    } else if (h && typeof h === 'object' && h.content && typeof h.content === 'string') {
      const role = h.role === 'assistant' || (h as any).role === 'bot' ? 'assistant' : 'user';
      result.push({ role, content: h.content.trim() });
    }
  }
  return result;
}

export async function chatWithAgent(userMessage: string, history?: MessageHistoryItem[]): Promise<AgentResponse> {
  try {
    const historyMessages = buildHistoryMessages(history);
    const messagesPayload: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historyMessages,
      { role: 'user', content: userMessage }
    ];

    const completion = await client.chat.completions.create({
      model: modelName,
      messages: messagesPayload,
      temperature: 0.3,
      max_tokens: 350,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('Réponse vide du LLM');

    console.log('🔍 Intent LLM Output:', content);

    const parsed = JSON.parse(content);

    return {
      reply: parsed.reply || '',
      action: parsed.action || undefined
    };
  } catch (error) {
    console.error('❌ Erreur chatWithAgent:', error);
    return {
      reply: "Marhba! Kifach n9der n3awnek?",
      action: undefined
    };
  }
}

export async function generateGroundedReply(
  userMessage: string,
  history: MessageHistoryItem[] | undefined,
  actionType: string,
  actionParams: Record<string, any>,
  actionResult: any,
  catalogHint?: string
): Promise<string> {
  try {
    const historyMessages = buildHistoryMessages(history);
    
    const dbSummary = {
      action: actionType,
      params_recherche: actionParams,
      nombre_produits_trouves: actionResult?.count ?? (actionResult?.product ? 1 : 0),
      produits_trouves: actionResult?.products?.map((p: any) => ({
        modele: p.modele,
        matiere: p.matiere,
        prix: `${p.prix_mad} MAD`,
        stock: p.stock
      })) || (actionResult?.product ? [actionResult.product] : []),
      info_catalogue_supplementaire: catalogHint || null
    };

    const promptUserContent = `Message du client: "${userMessage}"
Données réelles de la base de données:
${JSON.stringify(dbSummary, null, 2)}

Rédige la réponse commerciale finale adaptée au client (en Darija ou Français selon sa langue) en respectant les résultats réels ci-dessus.`;

    const messagesPayload: any[] = [
      { role: 'system', content: GROUNDING_SYSTEM_PROMPT },
      ...historyMessages,
      { role: 'user', content: promptUserContent }
    ];

    const completion = await client.chat.completions.create({
      model: modelName,
      messages: messagesPayload,
      temperature: 0.5,
      max_tokens: 300
    });

    const finalContent = completion.choices[0].message.content?.trim();
    if (finalContent) {
      return finalContent;
    }
  } catch (error) {
    console.error('❌ Erreur generateGroundedReply:', error);
  }

  // Fallback sûr en cas d'erreur LLM
  if (actionResult?.count > 0) {
    return "Hahoma les produits li l9ina lik f stock Kenza:";
  } else {
    return "Smehliya, ma l9itch chi produit b had les critères f stock. Bghiti tchouf chi haja okhra?";
  }
}