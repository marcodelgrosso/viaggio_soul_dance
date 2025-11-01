-- Fix per gli errori 406 su user_roles
-- Questo script verifica e aggiusta le RLS policies per user_roles

-- Rimuovi la policy esistente se c'è un problema
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;

-- Ricrea la policy per permettere agli utenti di vedere il proprio ruolo
CREATE POLICY "Users can view their own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Aggiungi anche una policy per permettere agli utenti di inserire il proprio ruolo iniziale
-- (utile quando si registra un nuovo utente)
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;

CREATE POLICY "Users can insert their own role"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND role = 'user'  -- Solo possono auto-inserire ruolo 'user', non 'superadmin'
  );

-- Verifica che la tabella user_roles esista e abbia RLS abilitato
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles'
  ) THEN
    RAISE EXCEPTION 'Tabella user_roles non esiste. Esegui prima supabase_roles_migration.sql';
  END IF;
END $$;

-- Assicurati che RLS sia abilitato
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "Users can view their own role" ON user_roles IS 
  'Permette agli utenti autenticati di vedere solo il proprio ruolo';

COMMENT ON POLICY "Users can insert their own role" ON user_roles IS 
  'Permette agli utenti autenticati di creare il proprio ruolo iniziale come "user"';

