import { FastifyInstance } from 'fastify';
import { chatWithAgent, generateGroundedReply } from '../agents/numeos-agent.js';
import pool from '../db/index.js';

// Dictionnaire de translittération et traduction Darija -> Français (catalogue Kenza)
const DARIJA_TO_FRENCH: Record<string, string> = {
  // Matières
  'jild': 'cuir', 'ljild': 'cuir', "l'jild": 'cuir', 'jeld': 'cuir',
  'qten': 'coton', 'qton': 'coton', 'coton': 'coton',
  'hrir': 'soie', '7rir': 'soie', 'soie': 'soie',
  'denim': 'denim', 'lin': 'lin',

  // Genres
  'nssa': 'femme', 'nsa': 'femme', 'mra': 'femme', '3yalat': 'femme', 'femme': 'femme',
  'rjal': 'homme', 'rjel': 'homme', 'rajel': 'homme', 'drari': 'homme', 'homme': 'homme',

  // Familles / Catégories
  'sac': 'Sac à main', 'siya': 'Sac à main', 'sak': 'Sac à main', 'sidan': 'Sac à main',
  'sebbat': 'Chaussures', 'sbbat': 'Chaussures', 'sbabt': 'Chaussures', 'chaussures': 'Chaussures',
  'serwal': 'Pantalon', 'sarwal': 'Pantalon', 'pantalon': 'Pantalon',
  'qamija': 'Chemise', 'chemija': 'Chemise', 'chemise': 'Chemise',
  'caftan': 'Caftan', 'qftan': 'Caftan', 'kaftan': 'Caftan',
  'robe': 'Robe', 'keswa': 'Robe',
  'veste': 'Veste', 'jakita': 'Veste', 'vesta': 'Veste',
  'blouson': 'Blouson',
  'smata': 'Ceinture', 'hezam': 'Ceinture', '7zam': 'Ceinture', 'ceinture': 'Ceinture',
  'foulard': 'Foulard', 'zif': 'Foulard', 'chale': 'Foulard',

  // Couleurs
  'k7el': 'noir', 'khal': 'noir', 'noir': 'noir',
  'byed': 'blanc cassé', 'byad': 'blanc cassé', 'blanc': 'blanc cassé',
  'khder': 'vert olive', 'vert': 'vert olive',
  '7mer': 'bordeaux', 'hmer': 'bordeaux', 'bordeaux': 'bordeaux',
  'camel': 'camel', 'terracotta': 'terracotta', 'beige': 'beige',
  'gris': 'gris perle', 'zre9': 'bleu nuit', 'bleu': 'bleu nuit', 'ivoire': 'ivoire'
};

// Mots vides en Darija et Français à ignorer dans la recherche
const STOP_WORDS = new Set([
  'bghit', 'brit', 'nkri', 'chri', 'chhal', 'dyal', 'dial', 'taht', 'a9al', 'aqal',
  'dirham', 'dh', 'mad', 'kayn', 'chouf', 'li', 'f', 'fi', 'flous', 'flouss', 'hada', 'hadi',
  'je', 'cherche', 'veux', 'un', 'une', 'des', 'pour', 'en', 'à', 'de', 'du', 'au', 'les', 'le', 'la', 'moins', 'prix'
]);

function translateAndNormalize(text: string): string[] {
  if (!text) return [];
  const words = text.toLowerCase().replace(/['’]/g, ' ').split(/[\s,;.-]+/).filter(w => w.length > 1);
  const translated: string[] = [];

  for (const word of words) {
    if (STOP_WORDS.has(word)) continue;
    if (DARIJA_TO_FRENCH[word]) {
      translated.push(DARIJA_TO_FRENCH[word]);
    } else {
      translated.push(word.replace(/s$/i, '')); // singulariser
    }
  }
  return translated;
}

export default async function agentRoutes(fastify: FastifyInstance) {
  fastify.log.info('🤖 Routes Agent initialisées avec support Darija natif');

  const handleChat = async (request: any, reply: any) => {
    try {
      const { message, history } = request.body || {};

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Le champ "message" est requis'
        });
      }

      fastify.log.info(`📩 Message reçu: "${message}"`);
      if (history && Array.isArray(history) && history.length > 0) {
        fastify.log.info(`📜 Historique reçu: ${history.length} messages`);
      }

      // 1. Détection de l'intention et de l'action
      const llmResponse = await chatWithAgent(message, history);

      let actionResult: any = null;
      let finalReply = llmResponse.reply;

      // 2. Exécution de l'action si présente
      if (llmResponse.action) {
        const actionType = String(llmResponse.action.type || '').toLowerCase();
        const params = llmResponse.action.params || {};
        let catalogHint = '';

        switch (actionType) {
          case 'get_product_detail':
          case 'get_product_details':
          case 'product_detail':
          case 'detail': {
            const ref = String(params.ref || params.reference || params.product_ref || '').trim();
            fastify.log.info(`🔎 Recherche détail pour la référence: "${ref}"`);

            if (!ref) {
              actionResult = { found: false, message: 'Référence produit non fournie' };
              break;
            }

            const detailResult = await pool.query(
              'SELECT * FROM products WHERE UPPER(ref) = UPPER($1) LIMIT 1',
              [ref]
            );

            if (detailResult.rows.length > 0) {
              const p = detailResult.rows[0];
              actionResult = {
                found: true,
                product: {
                  ref: p.ref, modele: p.modele, famille: p.famille, genre: p.genre,
                  couleur: p.couleur, taille: p.taille, matiere: p.matiere, saison: p.saison,
                  prix_mad: Number(p.prix_mad), stock: p.stock, delai_reassort_jours: p.delai_reassort_jours,
                  code_barre: p.code_barre, poids_g: p.poids_g
                }
              };
            } else {
              actionResult = { found: false, message: `Produit ${ref} introuvable` };
            }
            break;
          }

          case 'search_products':
          case 'search_product':
          case 'search': {
            const category = params.category ?? params.categorie ?? params.famille;
            const price_max = params.price_max ?? params.prix_max ?? params.max_price;
            const query = params.query ?? params.q;

            fastify.log.info(`🔍 PARAMS BRUTS DU LLM: category=${category}, price_max=${price_max}, query=${query}`);

            const priceMax = Number(price_max) || null;
            const rawCategory = String(category || '').trim();
            const rawMatiere = String(params.matiere || params.material || '').trim();
            const rawGenre = String(params.genre || params.gender || '').trim();
            const rawCouleur = String(params.couleur || params.color || '').trim();
            const rawQuery = String(query || '').trim();

            // Traduction et normalisation des mots clés
            const allTerms = [
              ...translateAndNormalize(rawCategory),
              ...translateAndNormalize(rawMatiere),
              ...translateAndNormalize(rawGenre),
              ...translateAndNormalize(rawCouleur),
              ...translateAndNormalize(rawQuery),
              ...translateAndNormalize(message)
            ];

            const uniqueTokens = Array.from(new Set(allTerms));
            fastify.log.info(`🧠 Tokens traduits vers le catalogue: ${JSON.stringify(uniqueTokens)}`);

            // --- REQUÊTE STRICTE ---
            let sql = 'SELECT * FROM products WHERE 1=1 AND stock > 0';
            const sqlParams: any[] = [];
            let pIdx = 1;

            if (priceMax !== null && !isNaN(priceMax)) {
              sql += ` AND prix_mad <= $${pIdx}`;
              sqlParams.push(priceMax);
              pIdx++;
            }

            for (const token of uniqueTokens) {
              sql += ` AND (modele ILIKE $${pIdx} OR famille ILIKE $${pIdx} OR matiere ILIKE $${pIdx} OR genre ILIKE $${pIdx} OR couleur ILIKE $${pIdx})`;
              sqlParams.push(`%${token}%`);
              pIdx++;
            }

            sql += ' ORDER BY prix_mad ASC LIMIT 10';
            fastify.log.info(`🔍 SQL Générée (stricte): ${sql} | Params: ${JSON.stringify(sqlParams)}`);
            let result = await pool.query(sql, sqlParams);

            // --- FALLBACK CORRIGÉ : RESPECT TOUJOURS LE PRIX MAX ---
            if (result.rows.length === 0 && uniqueTokens.length > 0) {
              fastify.log.info('⚠️ 0 résultat strict -> Fallback assoupli (MAIS PRIX MAX CONSERVÉ)');

              const mainToken = uniqueTokens.find(t => ['Sac à main', 'Chaussures', 'Caftan', 'Veste', 'Pantalon', 'Robe', 'Chemise', 'Ceinture', 'Foulard', 'cuir'].includes(t)) || uniqueTokens[0];

              let fallbackSql = 'SELECT * FROM products WHERE stock > 0 AND (famille ILIKE $1 OR modele ILIKE $1 OR matiere ILIKE $1)';
              const fallbackParams: any[] = [`%${mainToken}%`];

              if (priceMax !== null && !isNaN(priceMax)) {
                fallbackSql += ` AND prix_mad <= $2`;
                fallbackParams.push(priceMax);
              }

              fallbackSql += ' ORDER BY prix_mad ASC LIMIT 5';

              fastify.log.info(`🔍 SQL Fallback: ${fallbackSql} | Params: ${JSON.stringify(fallbackParams)}`);
              result = await pool.query(fallbackSql, fallbackParams);
            }

            // 🛡️ SÉCURITÉ BACKEND : Filtre de sécurité final anti-hallucination prix
            let finalRows = result.rows;
            if (priceMax !== null && !isNaN(priceMax)) {
              finalRows = finalRows.filter((p: any) => Number(p.prix_mad) <= priceMax);
            }

            // Si 0 résultat, récupérer les informations réelles du catalogue pour que l'agent explique la vérité
            if (finalRows.length === 0) {
              const hintQuery = await pool.query(
                `SELECT modele, famille, matiere, prix_mad, stock 
                 FROM products 
                 WHERE famille ILIKE $1 OR matiere ILIKE $2 OR modele ILIKE $1 
                 ORDER BY prix_mad ASC LIMIT 4`,
                [`%${rawCategory || 'Sac à main'}%`, `%${rawMatiere || 'cuir'}%`]
              );
              if (hintQuery.rows.length > 0) {
                catalogHint = `Articles réels dans le catalogue: ` + hintQuery.rows.map(r => `${r.modele} (${r.matiere}, ${r.prix_mad} MAD, stock: ${r.stock})`).join(' | ');
              }
            }

            actionResult = {
              count: finalRows.length,
              products: finalRows.map((p: any) => ({
                ref: p.ref, modele: p.modele, famille: p.famille, genre: p.genre,
                couleur: p.couleur, taille: p.taille, matiere: p.matiere,
                prix_mad: Number(p.prix_mad), stock: p.stock, delai_reassort_jours: p.delai_reassort_jours
              }))
            };
            break;
          }

          default:
            fastify.log.warn(`⚠️ Action inconnue: "${actionType}"`);
        }

        // 3. Génération de la réponse finale ancrée dans la réalité des données réelles DB
        finalReply = await generateGroundedReply(
          message,
          history,
          actionType,
          params,
          actionResult,
          catalogHint
        );
      }

      // 4. Retourner la réponse complète
      return {
        reply: finalReply,
        action_executed: !!llmResponse.action,
        action_result: actionResult
      };

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: "Erreur lors du traitement par l'agent",
      });
    }
  };

  // POST /api/agent/chat
  fastify.post<{ Body: { message: string; history?: any[] } }>('/chat', handleChat);

  // POST /api/agent (fallback)
  fastify.post<{ Body: { message: string; history?: any[] } }>('/', handleChat);
}