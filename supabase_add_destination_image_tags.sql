-- Migration: Aggiungi immagine e tags alle destinazioni delle avventure
-- Esegui questo script nella SQL Editor di Supabase

-- Aggiungi colonna image_url per l'immagine della destinazione
ALTER TABLE adventure_destinations 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Aggiungi colonna tags come array JSON per i tag della destinazione
ALTER TABLE adventure_destinations 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Crea indice GIN per i tag per migliorare le query
CREATE INDEX IF NOT EXISTS idx_adventure_destinations_tags ON adventure_destinations USING GIN (tags);

-- Aggiungi commenti alle colonne
COMMENT ON COLUMN adventure_destinations.image_url IS 'URL dell''immagine rappresentativa della destinazione';
COMMENT ON COLUMN adventure_destinations.tags IS 'Array JSON dei tag associati alla destinazione (es: ["Storia", "Cultura", "Gastronomia"])';

