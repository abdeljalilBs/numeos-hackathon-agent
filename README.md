# 🤖 Numeos Hackathon Agent - Agent Commercial Autonome

Agent commercial intelligent connecté au catalogue Kenza, capable de comprendre le langage naturel et d'interroger une base de données PostgreSQL en temps réel.

## ✅ Ce qui est fonctionnel (Tâches 1, 2 & 3)

- **Infrastructure** : Docker Compose avec PostgreSQL + Redis
- **Backend API** : Fastify + TypeScript ESM sur port 3000
- **Base de Données** : 80 produits, 120 clients, 320 commandes seedés
- **Routes API** : `/api/products`, `/api/clients`, `/api/orders` fonctionnelles
- **Agent LLM** : Endpoint `/api/agent/chat` connecté à Azure OpenAI (GPT-4.1)
- **Function Calling** : L'agent exécute des requêtes SQL réelles (zéro hallucination)

## ⚡ Démarrage Rapide

```bash
# 1. Lancer la DB
docker compose up -d

# 2. Installer & lancer le backend
cd backend && npm install && npm run dev

# 3. Tester l'agent
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Je cherche un sac en cuir < 800 MAD"}'
