-- Migration: Permessi per partecipante per avventura
-- Permette di gestire permessi specifici per ogni partecipante in ogni avventura
-- I permessi sono: view_statistics, can_edit, can_view_only

-- Tabella per i permessi dei partecipanti nelle avventure
CREATE TABLE IF NOT EXISTS adventure_participant_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_view_statistics BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_view_only BOOLEAN DEFAULT true, -- Di default possono solo vedere
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(adventure_id, user_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_adventure_participant_permissions_adventure_id 
  ON adventure_participant_permissions(adventure_id);
CREATE INDEX IF NOT EXISTS idx_adventure_participant_permissions_user_id 
  ON adventure_participant_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_adventure_participant_permissions_composite 
  ON adventure_participant_permissions(adventure_id, user_id);

-- RLS (Row Level Security)
ALTER TABLE adventure_participant_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: i creator dell'avventura e superadmin possono vedere tutti i permessi
CREATE POLICY "Creators can view participant permissions"
  ON adventure_participant_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adventures
      WHERE adventures.id = adventure_participant_permissions.adventure_id
      AND (
        adventures.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM adventure_creators
          WHERE adventure_id = adventures.id AND user_id = auth.uid()
        ) OR
        is_superadmin(auth.uid())
      )
    )
  );

-- Policy: gli utenti possono vedere i propri permessi
CREATE POLICY "Users can view their own permissions"
  ON adventure_participant_permissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: solo creator originale e superadmin possono gestire i permessi
CREATE POLICY "Creators can manage participant permissions"
  ON adventure_participant_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adventures
      WHERE adventures.id = adventure_participant_permissions.adventure_id
      AND (
        adventures.created_by = auth.uid() OR
        is_superadmin(auth.uid())
      )
    )
  );

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_adventure_participant_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_adventure_participant_permissions_updated_at
  BEFORE UPDATE ON adventure_participant_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_adventure_participant_permissions_updated_at();

-- Funzione per ottenere i permessi di un utente per un'avventura
CREATE OR REPLACE FUNCTION get_participant_permissions(p_adventure_id UUID, p_user_id UUID)
RETURNS TABLE(
  can_view_statistics BOOLEAN,
  can_edit BOOLEAN,
  can_view_only BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    app.can_view_statistics,
    app.can_edit,
    app.can_view_only
  FROM adventure_participant_permissions app
  WHERE app.adventure_id = p_adventure_id
  AND app.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commenti
COMMENT ON TABLE adventure_participant_permissions IS 'Permessi specifici per ogni partecipante in ogni avventura';
COMMENT ON COLUMN adventure_participant_permissions.can_view_statistics IS 'Può vedere le statistiche dell''avventura';
COMMENT ON COLUMN adventure_participant_permissions.can_edit IS 'Può modificare l''avventura';
COMMENT ON COLUMN adventure_participant_permissions.can_view_only IS 'Può solo visualizzare l''avventura (di default true)';

