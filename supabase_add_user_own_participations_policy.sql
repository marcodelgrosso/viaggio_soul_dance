-- Aggiunge una policy RLS per permettere agli utenti di vedere le proprie partecipazioni
-- anche se l'avventura non è attiva o lo status è declined

-- Policy: gli utenti possono vedere le proprie partecipazioni
CREATE POLICY "Users can view their own participations"
  ON adventure_participants
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Nota: questa policy è in aggiunta a quella esistente "Anyone can view participants of active adventures"
-- Quindi gli utenti potranno vedere:
-- 1. Tutti i partecipanti delle avventure attive (policy esistente)
-- 2. Le proprie partecipazioni (questa nuova policy)

COMMENT ON POLICY "Users can view their own participations" ON adventure_participants IS 
  'Permette agli utenti autenticati di vedere le proprie partecipazioni, indipendentemente dallo stato dell''avventura o dall''invitation_status';

