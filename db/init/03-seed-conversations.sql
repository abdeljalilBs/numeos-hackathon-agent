-- =============================================================================
-- NUMEOS HACKATHON - IMPORT DES CONVERSATIONS JSONL (sujet-02-kenza)
-- =============================================================================

DO $$
DECLARE
    line TEXT;
    json_data JSONB;
    conv_id INTEGER;
    tour JSONB;
BEGIN
    FOR line IN 
        SELECT regexp_split_to_table(
            pg_read_file('/docker-entrypoint-initdb.d/conversations.jsonl'), 
            E'\n'
        )
    LOOP
        IF line IS NOT NULL AND length(trim(line)) > 0 THEN
            BEGIN
                json_data := line::jsonb;
                
                -- Insérer la conversation
                INSERT INTO conversations (conv_code, client_id, channel, language, intention, difficulty, metadata)
                VALUES (
                    json_data->>'id',
                    json_data->>'client_id',
                    COALESCE(json_data->>'canal', 'whatsapp'),
                    COALESCE(json_data->>'langue', 'fr'),
                    json_data->>'intention',
                    json_data->>'difficulte',
                    json_data
                )
                RETURNING id INTO conv_id;
                
                -- Insérer les messages (tours de parole)
                IF json_data ? 'tours' THEN
                    FOR tour IN SELECT * FROM jsonb_array_elements(json_data->'tours')
                    LOOP
                        INSERT INTO messages (conversation_id, sender, content, language)
                        VALUES (
                            conv_id,
                            tour->>'role',
                            tour->>'texte',
                            COALESCE(json_data->>'langue', 'fr')
                        );
                    END LOOP;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Erreur import conversation (%): %', json_data->>'id', SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;