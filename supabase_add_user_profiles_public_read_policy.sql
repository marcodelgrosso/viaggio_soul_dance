-- Aggiunge una policy per permettere agli utenti autenticati di vedere i profili pubblici degli altri
-- Questo è necessario per mostrare i nomi dei partecipanti e creator nelle avventure

-- Policy: gli utenti autenticati possono vedere i profili pubblici (first_name, last_name) di tutti gli utenti
CREATE POLICY "Authenticated users can view public profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);  -- Permette a tutti gli utenti autenticati di vedere tutti i profili

-- Nota: Questa policy permette solo la lettura (SELECT), non la modifica o inserimento
-- Gli utenti possono comunque modificare solo il proprio profilo grazie alle altre policies

COMMENT ON POLICY "Authenticated users can view public profiles" ON user_profiles IS 
  'Permette agli utenti autenticati di vedere i dati pubblici (first_name, last_name) di tutti i profili utente, necessari per mostrare i nomi dei partecipanti e creator nelle avventure';

