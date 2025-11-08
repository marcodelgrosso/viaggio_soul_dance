import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AccessLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string | null;
  context: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  metadata: Record<string, any> | null;
}

type AccessLogState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; logs: AccessLog[] }
  | { status: 'error'; message: string; missingTable?: boolean };

const FALLBACK_LIMIT = 100;

const formatDateTime = (value: string) => {
  try {
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const SuperAdminAccessLogs: React.FC = () => {
  const [state, setState] = useState<AccessLogState>({ status: 'idle' });
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const loadAccessLogs = async () => {
      setState({ status: 'loading' });

      try {
        const { data, error } = await supabase
          .from('admin_access_logs')
          .select(
            'id, user_id, user_email, action, context, ip_address, user_agent, metadata, created_at'
          )
          .order('created_at', { ascending: false })
          .limit(FALLBACK_LIMIT);

        if (error) {
          const missingTable =
            error.code === '42P01' ||
            error.code === '42501' ||
            error.message?.includes('relation') ||
            error.message?.includes('does not exist');

          throw Object.assign(new Error(error.message), { missingTable });
        }

        if (isMounted) {
          setState({
            status: 'success',
            logs: (data || []).map((item) => ({
              id: item.id,
              user_id: item.user_id,
              user_email: item.user_email,
              action: item.action,
              context: item.context,
              ip_address: item.ip_address,
              user_agent: item.user_agent,
              created_at: item.created_at,
              metadata: item.metadata,
            })),
          });
        }
      } catch (err: any) {
        console.warn('Access logs not available:', err);

        if (isMounted) {
          const missingTable = Boolean(err?.missingTable);
          let message = 'Impossibile caricare i log di accesso.';

          if (missingTable) {
            message =
              'La tabella admin_access_logs non è presente nel database. Consulta le istruzioni per abilitarla.';
          }

          setState({
            status: 'error',
            message,
            missingTable,
          });
        }
      }
    };

    loadAccessLogs();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    if (state.status !== 'success') {
      return [];
    }

    if (!filter.trim()) {
      return state.logs;
    }

    const normalizedFilter = filter.trim().toLowerCase();
    return state.logs.filter((log) => {
      const fields = [
        log.user_email,
        log.action,
        log.context,
        log.ip_address,
        log.user_agent,
        JSON.stringify(log.metadata || {}),
      ];
      return fields.some((field) => field?.toLowerCase().includes(normalizedFilter));
    });
  }, [state, filter]);

  return (
    <div className="superadmin-section-wrapper">
      <div className="superadmin-section-header">
        <div>
          <h2>Registro accessi e attività</h2>
          <p>
            Monitora accessi, azioni amministrative e attività sensibili. Conserviamo gli ultimi{' '}
            {FALLBACK_LIMIT} eventi.
          </p>
        </div>
        <div className="superadmin-section-actions">
          <div className="superadmin-search-field">
            <i className="fas fa-search" />
            <input
              type="search"
              placeholder="Filtra per email, azione, IP..."
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>
        </div>
      </div>

      {state.status === 'loading' && (
        <div className="superadmin-section-loading">
          <i className="fas fa-spinner fa-spin" />
          <p>Caricamento log di accesso...</p>
        </div>
      )}

      {state.status === 'error' && (
        <div className="superadmin-section-empty">
          <i className="fas fa-database" />
          <h3>{state.missingTable ? 'Configurazione richiesta' : 'Nessun dato disponibile'}</h3>
          <p>{state.message}</p>
          {state.missingTable && (
            <div className="superadmin-callout">
              <strong>Passaggi suggeriti</strong>
              <ul>
                <li>
                  Crea una tabella <code>admin_access_logs</code> con colonne per utente, azione,
                  IP, user agent e metadati.
                </li>
                <li>
                  Traccia login/logout e azioni critiche usando un trigger lato server o funzioni
                  RPC.
                </li>
                <li>
                  In alternativa, integra un servizio di audit esterno (es. Logflare, Sentry).
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      {state.status === 'success' && filteredLogs.length === 0 && (
        <div className="superadmin-section-empty">
          <i className="fas fa-inbox" />
          <h3>Nessun evento trovato</h3>
          <p>Prova a modificare i filtri o attendi nuovi eventi.</p>
        </div>
      )}

      {state.status === 'success' && filteredLogs.length > 0 && (
        <div className="superadmin-card superadmin-table-card">
          <div className="superadmin-table">
            <div className="superadmin-table-header">
              <span>Evento</span>
              <span>Utente</span>
              <span>Dettagli</span>
              <span>Quando</span>
            </div>
            <div className="superadmin-table-body">
              {filteredLogs.map((log) => (
                <div key={log.id} className="superadmin-table-row">
                  <div className="column primary">
                    <div className="event-title">
                      <i className="fas fa-right-to-bracket" />
                      <div>
                        <strong>{log.action || 'Evento non classificato'}</strong>
                        {log.context && <span className="event-context">{log.context}</span>}
                      </div>
                    </div>
                    {log.metadata && (
                      <details>
                        <summary>Metadati</summary>
                        <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                  <div className="column secondary">
                    <div className="user-chip">
                      <i className="fas fa-user-circle" />
                      <div>
                        <span>{log.user_email || 'Utente sconosciuto'}</span>
                        {log.ip_address && <small>IP: {log.ip_address}</small>}
                      </div>
                    </div>
                  </div>
                  <div className="column secondary">
                    <div className="meta-info">
                      {log.user_agent ? (
                        <span className="user-agent" title={log.user_agent}>
                          {log.user_agent}
                        </span>
                      ) : (
                        <span className="muted">User agent non disponibile</span>
                      )}
                    </div>
                  </div>
                  <div className="column tertiary">
                    <span className="timestamp">{formatDateTime(log.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminAccessLogs;


