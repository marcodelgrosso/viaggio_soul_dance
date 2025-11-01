-- Aggiunge colonne per date di partenza e arrivo alle avventure
-- E tabella per le proposte di date alternative dai partecipanti

-- Aggiungi colonne per le date di partenza e arrivo
ALTER TABLE adventures
ADD COLUMN IF NOT EXISTS departure_date DATE;

ALTER TABLE adventures
ADD COLUMN IF NOT EXISTS arrival_date DATE;

-- Commenti
COMMENT ON COLUMN adventures.departure_date IS 'Data di partenza per l''avventura';
COMMENT ON COLUMN adventures.arrival_date IS 'Data di arrivo per l''avventura';

-- Tabella per le proposte di date alternative dai partecipanti
CREATE TABLE IF NOT EXISTS adventure_date_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposed_departure_date DATE,
  proposed_arrival_date DATE,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(adventure_id, user_id) -- Un utente può avere solo una proposta attiva per avventura
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_adventure_date_proposals_adventure_id ON adventure_date_proposals(adventure_id);
CREATE INDEX IF NOT EXISTS idx_adventure_date_proposals_user_id ON adventure_date_proposals(user_id);

-- RLS (Row Level Security)
ALTER TABLE adventure_date_proposals ENABLE ROW LEVEL SECURITY;

-- Policy: tutti i partecipanti possono vedere le proposte delle avventure attive
CREATE POLICY "Participants can view date proposals"
  ON adventure_date_proposals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adventures
      WHERE adventures.id = adventure_date_proposals.adventure_id
      AND adventures.is_active = true
    )
  );

-- Policy: i partecipanti possono creare/aggiornare la propria proposta
CREATE POLICY "Participants can manage their own date proposals"
  ON adventure_date_proposals
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: i creator possono eliminare le proposte
CREATE POLICY "Creators can delete date proposals"
  ON adventure_date_proposals
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adventures
      WHERE adventures.id = adventure_date_proposals.adventure_id
      AND (adventures.created_by = auth.uid() OR is_superadmin(auth.uid()))
    )
  );

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_adventure_date_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare updated_at automaticamente
CREATE TRIGGER update_adventure_date_proposals_updated_at
  BEFORE UPDATE ON adventure_date_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_adventure_date_proposals_updated_at();

COMMENT ON TABLE adventure_date_proposals IS 'Tabella per memorizzare le proposte di date alternative dai partecipanti';

