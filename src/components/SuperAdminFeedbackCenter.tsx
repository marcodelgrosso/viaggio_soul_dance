import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserDisplayName } from '../lib/userUtils';

interface VoteFeedback {
  id: string;
  destination_id: string;
  destination_name: string | null;
  adventure_id: string | null;
  adventure_name: string | null;
  vote_type: 'yes' | 'no' | 'proponi';
  comment: string | null;
  created_at: string;
  user_id: string;
  displayName: string;
}

interface DateProposal {
  id: string;
  adventure_id: string;
  adventure_name: string | null;
  proposed_departure_date: string | null;
  proposed_arrival_date: string | null;
  comment: string | null;
  created_at: string;
  user_id: string;
  displayName: string;
}

type FeedbackState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'success';
      votes: VoteFeedback[];
      proposals: DateProposal[];
    }
  | { status: 'error'; message: string };

const SuperAdminFeedbackCenter: React.FC = () => {
  const [state, setState] = useState<FeedbackState>({ status: 'idle' });
  const [activeTab, setActiveTab] = useState<'votes' | 'proposals'>('votes');

  useEffect(() => {
    let isMounted = true;
    const loadFeedback = async () => {
      setState({ status: 'loading' });

      try {
        const [votesResult, proposalsResult] = await Promise.all([
          supabase
            .from('adventure_destination_votes')
            .select(
              `
              id,
              destination_id,
              vote_type,
              comment,
              created_at,
              user_id,
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
            .not('comment', 'is', null)
            .order('created_at', { ascending: false })
            .limit(40),
          supabase
            .from('adventure_date_proposals')
            .select(
              `
              id,
              adventure_id,
              proposed_departure_date,
              proposed_arrival_date,
              comment,
              created_at,
              user_id,
              adventures (
                id,
                name
              )
            `
            )
            .order('created_at', { ascending: false })
            .limit(40),
        ]);

        if (votesResult.error) {
          throw votesResult.error;
        }
        if (proposalsResult.error) {
          throw proposalsResult.error;
        }

        const votesData: VoteFeedback[] = await Promise.all(
          (votesResult.data || []).map(async (item: any) => {
            const displayName = await getUserDisplayName(item.user_id);
            return {
              id: item.id,
              destination_id: item.destination_id,
              destination_name: item.adventure_destinations?.name ?? null,
              adventure_id: item.adventure_destinations?.adventures?.id ?? null,
            adventure_name: item.adventure_destinations?.adventures?.name ?? null,
              vote_type: item.vote_type,
              comment: item.comment,
              created_at: item.created_at,
              user_id: item.user_id,
              displayName,
            };
          })
        );

        const proposalsData: DateProposal[] = await Promise.all(
          (proposalsResult.data || []).map(async (item: any) => {
            const displayName = await getUserDisplayName(item.user_id);
            return {
              id: item.id,
              adventure_id: item.adventure_id,
              adventure_name: item.adventures?.name ?? null,
              proposed_departure_date: item.proposed_departure_date,
              proposed_arrival_date: item.proposed_arrival_date,
              comment: item.comment,
              created_at: item.created_at,
              user_id: item.user_id,
              displayName,
            };
          })
        );

        if (!isMounted) return;

        setState({
          status: 'success',
          votes: votesData,
          proposals: proposalsData,
        });
      } catch (error: any) {
        console.error('Errore caricamento feedback:', error);
        if (isMounted) {
          setState({
            status: 'error',
            message:
              error?.message ||
              'Impossibile caricare feedback e segnalazioni. Controlla le policy RLS o le funzioni Supabase.',
          });
        }
      }
    };

    loadFeedback();

    return () => {
      isMounted = false;
    };
  }, []);

  const renderVoteCard = (vote: VoteFeedback) => (
    <article key={vote.id} className="superadmin-feedback-card">
      <header>
        <div className="badge">
          <i
            className={`fas ${
              vote.vote_type === 'yes'
                ? 'fa-thumbs-up'
                : vote.vote_type === 'no'
                ? 'fa-thumbs-down'
                : 'fa-lightbulb'
            }`}
          />
          <span>
            {vote.vote_type === 'yes'
              ? 'Voto positivo'
              : vote.vote_type === 'no'
              ? 'Voto negativo'
              : 'Proposta migliorativa'}
          </span>
        </div>
        <time>{new Date(vote.created_at).toLocaleString('it-IT')}</time>
      </header>
      <div className="feedback-body">
        <h3>{vote.destination_name || 'Destinazione sconosciuta'}</h3>
        <p>{vote.comment || 'Nessun commento fornito.'}</p>
      </div>
      <footer>
        <div className="user">
          <i className="fas fa-user-circle" />
          <span>{vote.displayName}</span>
        </div>
        {vote.adventure_id && (
          <div className="adventure-chip">
            <i className="fas fa-route" />
            <span>{vote.adventure_name || vote.adventure_id}</span>
          </div>
        )}
      </footer>
    </article>
  );

  const renderProposalCard = (proposal: DateProposal) => (
    <article key={proposal.id} className="superadmin-feedback-card">
      <header>
        <div className="badge proposal">
          <i className="fas fa-calendar-alt" />
          <span>Proposta date</span>
        </div>
        <time>{new Date(proposal.created_at).toLocaleString('it-IT')}</time>
      </header>
      <div className="feedback-body">
        <h3>{proposal.adventure_name || 'Avventura'}</h3>
        <ul className="proposal-dates">
          <li>
            <strong>Partenza:</strong>{' '}
            {proposal.proposed_departure_date
              ? new Date(proposal.proposed_departure_date).toLocaleDateString('it-IT')
              : 'Non specificata'}
          </li>
          <li>
            <strong>Rientro:</strong>{' '}
            {proposal.proposed_arrival_date
              ? new Date(proposal.proposed_arrival_date).toLocaleDateString('it-IT')
              : 'Non specificata'}
          </li>
        </ul>
        {proposal.comment && <p>{proposal.comment}</p>}
      </div>
      <footer>
        <div className="user">
          <i className="fas fa-user-circle" />
          <span>{proposal.displayName}</span>
        </div>
      </footer>
    </article>
  );

  return (
    <div className="superadmin-section-wrapper feedback-center">
      <div className="superadmin-section-header">
        <div>
          <h2>Feedback & Segnalazioni</h2>
          <p>Commenti recenti dalle votazioni e proposte di data inviate dai partecipanti.</p>
        </div>
        <div className="superadmin-tab-switcher">
          <button
            className={activeTab === 'votes' ? 'active' : ''}
            onClick={() => setActiveTab('votes')}
          >
            <i className="fas fa-comments" />
            Votazioni
            {state.status === 'success' && state.votes.length > 0 && (
              <span className="badge-count">{state.votes.length}</span>
            )}
          </button>
          <button
            className={activeTab === 'proposals' ? 'active' : ''}
            onClick={() => setActiveTab('proposals')}
          >
            <i className="fas fa-calendar-check" />
            Proposte date
            {state.status === 'success' && state.proposals.length > 0 && (
              <span className="badge-count">{state.proposals.length}</span>
            )}
          </button>
        </div>
      </div>

      {state.status === 'loading' && (
        <div className="superadmin-section-loading">
          <i className="fas fa-spinner fa-spin" />
          <p>Caricamento feedback...</p>
        </div>
      )}

      {state.status === 'error' && (
        <div className="superadmin-section-empty">
          <i className="fas fa-exclamation-triangle" />
          <h3>Impossibile recuperare feedback</h3>
          <p>{state.message}</p>
          <div className="superadmin-callout">
            <strong>Consigli rapidi</strong>
            <ul>
              <li>Verifica le policy RLS di Supabase per permettere ai superadmin l’accesso.</li>
              <li>
                In alternativa esponi una funzione RPC che aggrega voti e proposte bypassando RLS.
              </li>
            </ul>
          </div>
        </div>
      )}

      {state.status === 'success' && activeTab === 'votes' && (
        <>
          {state.votes.length === 0 ? (
            <div className="superadmin-section-empty">
              <i className="fas fa-comment-slash" />
              <h3>Nessun commento nelle votazioni</h3>
              <p>I commenti dei partecipanti appariranno qui non appena disponibili.</p>
            </div>
          ) : (
            <div className="superadmin-feedback-grid">
              {state.votes.map(renderVoteCard)}
            </div>
          )}
        </>
      )}

      {state.status === 'success' && activeTab === 'proposals' && (
        <>
          {state.proposals.length === 0 ? (
            <div className="superadmin-section-empty">
              <i className="fas fa-calendar-day" />
              <h3>Nessuna proposta recente</h3>
              <p>Quando gli utenti suggeriscono nuove date, le vedrai qui.</p>
            </div>
          ) : (
            <div className="superadmin-feedback-grid">
              {state.proposals.map(renderProposalCard)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SuperAdminFeedbackCenter;


