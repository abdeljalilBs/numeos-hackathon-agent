-- =============================================================================
-- NUMEOS HACKATHON - SCHEMA DE LA BASE DE DONNEES (sujet-02-kenza)
-- =============================================================================

-- 1. Catalogue / Produits
CREATE TABLE IF NOT EXISTS products (
    ref VARCHAR(50) PRIMARY KEY,
    modele VARCHAR(255) NOT NULL,
    famille VARCHAR(100),
    genre VARCHAR(50),
    couleur VARCHAR(50),
    taille VARCHAR(50),
    matiere VARCHAR(100),
    saison VARCHAR(50),
    prix_mad DECIMAL(10,2) NOT NULL CHECK (prix_mad >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    delai_reassort_jours INTEGER,
    code_barre VARCHAR(50),
    poids_g INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Clients
CREATE TABLE IF NOT EXISTS clients (
    client_id VARCHAR(50) PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    telephone VARCHAR(50),
    ville VARCHAR(100),
    langue_preferee VARCHAR(20) DEFAULT 'fr',
    premier_achat DATE,
    nb_commandes INTEGER DEFAULT 0,
    segment VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Commandes
CREATE TABLE IF NOT EXISTS orders (
    commande_id VARCHAR(50) PRIMARY KEY,
    client_id VARCHAR(50) REFERENCES clients(client_id),
    date DATE NOT NULL,
    canal VARCHAR(50),
    statut VARCHAR(50) NOT NULL,
    total_articles_mad DECIMAL(10,2) NOT NULL DEFAULT 0,
    frais_livraison_mad DECIMAL(10,2) DEFAULT 0,
    total_mad DECIMAL(10,2) NOT NULL DEFAULT 0,
    ville_livraison VARCHAR(100),
    paiement VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Lignes de commande
CREATE TABLE IF NOT EXISTS order_lines (
    id SERIAL PRIMARY KEY,
    commande_id VARCHAR(50) REFERENCES orders(commande_id) ON DELETE CASCADE,
    ref VARCHAR(50) REFERENCES products(ref),
    modele VARCHAR(255),
    taille VARCHAR(50),
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    prix_unitaire_mad DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (quantite * prix_unitaire_mad) STORED
);

-- 5. Zones de livraison
CREATE TABLE IF NOT EXISTS delivery_zones (
    ville VARCHAR(100) PRIMARY KEY,
    frais_mad DECIMAL(10,2) NOT NULL,
    delai_heures INTEGER NOT NULL,
    paiement_a_la_livraison VARCHAR(10) DEFAULT 'non',
    retrait_boutique VARCHAR(10) DEFAULT 'non'
);

-- 6. Promotions
CREATE TABLE IF NOT EXISTS promotions (
    id SERIAL PRIMARY KEY,
    ref VARCHAR(50) REFERENCES products(ref),
    modele VARCHAR(255) NOT NULL,
    prix_normal_mad DECIMAL(10,2) NOT NULL,
    prix_promo_mad DECIMAL(10,2) NOT NULL,
    debut DATE,
    fin DATE,
    condition TEXT
);

-- 7. Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    conv_code VARCHAR(50),
    client_id VARCHAR(50) REFERENCES clients(client_id),
    channel VARCHAR(50) DEFAULT 'whatsapp',
    status VARCHAR(50) DEFAULT 'active',
    language VARCHAR(20) DEFAULT 'fr',
    intention VARCHAR(100),
    difficulty VARCHAR(50),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- 8. Messages
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'client', 'agent', 'system')),
    content TEXT NOT NULL,
    language VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- 9. Escalades
CREATE TABLE IF NOT EXISTS escalations (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    reason TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending',
    resolved_by VARCHAR(50),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Relances planifiées
CREATE TABLE IF NOT EXISTS scheduled_followups (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(50) REFERENCES clients(client_id),
    conversation_id INTEGER REFERENCES conversations(id),
    message_template TEXT NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_products_famille ON products(famille);
CREATE INDEX IF NOT EXISTS idx_products_couleur ON products(couleur);
CREATE INDEX IF NOT EXISTS idx_clients_telephone ON clients(telephone);
CREATE INDEX IF NOT EXISTS idx_clients_ville ON clients(ville);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_statut ON orders(statut);
CREATE INDEX IF NOT EXISTS idx_order_lines_commande_id ON order_lines(commande_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_ref ON order_lines(ref);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_followups_status ON scheduled_followups(status);
