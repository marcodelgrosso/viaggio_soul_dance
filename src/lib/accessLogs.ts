import { supabase } from './supabase';

const LAST_LOGIN_TIMESTAMP_KEY = 'vsd:last_login_timestamp';

interface LogAccessParams {
  action: string;
  context?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  sessionDurationSeconds?: number | null;
}

const getDefaultUserAgent = () => {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    return navigator.userAgent;
  }
  return null;
};

/**
 * Registra un evento di accesso nella tabella admin_access_logs.
 * Richiede che l'utente sia autenticato (auth.uid disponibile).
 */
export const logAccessEvent = async ({
  action,
  context,
  ipAddress = null,
  userAgent,
  sessionId = null,
  sessionDurationSeconds = null,
}: LogAccessParams) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      console.warn('[accessLogs] Nessuna sessione attiva, skip log per', action);
      return;
    }

    const payload = {
      p_user_id: session.user.id,
      p_action: action,
      p_context: context ?? null,
      p_ip_address: ipAddress,
      p_user_agent: userAgent ?? getDefaultUserAgent(),
      p_session_id: sessionId,
      p_session_duration_seconds:
        typeof sessionDurationSeconds === 'number' ? sessionDurationSeconds : null,
    };

    const { error } = await supabase.rpc('log_admin_access', payload);
    if (error) {
      console.warn('[accessLogs] Errore nella registrazione evento', action, error);
    }
  } catch (err) {
    console.warn('[accessLogs] Eccezione durante log evento', action, err);
  }
};

/**
 * Memorizza l'istante di login per calcolare la durata della sessione.
 */
export const rememberLoginTimestamp = () => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(LAST_LOGIN_TIMESTAMP_KEY, new Date().toISOString());
};

/**
 * Restituisce la durata della sessione in secondi (se disponibile) e cancella il timestamp.
 */
export const consumeSessionDurationSeconds = (): number | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = localStorage.getItem(LAST_LOGIN_TIMESTAMP_KEY);
  localStorage.removeItem(LAST_LOGIN_TIMESTAMP_KEY);

  if (!stored) {
    return null;
  }

  const start = Date.parse(stored);
  if (Number.isNaN(start)) {
    return null;
  }

  const diffMs = Date.now() - start;
  if (diffMs < 0) {
    return null;
  }

  return Math.round(diffMs / 1000);
};

