-- Migration: Aggiunta tabella adventure_participants
-- Esegui questo script nella SQL Editor di Supabase

-- Tabella per gli utenti che partecipano alle avventure
CREATE TABLE IF NOT EXISTS adventure_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(adventure_id, user_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_adventure_participants_adventure_id ON adventure_participants(adventure_id);
CREATE INDEX IF NOT EXISTS idx_adventure_participants_user_id ON adventure_participants(user_id);

-- RLS (Row Level Security)
ALTER TABLE adventure_participants ENABLE ROW LEVEL SECURITY;

-- Policy: tutti possono vedere i partecipanti delle avventure attive
CREATE POLICY "Anyone can view participants of active adventures"
  ON adventure_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adventures
      WHERE adventures.id = adventure_participants.adventure_id
      AND adventures.is_active = true
    )
  );

-- Policy: solo creator originale, altri creator e superadmin possono aggiungere partecipanti
CREATE POLICY "Creators can add participants"
  ON adventure_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM adventures
      WHERE adventures.id = adventure_participants.adventure_id
      AND (
        adventures.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM adventure_creators
          WHERE adventure_id = adventures.id AND user_id = auth.uid()
        ) OR is_superadmin(auth.uid())
      )
    )
    AND added_by = auth.uid()
  );

-- Policy: solo creator originale e superadmin possono rimuovere partecipanti
CREATE POLICY "Creators can remove participants"
  ON adventure_participants
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adventures
      WHERE adventures.id = adventure_participants.adventure_id
      AND (
        adventures.created_by = auth.uid() OR
        is_superadmin(auth.uid())
      )
    )
  );

-- Funzione RPC per ottenere l'ID utente dall'email
CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT)
RETURNS UUID AS $$
DECLARE
  user_uuid UUID;
BEGIN
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = LOWER(user_email);
  
  RETURN user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione RPC per ottenere l'email dall'ID utente
CREATE OR REPLACE FUNCTION get_user_email_by_id(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_uuid;
  
  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE adventure_participants IS 'Tabella per gestire gli utenti che partecipano alle avventure';
COMMENT ON FUNCTION get_user_id_by_email IS 'Funzione per ottenere l''ID utente dall''email (SECURITY DEFINER per bypassare RLS)';
COMMENT ON FUNCTION get_user_email_by_id IS 'Funzione per ottenere l''email dall''ID utente (SECURITY DEFINER per bypassare RLS)';

