-- Migration: Tabella log accessi e attività amministrative
-- Questa tabella consente di tracciare eventi di login/logout, tentativi falliti
-- e azioni sensibili eseguite dagli amministratori o dagli utenti.
-- Esegui questo script nella SQL Editor di Supabase.

CREATE TABLE IF NOT EXISTS admin_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  context TEXT,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  session_duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_user_id ON admin_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_action ON admin_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_created_at ON admin_access_logs(created_at DESC);

-- Abilita RLS
ALTER TABLE admin_access_logs ENABLE ROW LEVEL SECURITY;

-- Policy: solo i superadmin possono gestire i log completi
DROP POLICY IF EXISTS "Superadmin can manage access logs" ON admin_access_logs;

CREATE POLICY "Superadmin can manage access logs"
  ON admin_access_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'platform_superadmin'
    )
  );

-- Policy: gli utenti possono vedere solo i propri log (visualizzazione)
DROP POLICY IF EXISTS "Users can view their own access logs" ON admin_access_logs;

CREATE POLICY "Users can view their own access logs"
  ON admin_access_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

COMMENT ON TABLE admin_access_logs IS 'Log accessi e attività amministrative (login/logout/azioni sensibili).';

-- Funzione helper per registrare un evento di accesso
CREATE OR REPLACE FUNCTION log_admin_access(
  p_user_id UUID,
  p_action TEXT,
  p_context TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_session_duration_seconds INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  END IF;

  INSERT INTO admin_access_logs (
    user_id,
    user_email,
    action,
    context,
    ip_address,
    user_agent,
    session_id,
    session_duration_seconds
  ) VALUES (
    p_user_id,
    COALESCE(v_email, 'Utente sconosciuto'),
    p_action,
    p_context,
    p_ip_address,
    p_user_agent,
    p_session_id,
    p_session_duration_seconds
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_admin_access IS 'Utility per registrare un evento di accesso/amministrativo nella tabella admin_access_logs.';

-- NOTE:
-- Per registrare automaticamente i login/logout puoi richiamare log_admin_access dal tuo backend
-- (ad es. Node/Express) subito dopo un login riuscito/fallito, senza necessità di creare trigger
-- su auth.sessions. Esempio:
--
-- await supabase.rpc('log_admin_access', {
--   p_user_id: user.id,
--   p_action: 'login_success',
--   p_context: 'Login via app web',
--   p_ip_address: clientIp,
--   p_user_agent: req.headers['user-agent'],
--   p_session_id: session.id,
--   p_session_duration_seconds: null,
-- });

