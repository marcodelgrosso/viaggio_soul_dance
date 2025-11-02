-- Fix per la funzione is_superadmin che usa role_name invece di role
-- Questo script corregge l'errore "column role_name does not exist"

CREATE OR REPLACE FUNCTION is_superadmin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_superadmin IS 'Verifica se un utente è superadmin (usa role, non role_name)';

