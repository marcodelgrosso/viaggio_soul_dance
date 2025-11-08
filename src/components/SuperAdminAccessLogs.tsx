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

type DateRangeKey = '24h' | '7d' | '30d' | 'all';

interface AccessMetrics {
  totalEvents: number;
  uniqueUsers: number;
  averageSessionDuration: number | null;
  latestAccess: AccessLog | null;
  sessionsPerUser: Array<{
    user_id: string | null;
    user_email: string | null;
    lastAccess?: string;
    events: number;
    totalDuration?: number | null;
  }>;
  eventsPerDay: Record<string, number>;
}

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

const formatDuration = (seconds: number | null) => {
  if (!seconds || seconds <= 0) return '—';
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs > 0) {
    return `${hrs}h ${remMins}m`;
  }
  return `${mins} min`;
};

const getRangeStart = (key: DateRangeKey) => {
  if (key === 'all') {
    return null;
  }
  const now = new Date();
  const start = new Date(now);
  switch (key) {
    case '24h':
      start.setDate(now.getDate() - 1);
      break;
    case '7d':
      start.setDate(now.getDate() - 7);
      break;
    case '30d':
      start.setDate(now.getDate() - 30);
      break;
    default:
      return null;
  }
  return start;
};

const SuperAdminAccessLogs: React.FC = () => {
  const [state, setState] = useState<AccessLogState>({ status: 'idle' });
  const [filter, setFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRangeKey>('7d');

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

  const startDate = useMemo(() => getRangeStart(dateRange), [dateRange]);

  const filteredLogs = useMemo(() => {
    if (state.status !== 'success') {
      return [];
    }

    const normalizedFilter = filter.trim().toLowerCase();

    return state.logs.filter((log) => {
      let include = true;

      if (startDate) {
        include =
          include &&
          new Date(log.created_at).getTime() >= startDate.getTime();
      }

      if (normalizedFilter) {
        const fields = [
          log.user_email,
          log.action,
          log.context,
          log.ip_address,
          log.user_agent,
          JSON.stringify(log.metadata || {}),
        ];
        const matches = fields.some((field) =>
          field?.toLowerCase().includes(normalizedFilter)
        );
        include = include && matches;
      }

      return include;
    });
  }, [state, filter, startDate]);

  const metrics = useMemo<AccessMetrics>(() => {
    if (state.status !== 'success' || filteredLogs.length === 0) {
      return {
        totalEvents: 0,
        uniqueUsers: 0,
        averageSessionDuration: null,
        latestAccess: null,
        sessionsPerUser: [],
        eventsPerDay: {},
      };
    }

    const uniqueUsers = new Map<string | null, AccessLog[]>();
    const eventsPerDay: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;
    let latestAccess: AccessLog | null = null;

    filteredLogs.forEach((log) => {
      const day = new Date(log.created_at).toISOString().split('T')[0];
      eventsPerDay[day] = (eventsPerDay[day] || 0) + 1;

      if (!uniqueUsers.has(log.user_id)) {
        uniqueUsers.set(log.user_id, []);
      }
      uniqueUsers.get(log.user_id)!.push(log);

      const durationSec =
        log.metadata?.session_duration_seconds ??
        (log.metadata?.session_duration_ms
          ? log.metadata.session_duration_ms / 1000
          : null);
      if (durationSec && durationSec > 0) {
        totalDuration += durationSec;
        durationCount += 1;
      }

      if (
        !latestAccess ||
        new Date(log.created_at) > new Date(latestAccess.created_at)
      ) {
        latestAccess = log;
      }
    });

    const sessionsPerUser = Array.from(uniqueUsers.entries()).map(
      ([userId, logs]) => {
        const sorted = logs
          .slice()
          .sort((a, b) => (a.created_at > b.created_at ? -1 : 1));
        const durations = logs
          .map((entry) => {
            const duration =
              entry.metadata?.session_duration_seconds ??
              (entry.metadata?.session_duration_ms
                ? entry.metadata.session_duration_ms / 1000
                : null);
            return duration && duration > 0 ? duration : null;
          })
          .filter((value): value is number => value !== null);

        const totalDurationPerUser =
          durations.length > 0
            ? durations.reduce((acc, item) => acc + item, 0)
            : null;

        return {
          user_id: userId,
          user_email: sorted[0]?.user_email ?? null,
          lastAccess: sorted[0]?.created_at,
          events: logs.length,
          totalDuration: totalDurationPerUser,
        };
      }
    );

    sessionsPerUser.sort((a, b) => {
      if ((b.totalDuration ?? 0) !== (a.totalDuration ?? 0)) {
        return (b.totalDuration ?? 0) - (a.totalDuration ?? 0);
      }
      return b.events - a.events;
    });

    return {
      totalEvents: filteredLogs.length,
      uniqueUsers: Array.from(uniqueUsers.keys()).filter(Boolean).length,
      averageSessionDuration:
        durationCount > 0 ? totalDuration / durationCount : null,
      latestAccess,
      sessionsPerUser,
      eventsPerDay,
    };
  }, [filteredLogs, state.status]);

  const dayKeys = useMemo(
    () =>
      Object.keys(metrics.eventsPerDay)
        .sort()
        .slice(-7),
    [metrics.eventsPerDay]
  );

  const rangeOptions: Array<{ id: DateRangeKey; label: string }> = [
    { id: '24h', label: '24h' },
    { id: '7d', label: '7 giorni' },
    { id: '30d', label: '30 giorni' },
    { id: 'all', label: 'Sempre' },
  ];

  return (
    <div className="superadmin-access-wrapper">
      <div className="superadmin-section-header superadmin-access-header">
        <div className="superadmin-access-header__title">
          <div>
            <h2>Registro accessi e attività</h2>
            <p>
              Monitora accessi, azioni amministrative e attività sensibili. Conserviamo gli ultimi{' '}
              {FALLBACK_LIMIT} eventi.
            </p>
          </div>
          <div className="superadmin-access-filters">
            <div className="superadmin-access-range">
              {rangeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`range-btn ${dateRange === option.id ? 'active' : ''}`}
                  onClick={() => setDateRange(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
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
      </div>

      {state.status === 'success' && filteredLogs.length > 0 && (
        <div className="superadmin-access-overview">
          <div className="superadmin-metric-card highlighted">
            <span>Eventi nel periodo</span>
            <strong>{metrics.totalEvents}</strong>
            <small>Registro limitato agli ultimi {FALLBACK_LIMIT} eventi</small>
          </div>
          <div className="superadmin-metric-card">
            <span>Utenti unici</span>
            <strong>{metrics.uniqueUsers}</strong>
            <small>In base agli eventi filtrati</small>
          </div>
          <div className="superadmin-metric-card">
            <span>Durata media sessione</span>
            <strong>{formatDuration(metrics.averageSessionDuration)}</strong>
            <small>Basata sui metadati session_duration</small>
          </div>
          <div className="superadmin-metric-card">
            <span>Ultimo accesso</span>
            <strong>
              {metrics.latestAccess
                ? formatDateTime(metrics.latestAccess.created_at)
                : '—'}
            </strong>
            <small>{metrics.latestAccess?.user_email ?? '—'}</small>
          </div>
        </div>
      )}

      {state.status === 'success' && filteredLogs.length > 0 && dayKeys.length > 0 && (
        <div className="superadmin-access-trend-grid">
          <div className="superadmin-card superadmin-access-trend">
            <h3>
              <i className="fas fa-chart-line" /> Attività giornaliere
            </h3>
            <div className="trend-bars">
              {dayKeys.map((day) => {
                const value = metrics.eventsPerDay[day];
                const max = Math.max(
                  ...dayKeys.map((key) => metrics.eventsPerDay[key])
                );
                const height = max > 0 ? (value / max) * 100 : 0;
                return (
                  <div key={day} className="trend-bar">
                    <div className="trend-bar__value" style={{ height: `${height}%` }}>
                      <span>{value}</span>
                    </div>
                    <p>
                      {new Date(day).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="superadmin-card superadmin-access-topusers">
            <h3>
              <i className="fas fa-user-clock" /> Sessioni per utente
            </h3>
            <ul>
              {metrics.sessionsPerUser.slice(0, 6).map((item) => (
                <li key={item.user_id || 'unknown'} className="topuser-item">
                  <div>
                    <p className="topuser-name">
                      {item.user_email ?? 'Utente sconosciuto'}
                    </p>
                    <span className="topuser-meta">
                      {item.lastAccess
                        ? `Ultimo accesso: ${formatDateTime(item.lastAccess)}`
                        : 'Ultimo accesso non disponibile'}
                    </span>
                  </div>
                  <div className="topuser-stats">
                    <span className="badge badge-events">
                      <i className="fas fa-bolt" /> {item.events}
                    </span>
                    <span className="badge badge-duration">
                      <i className="fas fa-hourglass-half" />{' '}
                      {formatDuration(item.totalDuration ?? null)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            {metrics.sessionsPerUser.length === 0 && (
              <div className="topuser-empty">
                <i className="fas fa-user-slash" />
                <p>Nessun dato sufficiente per calcolare le sessioni.</p>
              </div>
            )}
          </div>
        </div>
      )}

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
        <div className="superadmin-card superadmin-table-card superadmin-access-table">
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

