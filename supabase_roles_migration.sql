-- Migration: Sistema di Ruoli e Permessi
-- Esegui questo script nella SQL Editor di Supabase

-- Tabella per i ruoli utente
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('superadmin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabella per i permessi utente
-- Prima rimuovi se esiste già con il vecchio constraint
DROP TABLE IF EXISTS user_permissions CASCADE;

CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission VARCHAR(50) NOT NULL CHECK (permission IN ('travel_editor', 'prices_editor', 'view_statistics', 'is_creator')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);

-- RLS (Row Level Security) - Permetti lettura a utenti autenticati
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Policy per user_roles: gli utenti possono vedere solo il proprio ruolo
CREATE POLICY "Users can view their own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Funzione SECURITY DEFINER per verificare se un utente è superadmin
-- Questa funzione bypassa RLS quindi non causa ricorsione
CREATE OR REPLACE FUNCTION is_superadmin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione SECURITY DEFINER per verificare se un utente ha un permesso
CREATE OR REPLACE FUNCTION user_has_permission(user_uuid UUID, perm VARCHAR(50))
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = user_uuid AND permission = perm
  ) OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy per user_roles: solo superadmin può modificare ruoli
-- Usa la funzione is_superadmin per evitare ricorsione RLS
CREATE POLICY "Superadmin can manage roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (is_superadmin(auth.uid()));

-- Policy per user_permissions: gli utenti possono vedere solo i propri permessi
-- Prima rimuoviamo eventuali policy esistenti
DROP POLICY IF EXISTS "Users can view their own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Superadmin can manage permissions" ON user_permissions;

CREATE POLICY "Users can view their own permissions"
  ON user_permissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy per user_permissions: solo superadmin può gestire permessi
-- Usa la funzione is_superadmin per evitare ricorsione RLS
CREATE POLICY "Superadmin can manage permissions"
  ON user_permissions
  FOR ALL
  TO authenticated
  USING (is_superadmin(auth.uid()));

-- Funzione per ottenere il ruolo di un utente
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS VARCHAR(50) AS $$
BEGIN
  RETURN (SELECT role FROM user_roles WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per ottenere i permessi di un utente
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE(permission VARCHAR(50)) AS $$
BEGIN
  RETURN QUERY
  SELECT up.permission
  FROM user_permissions up
  WHERE up.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per verificare se un utente ha un permesso specifico
CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, perm VARCHAR(50))
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = user_uuid AND permission = perm
  ) OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserisci il superadmin (sostituisci EMAIL_SUPERADMIN con la tua email)
-- NOTA: Dovrai eseguire questa query dopo aver creato l'account, sostituendo l'UUID
-- Esempio (dopo aver creato l'account):
-- INSERT INTO user_roles (user_id, role)
-- SELECT id, 'superadmin' FROM auth.users WHERE email = 'marco.delgrosso@example.com';

COMMENT ON TABLE user_roles IS 'Tabella per gestire i ruoli degli utenti (superadmin, user)';
COMMENT ON TABLE user_permissions IS 'Tabella per gestire i permessi specifici degli utenti';

