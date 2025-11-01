-- Migration: Aggiungi tipo di voto "proponi" alle destinazioni
-- Esegui questo script nella SQL Editor di Supabase

-- Rimuovi il constraint esistente
ALTER TABLE adventure_destination_votes 
DROP CONSTRAINT IF EXISTS adventure_destination_votes_vote_type_check;

-- Aggiungi il nuovo constraint con 'proponi'
ALTER TABLE adventure_destination_votes 
ADD CONSTRAINT adventure_destination_votes_vote_type_check 
CHECK (vote_type IN ('yes', 'no', 'proponi'));

-- Aggiorna il commento della colonna
COMMENT ON COLUMN adventure_destination_votes.vote_type IS 'Tipo di voto: yes (mi piace), no (non mi convince), proponi (propongo modifiche)';

