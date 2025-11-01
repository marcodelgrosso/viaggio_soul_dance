-- Funzione per inserire notifiche (bypassa RLS usando SECURITY DEFINER)
-- Permette agli utenti autenticati di creare notifiche per altri utenti

CREATE OR REPLACE FUNCTION create_user_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Verifica che l'utente che chiama la funzione sia autenticato
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Utente non autenticato';
  END IF;

  -- Inserisce la notifica
  INSERT INTO user_notifications (
    user_id,
    type,
    title,
    message,
    link,
    metadata,
    read,
    action_taken
  )
  VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_link,
    p_metadata,
    false,
    false
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Commento
COMMENT ON FUNCTION create_user_notification IS 'Funzione per creare notifiche per utenti (SECURITY DEFINER per bypassare RLS)';

