-- =============================================================================
-- NUMEOS HACKATHON - IMPORT DES DONNEES CSV (sujet-02-kenza)
-- =============================================================================

\set ON_ERROR_STOP on

-- S'assurer que les tables existent
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

CREATE TABLE IF NOT EXISTS delivery_zones (
    ville VARCHAR(100) PRIMARY KEY,
    frais_mad DECIMAL(10,2) NOT NULL,
    delai_heures INTEGER NOT NULL,
    paiement_a_la_livraison VARCHAR(10) DEFAULT 'non',
    retrait_boutique VARCHAR(10) DEFAULT 'non'
);

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

-- 1. Catalogue / Produits (13 colonnes)
\COPY products(ref, modele, famille, genre, couleur, taille, matiere, saison, prix_mad, stock, delai_reassort_jours, code_barre, poids_g) FROM '/docker-entrypoint-initdb.d/catalogue.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF8', NULL '');

-- 2. Clients (8 colonnes)
\COPY clients(client_id, nom, telephone, ville, langue_preferee, premier_achat, nb_commandes, segment) FROM '/docker-entrypoint-initdb.d/clients.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF8', NULL '');

-- 3. Commandes (10 colonnes)
\COPY orders(commande_id, client_id, date, canal, statut, total_articles_mad, frais_livraison_mad, total_mad, ville_livraison, paiement) FROM '/docker-entrypoint-initdb.d/commandes.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF8', NULL '');

-- 4. Lignes de commande (6 colonnes - id et subtotal auto-générés)
\COPY order_lines(commande_id, ref, modele, taille, quantite, prix_unitaire_mad) FROM '/docker-entrypoint-initdb.d/commandes-lignes.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF8', NULL '');

-- 5. Zones de livraison (5 colonnes)
\COPY delivery_zones(ville, frais_mad, delai_heures, paiement_a_la_livraison, retrait_boutique) FROM '/docker-entrypoint-initdb.d/livraison.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF8', NULL '');

-- 6. Promotions (7 colonnes - id auto-généré)
\COPY promotions(ref, modele, prix_normal_mad, prix_promo_mad, debut, fin, condition) FROM '/docker-entrypoint-initdb.d/promotions.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF8', NULL '');
