-- Script per aggiornare la tabella existente con il supporto per user_code
-- Usa questo file se hai già eseguito supabase_setup.sql in precedenza

-- Aggiungi colonna user_code se non esiste
ALTER TABLE destination_votes 
ADD COLUMN IF NOT EXISTS user_code VARCHAR(100);

-- Aggiungi colonna updated_at se non esiste
ALTER TABLE destination_votes 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Crea la funzione per il trigger se non esiste
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crea il trigger se non esiste
DROP TRIGGER IF EXISTS update_destination_votes_updated_at ON destination_votes;

CREATE TRIGGER update_destination_votes_updated_at
    BEFORE UPDATE ON destination_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Aggiungi indice per user_code se non esiste
CREATE INDEX IF NOT EXISTS idx_destination_votes_user_code 
ON destination_votes(user_code);

-- Aggiungi vincolo UNIQUE per (destination_id, user_code)
-- Rimuovi eventuali constraint esistenti
DO $$ 
BEGIN
    -- Rimuovi eventuali vincoli duplicate
    ALTER TABLE destination_votes 
    DROP CONSTRAINT IF EXISTS destination_votes_destination_id_user_code_key;
    
    -- Aggiungi il vincolo UNIQUE
    ALTER TABLE destination_votes 
    ADD CONSTRAINT destination_votes_destination_id_user_code_key 
    UNIQUE(destination_id, user_code);
EXCEPTION 
    WHEN duplicate_object THEN
        -- Se il constraint esiste già, non fare nulla
        NULL;
END $$;

