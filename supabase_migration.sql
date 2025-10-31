-- Script di migrazione per aggiornare la tabella destination_votes
-- per supportare l'autenticazione Supabase con user_id e user_email

-- 1. Aggiungi le nuove colonne se non esistono già
ALTER TABLE destination_votes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- 2. Crea un indice per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_destination_votes_user_id ON destination_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_destination_votes_destination_user ON destination_votes(destination_id, user_id);

-- 3. (Opzionale) Se vuoi mantenere user_code per compatibilità durante la migrazione,
-- puoi lasciarlo. Altrimenti, rimuovilo con:
-- ALTER TABLE destination_votes DROP COLUMN IF EXISTS user_code;

-- 4. Aggiorna le policy RLS per permettere agli utenti autenticati di inserire/modificare i propri voti
-- Prima rimuovi le policy esistenti se necessario:
DROP POLICY IF EXISTS "Users can insert their own votes" ON destination_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON destination_votes;
DROP POLICY IF EXISTS "Users can view all votes" ON destination_votes;

-- Crea nuove policy RLS
CREATE POLICY "Users can insert their own votes"
  ON destination_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON destination_votes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all votes"
  ON destination_votes
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. (Opzionale) Se vuoi permettere anche agli utenti anonimi di vedere i voti (senza autenticazione):
-- CREATE POLICY "Anyone can view votes"
--   ON destination_votes
--   FOR SELECT
--   TO anon
--   USING (true);

-- Note importanti:
-- - user_id sarà popolato automaticamente dall'ID dell'utente Supabase autenticato
-- - user_email sarà popolato dall'email dell'utente autenticato
-- - Le policy RLS assicurano che gli utenti possano solo modificare i propri voti
-- - Gli admin potranno vedere tutti i voti se configurati correttamente nelle policy

