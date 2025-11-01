-- Aggiunge il campo invitation_status alla tabella adventure_participants
-- per gestire lo stato degli inviti (pending, accepted, declined)

ALTER TABLE adventure_participants 
ADD COLUMN IF NOT EXISTS invitation_status TEXT DEFAULT 'accepted' CHECK (invitation_status IN ('pending', 'accepted', 'declined'));

-- Commento
COMMENT ON COLUMN adventure_participants.invitation_status IS 'Stato dell''invito: pending (in attesa), accepted (accettato), declined (rifiutato). Default: accepted per retrocompatibilità.';

