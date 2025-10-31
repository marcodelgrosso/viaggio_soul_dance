-- Fix per la ricorsione infinita nelle policy RLS
-- Esegui questo script nella SQL Editor di Supabase

-- Rimuovi le policy problematiche
DROP POLICY IF EXISTS "Superadmin can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Superadmin can manage permissions" ON user_permissions;

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

-- Ora ricrea le policy usando le funzioni SECURITY DEFINER
CREATE POLICY "Superadmin can manage roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can manage permissions"
  ON user_permissions
  FOR ALL
  TO authenticated
  USING (is_superadmin(auth.uid()));

-- Aggiorna la policy per adventures usando la funzione
DROP POLICY IF EXISTS "Creators can create adventures" ON adventures;

CREATE POLICY "Creators can create adventures"
  ON adventures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_has_permission(auth.uid(), 'is_creator')
  );

-- Aggiorna le altre policy per adventures
DROP POLICY IF EXISTS "Creators can update adventures" ON adventures;

CREATE POLICY "Creators can update adventures"
  ON adventures
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM adventure_creators
      WHERE adventure_id = adventures.id AND user_id = auth.uid()
    ) OR is_superadmin(auth.uid())
  );

-- Aggiorna la policy per adventure_places
DROP POLICY IF EXISTS "Creators can manage places" ON adventure_places;

CREATE POLICY "Creators can manage places"
  ON adventure_places
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adventures
      WHERE adventures.id = adventure_places.adventure_id
      AND (
        adventures.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM adventure_creators
          WHERE adventure_id = adventures.id AND user_id = auth.uid()
        ) OR is_superadmin(auth.uid())
      )
    )
  );

-- Aggiorna la policy per adventure_creators
DROP POLICY IF EXISTS "Creators can manage adventure creators" ON adventure_creators;

CREATE POLICY "Creators can manage adventure creators"
  ON adventure_creators
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adventures
      WHERE adventures.id = adventure_creators.adventure_id
      AND (
        adventures.created_by = auth.uid() OR
        is_superadmin(auth.uid())
      )
    )
  );

COMMENT ON FUNCTION is_superadmin IS 'Verifica se un utente è superadmin (bypassa RLS per evitare ricorsione)';
COMMENT ON FUNCTION user_has_permission IS 'Verifica se un utente ha un permesso specifico (bypassa RLS per evitare ricorsione)';

