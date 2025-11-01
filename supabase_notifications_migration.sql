-- Migration: Aggiunta tabella user_notifications
-- Esegui questo script nella SQL Editor di Supabase

-- Tabella per le notifiche degli utenti
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'adventure_invitation', 'vote_comment', 'participant_added', 'adventure_updated', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- Link opzionale per navigare alla risorsa correlata
  metadata JSONB, -- Dati aggiuntivi (es: adventure_id per gli inviti)
  read BOOLEAN DEFAULT false,
  action_taken BOOLEAN DEFAULT false, -- Se è stata presa un'azione (es: accettato/rifiutato)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: ogni utente può vedere solo le proprie notifiche
CREATE POLICY "Users can view own notifications"
  ON user_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: ogni utente può aggiornare solo le proprie notifiche (es. segnare come lette)
CREATE POLICY "Users can update own notifications"
  ON user_notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: solo il sistema può inserire notifiche (via service role o funzioni)
-- Gli utenti non possono creare notifiche direttamente

-- Funzione per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION update_user_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare updated_at automaticamente
CREATE TRIGGER update_user_notifications_updated_at
  BEFORE UPDATE ON user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_user_notifications_updated_at();

-- Funzione per contare le notifiche non lette
CREATE OR REPLACE FUNCTION get_unread_notifications_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM user_notifications
    WHERE user_id = user_uuid AND read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE user_notifications IS 'Tabella per memorizzare le notifiche degli utenti';
COMMENT ON FUNCTION get_unread_notifications_count IS 'Funzione per ottenere il conteggio delle notifiche non lette (SECURITY DEFINER per bypassare RLS)';

