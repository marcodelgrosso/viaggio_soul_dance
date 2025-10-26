-- Elimina la tabella esistente se presente (per ricrearla con i nuovi campi)
DROP TABLE IF EXISTS destination_votes CASCADE;

-- Tabella per registrare le votazioni delle destinazioni
CREATE TABLE destination_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    destination_id VARCHAR(50) NOT NULL, -- 'seville', 'london', 'birmingham', 'geneva'
    vote_type VARCHAR(10) NOT NULL, -- 'yes' o 'no'
    comment TEXT,
    user_code VARCHAR(100) NOT NULL, -- Codice univoco utente (es: nome.cognome)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_ip VARCHAR(45), -- Indirizzo IP (opzionale, per statistiche)
    UNIQUE(destination_id, user_code) -- Garantisce un solo voto per utente per destinazione
);

-- Indice per migliorare le query
CREATE INDEX IF NOT EXISTS idx_destination_votes_destination ON destination_votes(destination_id);
CREATE INDEX IF NOT EXISTS idx_destination_votes_user_code ON destination_votes(user_code);
CREATE INDEX IF NOT EXISTS idx_destination_votes_created_at ON destination_votes(created_at);

-- IMPORTANTE: Disattiva RLS per permettere inserzioni senza autenticazione
ALTER TABLE destination_votes DISABLE ROW LEVEL SECURITY;

-- Trigger per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_destination_votes_updated_at
    BEFORE UPDATE ON destination_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Funzione per ottenere le statistiche delle votazioni
CREATE OR REPLACE FUNCTION get_vote_statistics()
RETURNS TABLE (
    destination_id VARCHAR,
    destination_name VARCHAR,
    total_votes BIGINT,
    yes_votes BIGINT,
    no_votes BIGINT,
    percentage_yes NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id::VARCHAR as destination_id,
        d.name as destination_name,
        COUNT(*)::BIGINT as total_votes,
        COUNT(*) FILTER (WHERE d.vote_type = 'yes')::BIGINT as yes_votes,
        COUNT(*) FILTER (WHERE d.vote_type = 'no')::BIGINT as no_votes,
        ROUND(
            100.0 * COUNT(*) FILTER (WHERE d.vote_type = 'yes') / NULLIF(COUNT(*), 0),
            2
        )::NUMERIC as percentage_yes
    FROM destination_votes d
    GROUP BY d.destination_id
    ORDER BY total_votes DESC;
END;
$$ LANGUAGE plpgsql;

-- Tabella per i nomi delle destinazioni (opzionale, per riferimento)
CREATE TABLE IF NOT EXISTS destinations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Inserimento dei dati delle destinazioni
INSERT INTO destinations (id, name) VALUES
    ('seville', 'Siviglia, Spagna'),
    ('london', 'Londra, Regno Unito'),
    ('birmingham', 'Birmingham, Regno Unito'),
    ('geneva', 'Ginevra, Svizzera')
ON CONFLICT (id) DO NOTHING;

