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

// Prompt système OPTIMISÉ : Simple, clair, sans exemples de réponses textuelles
const SYSTEM_PROMPT = `Tu es l'agent commercial Numeos (Maroc). Tu aides les clients à trouver des produits Kenza.

RÈGLE DE LANGUE ABSOLUE :
- Utilisateur parle DARIJA (bghit, chhal, dyal, dirham...) → Réponds EN DARIJA.
- Utilisateur parle FRANÇAIS → Réponds EN FRANÇAIS.
- Ne mélange JAMAIS les langues.

TON RÔLE :
1. Analyse la demande.
2. Génère UNE SEULE réponse JSON valide contenant "reply" et optionnellement "action".
3. "reply" doit être une phrase naturelle dans la langue de l'utilisateur.
4. Si l'utilisateur cherche des produits, utilise l'action "search_products".
5. TRADUIS TOUJOURS les paramètres en FRANÇAIS pour la DB (jild=cuir, nssa=femme, sac=Sac à main).

FORMAT JSON OBLIGATOIRE (Ne mets RIEN d'autre) :
{
  "reply": "Ta réponse textuelle ici (Darija ou Français selon l'utilisateur)",
  "action": {
    "type": "search_products",
    "params": {
      "category": "Sac à main", 
      "matiere": "cuir", 
      "genre": "femme", 
      "price_max": 800
    }
  }
}

OU pour un détail produit :
{
  "reply": "Ta réponse textuelle ici",
  "action": {
    "type": "get_product_detail",
    "params": { "ref": "REF-XXXX" }
  }
}

IMPORTANT : Sois créatif dans "reply". Cite les produits si tu as les infos. Ne sois pas robotique.`;

export interface AgentResponse {
  reply: string;
  action?: {
    type: 'search_products' | 'get_product_detail' | 'check_stock';
    params: Record<string, any>;
  };
}

export async function chatWithAgent(userMessage: string): Promise<AgentResponse> {
  try {
    const completion = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('Réponse vide du LLM');

    // Debug log pour voir ce qui sort vraiment du LLM
    console.log('🔍 RAW LLM OUTPUT:', content.substring(0, 200)); 

    const parsed = JSON.parse(content);
    
    return {
      reply: parsed.reply || "Ma fhemtch mzyan, chouf t9der t3awed liya?",
      action: parsed.action || undefined
    };
  } catch (error) {
    console.error('❌ Erreur Agent Numeos:', error);
    return {
      reply: "Désolé/Dakchi ma khdamch mzyan, 3awed 3afak.",
      action: undefined
    };
  }
}
