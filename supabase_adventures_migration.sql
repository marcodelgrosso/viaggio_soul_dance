-- Migration: Sistema Avventure
-- Esegui questo script nella SQL Editor di Supabase

-- Tabella per le avventure
CREATE TABLE IF NOT EXISTS adventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Tabella per i luoghi di un'avventura
CREATE TABLE IF NOT EXISTS adventure_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella per gestire i creator delle avventure
CREATE TABLE IF NOT EXISTS adventure_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(adventure_id, user_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_adventures_created_by ON adventures(created_by);
CREATE INDEX IF NOT EXISTS idx_adventures_is_active ON adventures(is_active);
CREATE INDEX IF NOT EXISTS idx_adventure_places_adventure_id ON adventure_places(adventure_id);
CREATE INDEX IF NOT EXISTS idx_adventure_places_order ON adventure_places(adventure_id, order_index);
CREATE INDEX IF NOT EXISTS idx_adventure_creators_adventure_id ON adventure_creators(adventure_id);
CREATE INDEX IF NOT EXISTS idx_adventure_creators_user_id ON adventure_creators(user_id);

-- RLS (Row Level Security)
ALTER TABLE adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_creators ENABLE ROW LEVEL SECURITY;

-- Funzioni SECURITY DEFINER per evitare ricorsione RLS
-- (Se già esistono, queste le sovrascriveranno)
CREATE OR REPLACE FUNCTION is_superadmin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Policy per adventures: tutti possono vedere le avventure attive
CREATE POLICY "Anyone can view active adventures"
  ON adventures
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy per adventures: solo creator e superadmin possono creare
-- Usa la funzione user_has_permission per evitare ricorsione RLS
CREATE POLICY "Creators can create adventures"
  ON adventures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_has_permission(auth.uid(), 'is_creator')
  );

-- Policy per adventures: solo creator e superadmin possono modificare
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

-- Policy per adventure_places: tutti possono vedere i luoghi delle avventure attive
CREATE POLICY "Anyone can view places of active adventures"
  ON adventure_places
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adventures
      WHERE adventures.id = adventure_places.adventure_id
      AND adventures.is_active = true
    )
  );

-- Policy per adventure_places: solo creator possono modificare
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

-- Policy per adventure_creators: tutti possono vedere i creator
CREATE POLICY "Anyone can view creators"
  ON adventure_creators
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy per adventure_creators: solo creator originale e superadmin possono aggiungere creator
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

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_adventures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_adventures_updated_at
  BEFORE UPDATE ON adventures
  FOR EACH ROW
  EXECUTE FUNCTION update_adventures_updated_at();

-- Funzione per verificare se un utente può creare avventure
CREATE OR REPLACE FUNCTION can_create_adventures(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_has_permission(user_uuid, 'is_creator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE adventures IS 'Tabella per gestire le avventure create dagli utenti';
COMMENT ON TABLE adventure_places IS 'Tabella per i luoghi da visitare in ogni avventura';
COMMENT ON TABLE adventure_creators IS 'Tabella per gestire i creator delle avventure (permessi di modifica)';

