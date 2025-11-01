-- Aggiorna la tabella user_notifications per aggiungere i campi metadata e action_taken
-- Esegui questo script nella SQL Editor di Supabase se i campi non esistono già

-- Aggiungi metadata se non esiste
ALTER TABLE user_notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Aggiungi action_taken se non esiste
ALTER TABLE user_notifications 
ADD COLUMN IF NOT EXISTS action_taken BOOLEAN DEFAULT false;

-- Commenti
COMMENT ON COLUMN user_notifications.metadata IS 'Dati aggiuntivi in formato JSON (es: adventure_id, participant_id, inviter_id per gli inviti)';
COMMENT ON COLUMN user_notifications.action_taken IS 'Indica se è stata presa un''azione sulla notifica (es: accettato/rifiutato invito)';

