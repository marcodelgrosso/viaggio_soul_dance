-- Aggiunge la colonna visit_date alla tabella adventure_destination_places
-- Questa colonna permette di specificare una data di visita per ogni luogo

ALTER TABLE adventure_destination_places
ADD COLUMN IF NOT EXISTS visit_date DATE;

-- Aggiungi un indice per migliorare le query per data
CREATE INDEX IF NOT EXISTS idx_adventure_destination_places_visit_date 
ON adventure_destination_places(visit_date);

COMMENT ON COLUMN adventure_destination_places.visit_date IS 'Data prevista per la visita del luogo (opzionale)';

