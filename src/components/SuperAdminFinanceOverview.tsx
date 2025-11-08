import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

interface TransportRecord {
  id: string;
  destination_id: string;
  transport_type: string;
  cost: number | null;
  cost_type: string;
  info_link: string | null;
  created_at: string;
  adventure_id: string | null;
  adventure_name: string | null;
  destination_name: string | null;
}

interface AggregatedAdventureCost {
  adventure_id: string;
  adventure_name: string;
  total_cost: number;
  segments: Array<{
    destination_name: string | null;
    transport_type: string;
    cost: number | null;
    cost_type: string;
  }>;
}

interface AggregatedTransportType {
  transport_type: string;
  total_cost: number;
  occurrences: number;
}

type FinanceState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'success';
      records: TransportRecord[];
    }
  | { status: 'error'; message: string };

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);
};

const SuperAdminFinanceOverview: React.FC = () => {
  const [state, setState] = useState<FinanceState>({ status: 'idle' });

  useEffect(() => {
    let isMounted = true;

    const loadTransportCosts = async () => {
      setState({ status: 'loading' });

      try {
        const { data, error } = await supabase
          .from('destination_transport')
          .select(
            `
            id,
            destination_id,
            transport_type,
            cost,
            cost_type,
            info_link,
            created_at,
            adventure_destinations (
              id,
              name,
              adventure_id,
              adventures (
                id,
                name
              )
            )
          `
          )
          .order('created_at', { ascending: false });

        if (error) {
          const isRlsIssue =
            error.code === '42501' || error.message?.includes('permission denied');
          if (isRlsIssue) {
            throw new Error(
              'Permessi insufficienti per leggere i costi di trasporto. Verifica le policy RLS per i superadmin.'
            );
          }

          const missingTable =
            error.code === '42P01' || error.message?.includes('relation') ? true : false;
          if (missingTable) {
            throw new Error(
              'La tabella destination_transport non è disponibile. Assicurati di aver eseguito le migration SQL.'
            );
          }

          throw error;
        }

        const records: TransportRecord[] = (data || []).map((item: any) => ({
          id: item.id,
          destination_id: item.destination_id,
          transport_type: item.transport_type,
          cost: item.cost,
          cost_type: item.cost_type,
          info_link: item.info_link,
          created_at: item.created_at,
          adventure_id: item.adventure_destinations?.adventures?.id ?? null,
          adventure_name: item.adventure_destinations?.adventures?.name ?? 'Avventura',
          destination_name: item.adventure_destinations?.name ?? null,
        }));

        if (isMounted) {
          setState({
            status: 'success',
            records,
          });
        }
      } catch (error: any) {
        console.error('Errore caricamento finanze:', error);
        if (isMounted) {
          setState({
            status: 'error',
            message: error?.message || 'Impossibile caricare i dati finanziari.',
          });
        }
      }
    };

    loadTransportCosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalCost = useMemo(() => {
    if (state.status !== 'success') return 0;
    return state.records.reduce((sum, record) => sum + (record.cost || 0), 0);
  }, [state]);

  const costByAdventure = useMemo<AggregatedAdventureCost[]>(() => {
    if (state.status !== 'success') return [];

    const map = new Map<string, AggregatedAdventureCost>();

    state.records.forEach((record) => {
      if (!record.adventure_id) {
        return;
      }

      const existing = map.get(record.adventure_id);
      if (!existing) {
        map.set(record.adventure_id, {
          adventure_id: record.adventure_id,
          adventure_name: record.adventure_name || 'Avventura',
          total_cost: record.cost || 0,
          segments: [
            {
              destination_name: record.destination_name,
              transport_type: record.transport_type,
              cost: record.cost,
              cost_type: record.cost_type,
            },
          ],
        });
      } else {
        existing.total_cost += record.cost || 0;
        existing.segments.push({
          destination_name: record.destination_name,
          transport_type: record.transport_type,
          cost: record.cost,
          cost_type: record.cost_type,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total_cost - a.total_cost);
  }, [state]);

  const costByTransportType = useMemo<AggregatedTransportType[]>(() => {
    if (state.status !== 'success') return [];

    const map = new Map<string, AggregatedTransportType>();

    state.records.forEach((record) => {
      const key = record.transport_type || 'other';
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          transport_type: key,
          total_cost: record.cost || 0,
          occurrences: 1,
        });
      } else {
        existing.total_cost += record.cost || 0;
        existing.occurrences += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total_cost - a.total_cost);
  }, [state]);

  return (
    <div className="superadmin-section-wrapper finance-overview">
      <div className="superadmin-section-header">
        <div>
          <h2>Riepilogo finanziario</h2>
          <p>
            Monitoraggio dei costi associati a trasporti e alloggi delle avventure. I valori sono
            aggregati automaticamente dalla tabella <code>destination_transport</code>.
          </p>
        </div>
        {state.status === 'success' && (
          <div className="superadmin-metric-card highlighted">
            <span>Totale stimato</span>
            <strong>{formatCurrency(totalCost)}</strong>
            <small>Somma di tutti i costi registrati</small>
          </div>
        )}
      </div>

      {state.status === 'loading' && (
        <div className="superadmin-section-loading">
          <i className="fas fa-spinner fa-spin" />
          <p>Caricamento costi...</p>
        </div>
      )}

      {state.status === 'error' && (
        <div className="superadmin-section-empty">
          <i className="fas fa-wallet" />
          <h3>Impossibile calcolare i costi</h3>
          <p>{state.message}</p>
          <div className="superadmin-callout">
            <strong>Per abilitare questa sezione</strong>
            <ul>
              <li>Assicurati che la tabella <code>destination_transport</code> sia stata creata.</li>
              <li>
                Verifica le policy RLS: i superadmin devono poter leggere i record o utilizzare una
                funzione RPC dedicata.
              </li>
              <li>
                Inserisci i costi attraverso la UI “Trasporti & Alloggi” o tramite script
                amministrativi.
              </li>
            </ul>
          </div>
        </div>
      )}

      {state.status === 'success' && state.records.length === 0 && (
        <div className="superadmin-section-empty">
          <i className="fas fa-plane-departure" />
          <h3>Nessun costo registrato</h3>
          <p>
            Non sono presenti spese per trasporti/alloggi. Aggiungi i costi nelle schede avventura
            per visualizzare il riepilogo.
          </p>
        </div>
      )}

      {state.status === 'success' && state.records.length > 0 && (
        <div className="superadmin-section-content">
          <div className="superadmin-metric-grid">
            {costByTransportType.map((item) => (
              <div key={item.transport_type} className="superadmin-metric-card">
                <span>
                  {item.transport_type === 'hotel'
                    ? 'Alloggi'
                    : item.transport_type === 'flight'
                    ? 'Voli'
                    : item.transport_type === 'train'
                    ? 'Treni'
                    : item.transport_type === 'bus'
                    ? 'Bus'
                    : item.transport_type === 'car'
                    ? 'Auto'
                    : 'Altri servizi'}
                </span>
                <strong>{formatCurrency(item.total_cost)}</strong>
                <small>{item.occurrences} voci registrate</small>
              </div>
            ))}
          </div>

          <div className="superadmin-card superadmin-table-card">
            <div className="superadmin-table">
              <div className="superadmin-table-header">
                <span>Avventura</span>
                <span>Costo totale</span>
                <span>Dettaglio voci</span>
              </div>
              <div className="superadmin-table-body">
                {costByAdventure.map((item) => (
                  <div key={item.adventure_id} className="superadmin-table-row">
                    <div className="column primary">
                      <div className="adventure-info">
                        <i className="fas fa-route" />
                        <div>
                          <strong>{item.adventure_name}</strong>
                          <span>{item.adventure_id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="column secondary">
                      <span className="amount">{formatCurrency(item.total_cost)}</span>
                    </div>
                    <div className="column tertiary">
                      <ul className="segments">
                        {item.segments.map((segment, index) => (
                          <li key={`${segment.transport_type}-${index}`}>
                            <span className={`transport transport-${segment.transport_type}`}>
                              {segment.transport_type}
                            </span>
                            <span>{segment.destination_name || 'Destinazione'}</span>
                            <strong>
                              {segment.cost ? formatCurrency(segment.cost) : 'Non specificato'}
                            </strong>
                            <small>{segment.cost_type === 'fixed' ? 'Fisso' : 'Stimato'}</small>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminFinanceOverview;


