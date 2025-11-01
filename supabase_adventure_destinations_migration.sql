-- Migration: Destinazioni Proposte per Avventure
-- Esegui questo script nella SQL Editor di Supabase
-- Questa migration sostituisce adventure_places con adventure_destinations

-- Tabella per le destinazioni proposte di un'avventura (votabili dai partecipanti)
CREATE TABLE IF NOT EXISTS adventure_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella per i luoghi da visitare dentro ogni destinazione
CREATE TABLE IF NOT EXISTS adventure_destination_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID NOT NULL REFERENCES adventure_destinations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella per i voti dei partecipanti sulle destinazioni
CREATE TABLE IF NOT EXISTS adventure_destination_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID NOT NULL REFERENCES adventure_destinations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('yes', 'no')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(destination_id, user_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_adventure_destinations_adventure_id ON adventure_destinations(adventure_id);
CREATE INDEX IF NOT EXISTS idx_adventure_destinations_order ON adventure_destinations(adventure_id, order_index);
CREATE INDEX IF NOT EXISTS idx_adventure_destination_places_destination_id ON adventure_destination_places(destination_id);
CREATE INDEX IF NOT EXISTS idx_adventure_destination_places_order ON adventure_destination_places(destination_id, order_index);
CREATE INDEX IF NOT EXISTS idx_adventure_destination_votes_destination_id ON adventure_destination_votes(destination_id);
CREATE INDEX IF NOT EXISTS idx_adventure_destination_votes_user_id ON adventure_destination_votes(user_id);

-- RLS (Row Level Security)
ALTER TABLE adventure_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_destination_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_destination_votes ENABLE ROW LEVEL SECURITY;

-- Policy per adventure_destinations: tutti i partecipanti possono vedere
CREATE POLICY "Participants can view destinations"
  ON adventure_destinations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adventures
      WHERE adventures.id = adventure_destinations.adventure_id
      AND adventures.is_active = true
      AND (
        -- L'utente è creator o partecipante
        adventures.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM adventure_creators
          WHERE adventure_id = adventures.id AND user_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM adventure_participants
          WHERE adventure_id = adventures.id AND user_id = auth.uid()
        ) OR
        is_superadmin(auth.uid())
      )
    )
  );

-- Policy per adventure_destinations: solo creator e superadmin possono modificare
CREATE POLICY "Creators can manage destinations"
  ON adventure_destinations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adventures
      WHERE adventures.id = adventure_destinations.adventure_id
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

-- Policy per adventure_destination_places: tutti possono vedere
CREATE POLICY "Anyone can view destination places"
  ON adventure_destination_places
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adventure_destinations
      JOIN adventures ON adventures.id = adventure_destinations.adventure_id
      WHERE adventure_destinations.id = adventure_destination_places.destination_id
      AND adventures.is_active = true
    )
  );

-- Policy per adventure_destination_places: solo creator possono modificare
CREATE POLICY "Creators can manage destination places"
  ON adventure_destination_places
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adventure_destinations
      JOIN adventures ON adventures.id = adventure_destinations.adventure_id
      WHERE adventure_destinations.id = adventure_destination_places.destination_id
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

-- Policy per adventure_destination_votes: partecipanti possono vedere tutti i voti
CREATE POLICY "Participants can view votes"
  ON adventure_destination_votes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adventure_destinations
      JOIN adventures ON adventures.id = adventure_destinations.adventure_id
      WHERE adventure_destinations.id = adventure_destination_votes.destination_id
      AND adventures.is_active = true
      AND (
        -- L'utente è creator o partecipante
        adventures.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM adventure_creators
          WHERE adventure_id = adventures.id AND user_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM adventure_participants
          WHERE adventure_id = adventures.id AND user_id = auth.uid()
        ) OR
        is_superadmin(auth.uid())
      )
    )
  );

-- Policy per adventure_destination_votes: partecipanti possono votare
CREATE POLICY "Participants can vote on destinations"
  ON adventure_destination_votes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adventure_destinations
      JOIN adventures ON adventures.id = adventure_destinations.adventure_id
      WHERE adventure_destinations.id = adventure_destination_votes.destination_id
      AND adventures.is_active = true
      AND (
        -- L'utente è partecipante o creator
        adventures.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM adventure_creators
          WHERE adventure_id = adventures.id AND user_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM adventure_participants
          WHERE adventure_id = adventures.id AND user_id = auth.uid()
        ) OR
        is_superadmin(auth.uid())
      )
      AND (adventure_destination_votes.user_id = auth.uid() OR is_superadmin(auth.uid()))
    )
  );

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_adventure_destinations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_adventure_destinations_updated_at
  BEFORE UPDATE ON adventure_destinations
  FOR EACH ROW
  EXECUTE FUNCTION update_adventure_destinations_updated_at();

CREATE OR REPLACE FUNCTION update_adventure_destination_votes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_adventure_destination_votes_updated_at
  BEFORE UPDATE ON adventure_destination_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_adventure_destination_votes_updated_at();

COMMENT ON TABLE adventure_destinations IS 'Destinazioni proposte per le avventure (votabili dai partecipanti)';
COMMENT ON TABLE adventure_destination_places IS 'Luoghi da visitare dentro ogni destinazione';
COMMENT ON TABLE adventure_destination_votes IS 'Voti dei partecipanti sulle destinazioni proposte';

