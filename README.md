# ️ Numeos Hackathon Agent - Agent Commercial Autonome E-commerce Maroc

Agent commercial intelligent connecté au catalogue Kenza, capable de comprendre le langage naturel et d'interroger une base de données PostgreSQL en temps réel pour recommander des produits pertinents.

## 🚀 Fonctionnalités Validées

- **Compréhension NLP** : Analyse des intentions client (recherche produit, filtre prix, catégorie) via GPT-4.1/Azure OpenAI
- **Connexion DB Temps Réel** : Requêtes SQL dynamiques générées par l'IA sur PostgreSQL (80 produits, 120 clients, 320 commandes)
- **API REST Documentée** : Endpoint `/api/agent/chat` testable via Postman/cURL
- **Architecture Modulaire** : Fastify + TypeScript ESM + Docker Compose
- **Zéro Hallucination Données** : L'agent ne répond qu'avec des produits existants en base

## 🏗️ Architecture Technique

```text
numeos-hackathon-agent/
── backend/
│   ├── src/
│   │   ├── agents/       # Cerveau LLM (Numeos Agent)
│   │   ├── routes/       # API REST (Products, Clients, Orders, Agent)
│   │   ├── db/           # Pool PostgreSQL
│   │   └── index.ts      # Entry point Fastify
│   ├── docker-compose.yml
│   └── .env              # Clés API Azure OpenAI + DB Credentials
├── db/init/
│   ├── 01-schema.sql     # Schéma complet (10 tables)
│   └── 02-seed-data.sql  # Données Kenza (80 produits seedés)
└── USER_STORIES.md
