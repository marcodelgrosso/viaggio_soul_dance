import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserDisplayName } from '../lib/userUtils';

type AdventureOverview = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  departure_date: string | null;
  arrival_date: string | null;
  is_active: boolean;
  adventure_destinations: Array<{
    id: string;
    name: string;
    adventure_destination_votes: Array<{
      id: string;
      vote_type: 'yes' | 'no' | 'proponi';
    }>;
  }> | null;
  adventure_participants: Array<{
    id: string;
    user_id: string;
    invitation_status: string | null;
  }> | null;
  adventure_creators: Array<{
    id: string;
    user_id: string;
  }> | null;
};

interface AdventureSummary {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_name: string;
  is_active: boolean;
  departure_date: string | null;
  arrival_date: string | null;
  destination_count: number;
  participant_count: number;
  votes_yes: number;
  votes_no: number;
  votes_proponi: number;
  creators: Array<{
    user_id: string;
    display_name: string;
  }>;
}

type AdventuresState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; adventures: AdventureSummary[] }
  | { status: 'error'; message: string };

const SuperAdminAdventures: React.FC = () => {
  const [state, setState] = useState<AdventuresState>({ status: 'idle' });
  const [filter, setFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadAdventures = async () => {
      setState({ status: 'loading' });

      try {
        const { data, error } = await supabase
          .from('adventures')
          .select(
            `
            id,
            name,
            description,
            created_at,
            updated_at,
            created_by,
            is_active,
            departure_date,
            arrival_date,
            adventure_destinations (
              id,
              name,
              adventure_destination_votes (
                id,
                vote_type
              )
            ),
            adventure_participants (
              id,
              user_id,
              invitation_status
            ),
            adventure_creators (
              id,
              user_id
            )
          `
          )
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        const adventures = (data || []) as AdventureOverview[];

        const summaries: AdventureSummary[] = await Promise.all(
          adventures.map(async (adventure) => {
            const createdByName = await getUserDisplayName(adventure.created_by);
            const creatorRows = adventure.adventure_creators || [];
            const creatorNames = await Promise.all(
              creatorRows.map(async (creator) => ({
                user_id: creator.user_id,
                display_name: await getUserDisplayName(creator.user_id),
              }))
            );

            let yes = 0;
            let no = 0;
            let proponi = 0;

            const destinationRows = adventure.adventure_destinations || [];
            destinationRows.forEach((destination) => {
              (destination.adventure_destination_votes || []).forEach((vote) => {
                if (vote.vote_type === 'yes') yes += 1;
                else if (vote.vote_type === 'no') no += 1;
                else proponi += 1;
              });
            });

            return {
              id: adventure.id,
              name: adventure.name,
              description: adventure.description,
              created_at: adventure.created_at,
              updated_at: adventure.updated_at,
              created_by: adventure.created_by,
              created_by_name: createdByName,
              is_active: adventure.is_active,
              departure_date: adventure.departure_date,
              arrival_date: adventure.arrival_date,
              destination_count: destinationRows.length,
              participant_count: (adventure.adventure_participants || []).length,
              votes_yes: yes,
              votes_no: no,
              votes_proponi: proponi,
              creators: creatorNames,
            };
          })
        );

        if (!isMounted) return;

        setState({
          status: 'success',
          adventures: summaries,
        });
      } catch (error: any) {
        console.error('Errore caricamento avventure per superadmin:', error);
        if (isMounted) {
          setState({
            status: 'error',
            message:
              error?.message ||
              'Impossibile caricare le avventure. Verifica le policy RLS o esegui le migration.',
          });
        }
      }
    };

    loadAdventures();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredAdventures = useMemo(() => {
    if (state.status !== 'success') return [];

    let list = state.adventures;
    if (!showInactive) {
      list = list.filter((adventure) => adventure.is_active);
    }

    if (!filter.trim()) {
      return list;
    }

    const normalized = filter.toLowerCase();
    return list.filter((adventure) => {
      const haystack = [
        adventure.name,
        adventure.description || '',
        adventure.created_by_name,
        adventure.creators.map((creator) => creator.display_name).join(' '),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [state, filter, showInactive]);

  return (
    <div className="superadmin-section-wrapper adventures-overview">
      <div className="superadmin-section-header">
        <div>
          <h2>Gestione avventure</h2>
          <p>
            Elenco completo delle avventure attive e archiviate. I superadmin possono monitorare
            partecipanti, voti e creatori.
          </p>
        </div>
        <div className="superadmin-section-actions">
          <div className="superadmin-search-field">
            <i className="fas fa-search" />
            <input
              type="search"
              placeholder="Cerca per nome avventura, creator, partecipanti..."
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>
          <label className="superadmin-checkbox">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) => setShowInactive(event.target.checked)}
            />
            <span>Mostra anche non attive</span>
          </label>
        </div>
      </div>

      {state.status === 'loading' && (
        <div className="superadmin-section-loading">
          <i className="fas fa-spinner fa-spin" />
          <p>Caricamento avventure...</p>
        </div>
      )}

      {state.status === 'error' && (
        <div className="superadmin-section-empty">
          <i className="fas fa-exclamation-circle" />
          <h3>Impossibile caricare le avventure</h3>
          <p>{state.message}</p>
          <div className="superadmin-callout">
            <strong>Passaggi suggeriti</strong>
            <ul>
              <li>Assicurati di aver eseguito le migration per adventures & destinazioni.</li>
              <li>
                Verifica che i superadmin abbiano accesso SELECT sulle tabelle tramite le policy RLS.
              </li>
              <li>
                In caso di RLS stringenti, esponi una funzione RPC che restituisca questo riepilogo.
              </li>
            </ul>
          </div>
        </div>
      )}

      {state.status === 'success' && filteredAdventures.length === 0 && (
        <div className="superadmin-section-empty">
          <i className="fas fa-route" />
          <h3>Nessuna avventura trovata</h3>
          <p>Modifica i filtri o crea una nuova avventura per iniziare.</p>
        </div>
      )}

      {state.status === 'success' && filteredAdventures.length > 0 && (
        <div className="superadmin-adventure-grid">
          {filteredAdventures.map((adventure) => (
            <article key={adventure.id} className="superadmin-card adventure-card">
              <header>
                <div className="title-block">
                  <h3>{adventure.name}</h3>
                  {!adventure.is_active && <span className="status-badge archived">Archiviata</span>}
                </div>
                <p>{adventure.description || 'Nessuna descrizione disponibile.'}</p>
              </header>

              <div className="adventure-stats">
                <div className="stat">
                  <i className="fas fa-users" />
                  <span>
                    <strong>{adventure.participant_count}</strong> partecipanti
                  </span>
                </div>
                <div className="stat">
                  <i className="fas fa-location-dot" />
                  <span>
                    <strong>{adventure.destination_count}</strong> destinazioni
                  </span>
                </div>
                <div className="stat">
                  <i className="fas fa-thumbs-up" />
                  <span>
                    {adventure.votes_yes} / {adventure.votes_no} / {adventure.votes_proponi}
                  </span>
                </div>
              </div>

              <div className="adventure-meta">
                <div>
                  <small>Creator principale</small>
                  <span>{adventure.created_by_name}</span>
                </div>
                <div>
                  <small>Co-creator</small>
                  {adventure.creators.length === 0 ? (
                    <span className="muted">Nessuno</span>
                  ) : (
                    <div className="creator-chips">
                      {adventure.creators.map((creator) => (
                        <span key={creator.user_id} className="chip">
                          <i className="fas fa-user-pen" />
                          {creator.display_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <footer>
                <div className="dates">
                  <div>
                    <small>Partenza</small>
                    <span>
                      {adventure.departure_date
                        ? new Date(adventure.departure_date).toLocaleDateString('it-IT')
                        : 'Da definire'}
                    </span>
                  </div>
                  <div>
                    <small>Rientro</small>
                    <span>
                      {adventure.arrival_date
                        ? new Date(adventure.arrival_date).toLocaleDateString('it-IT')
                        : 'Da definire'}
                    </span>
                  </div>
                </div>
                <div className="timestamps">
                  <small>
                    Creata il {new Date(adventure.created_at).toLocaleDateString('it-IT')} • Ultimo
                    aggiornamento{' '}
                    {new Date(adventure.updated_at).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </small>
                </div>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuperAdminAdventures;


