-- Fix RLS Policies per user_permissions
-- Esegui questo script nella SQL Editor di Supabase se hai errori 406/500

-- Prima, disabilita temporaneamente RLS per verificare il problema
ALTER TABLE user_permissions DISABLE ROW LEVEL SECURITY;

-- Test: verifica se puoi vedere i permessi
-- SELECT * FROM user_permissions WHERE user_id = 'TUO_USER_ID';

-- Se funziona, riabilita RLS e ricrea le policies corrette

-- Rimuovi le policies esistenti
DROP POLICY IF EXISTS "Users can view their own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Superadmin can manage permissions" ON user_permissions;

-- Ricrea la policy per SELECT (più semplice e sicura)
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own permissions"
  ON user_permissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy per INSERT/UPDATE/DELETE (solo superadmin)
CREATE POLICY "Superadmin can manage permissions"
  ON user_permissions
  FOR ALL
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  )
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );

-- Verifica che funzioni
-- Test: SELECT * FROM user_permissions WHERE user_id = auth.uid();

