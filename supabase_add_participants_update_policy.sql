-- Aggiunge una policy per permettere agli utenti di aggiornare il proprio invitation_status
-- Questo è necessario per permettere agli utenti di accettare o rifiutare inviti

-- Policy: gli utenti possono aggiornare il proprio invitation_status
CREATE POLICY "Users can update their own invitation status"
  ON adventure_participants
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())  -- Possono aggiornare solo il proprio record
  WITH CHECK (
    user_id = auth.uid() AND  -- Deve rimanere il loro record
    -- Lo status può essere solo pending, accepted, o declined
    (invitation_status IN ('pending', 'accepted', 'declined') OR invitation_status IS NULL)
  );

COMMENT ON POLICY "Users can update their own invitation status" ON adventure_participants IS 
  'Permette agli utenti di aggiornare il proprio invitation_status per accettare o rifiutare inviti';

