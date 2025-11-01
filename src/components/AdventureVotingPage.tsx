import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { AdventureWithDestinations, AdventureDestinationWithPlaces } from '../types/adventures';
import '../styles/components/AdventureVotingPage.scss';

interface AdventureVotingPageProps {
  adventureId: string;
  onBack: () => void;
}

type ViewMode = 'by-destination' | 'by-participant';

const AdventureVotingPage: React.FC<AdventureVotingPageProps> = ({ adventureId, onBack }) => {
  const { user } = useAuth();
  const [adventure, setAdventure] = useState<AdventureWithDestinations | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDestinations, setExpandedDestinations] = useState<Set<string>>(new Set());
  const [expandedParticipants, setExpandedParticipants] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('by-destination');

  useEffect(() => {
    loadVotingData();
  }, [adventureId]);

  const loadVotingData = async () => {
    try {
      setLoading(true);

      // Carica l'avventura
      const { data: adventureData, error: adventureError } = await supabase
        .from('adventures')
        .select('*')
        .eq('id', adventureId)
        .eq('is_active', true)
        .single();

      if (adventureError) {
        throw adventureError;
      }

      // Carica le destinazioni
      const { data: destinationsData } = await supabase
        .from('adventure_destinations')
        .select('*')
        .eq('adventure_id', adventureId)
        .order('order_index', { ascending: true });

      // Carica i partecipanti
      const { data: participantsData } = await supabase
        .from('adventure_participants')
        .select('*')
        .eq('adventure_id', adventureId);

      // Ottieni email dei partecipanti
      const participantsWithEmails = await Promise.all(
        (participantsData || []).map(async (participant) => {
          try {
            const { data: userEmail } = await supabase.rpc(
              'get_user_email_by_id',
              { user_uuid: participant.user_id }
            );
            return {
              ...participant,
              user_email: userEmail || 'Email non disponibile',
            };
          } catch (err) {
            return { ...participant, user_email: 'Email non disponibile' };
          }
        })
      );

      // Per ogni destinazione, carica i luoghi e i voti
      const destinationsWithPlaces = await Promise.all(
        (destinationsData || []).map(async (destination) => {
          // Luoghi della destinazione
          const { data: placesData } = await supabase
            .from('adventure_destination_places')
            .select('*')
            .eq('destination_id', destination.id)
            .order('order_index', { ascending: true });

          // Voti della destinazione
          const { data: votesData } = await supabase
            .from('adventure_destination_votes')
            .select('*')
            .eq('destination_id', destination.id)
            .order('created_at', { ascending: false });

          // Ottieni email dei votanti
          const votesWithEmails = await Promise.all(
            (votesData || []).map(async (vote) => {
              try {
                const { data: userEmail } = await supabase.rpc(
                  'get_user_email_by_id',
                  { user_uuid: vote.user_id }
                );
                return {
                  ...vote,
                  user_email: userEmail || 'Email non disponibile',
                };
              } catch (err) {
                return { ...vote, user_email: 'Email non disponibile' };
              }
            })
          );

          const voteCountYes = votesWithEmails.filter(v => v.vote_type === 'yes').length;
          const voteCountNo = votesWithEmails.filter(v => v.vote_type === 'no').length;
          const voteCountProponi = votesWithEmails.filter(v => v.vote_type === 'proponi').length;
          const totalVotes = votesWithEmails.length;

          return {
            ...destination,
            places: placesData || [],
            votes: votesWithEmails,
            vote_count_yes: voteCountYes,
            vote_count_no: voteCountNo,
            vote_count_proponi: voteCountProponi,
            total_votes: totalVotes,
            // I tags vengono restituiti come array JSON da Supabase
            tags: destination.tags ? (Array.isArray(destination.tags) ? destination.tags : JSON.parse(destination.tags as any)) : [],
          };
        })
      );

      setAdventure({
        ...adventureData,
        destinations: destinationsWithPlaces,
        creators: [],
        participants: participantsWithEmails,
      });
    } catch (error) {
      console.error('Errore nel caricamento dei dati di votazione:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDestinationExpansion = (destinationId: string) => {
    const newExpanded = new Set(expandedDestinations);
    if (newExpanded.has(destinationId)) {
      newExpanded.delete(destinationId);
    } else {
      newExpanded.add(destinationId);
    }
    setExpandedDestinations(newExpanded);
  };

  const toggleParticipantExpansion = (participantId: string) => {
    const newExpanded = new Set(expandedParticipants);
    if (newExpanded.has(participantId)) {
      newExpanded.delete(participantId);
    } else {
      newExpanded.add(participantId);
    }
    setExpandedParticipants(newExpanded);
  };

  // Ottieni i voti di un partecipante per tutte le destinazioni
  const getParticipantVotes = (participantUserId: string) => {
    if (!adventure) return [];
    
    const votes: Array<{
      destination: AdventureDestinationWithPlaces;
      vote: any;
    }> = [];

    adventure.destinations.forEach((destination) => {
      const vote = destination.votes?.find(v => v.user_id === participantUserId);
      if (vote) {
        votes.push({ destination, vote });
      }
    });

    return votes;
  };

  const getVoteTypeLabel = (voteType: 'yes' | 'no' | 'proponi') => {
    switch (voteType) {
      case 'yes':
        return 'Ti Piace';
      case 'no':
        return 'Non ti Convince';
      case 'proponi':
        return 'Proponi Modifiche';
      default:
        return voteType;
    }
  };

  const getVoteTypeIcon = (voteType: 'yes' | 'no' | 'proponi') => {
    switch (voteType) {
      case 'yes':
        return 'fa-thumbs-up';
      case 'no':
        return 'fa-thumbs-down';
      case 'proponi':
        return 'fa-lightbulb';
      default:
        return 'fa-circle';
    }
  };

  const getVoteTypeColor = (voteType: 'yes' | 'no' | 'proponi') => {
    switch (voteType) {
      case 'yes':
        return '#10b981';
      case 'no':
        return '#e53e3e';
      case 'proponi':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  if (loading) {
    return (
      <div className="voting-page-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Caricamento dati votazioni...</p>
      </div>
    );
  }

  if (!adventure) {
    return (
      <div className="voting-page-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>Avventura non trovata</p>
        <button onClick={onBack} className="back-btn">
          <i className="fas fa-arrow-left"></i> Torna Indietro
        </button>
      </div>
    );
  }

  const totalDestinations = adventure.destinations.length;
  const totalVotesAll = adventure.destinations.reduce((sum, dest) => sum + (dest.total_votes || 0), 0);

  return (
    <div className="adventure-voting-page">
      <div className="voting-page-header">
        <button onClick={onBack} className="back-btn">
          <i className="fas fa-arrow-left"></i> Torna Indietro
        </button>
        <div className="header-content">
          <h1>
            <i className="fas fa-chart-bar"></i>
            Riepilogo Votazioni: {adventure.name}
          </h1>
        </div>
      </div>

      <div className="voting-page-content">
        {/* Statistiche Generali */}
        <section className="voting-summary-section">
          <h2>
            <i className="fas fa-chart-pie"></i> Statistiche Generali
          </h2>
          <div className="summary-stats">
            <div className="summary-stat-card">
              <div className="stat-icon">
                <i className="fas fa-map"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{totalDestinations}</div>
                <div className="stat-label">Destinazioni</div>
              </div>
            </div>
            <div className="summary-stat-card">
              <div className="stat-icon">
                <i className="fas fa-vote-yea"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{totalVotesAll}</div>
                <div className="stat-label">Voti Totali</div>
              </div>
            </div>
          </div>
        </section>

        {/* Grafico Riepilogo Voti */}
        <section className="voting-chart-section">
          <h2>
            <i className="fas fa-chart-bar"></i> Grafico Votazioni per Destinazione
          </h2>
          <div className="votes-chart-container">
            {adventure.destinations.map((destination) => {
              const total = destination.total_votes || 0;
              const yes = destination.vote_count_yes || 0;
              const no = destination.vote_count_no || 0;
              const proponi = destination.vote_count_proponi || 0;
              const maxVotes = Math.max(...adventure.destinations.map(d => d.total_votes || 0), 1);

              return (
                <div key={destination.id} className="chart-item">
                  <div className="chart-destination-name">{destination.name}</div>
                  <div className="chart-bars">
                    <div className="chart-bar-container">
                      <div className="chart-bar-label">Sì</div>
                      <div className="chart-bar-wrapper">
                        <div
                          className="chart-bar chart-bar-yes"
                          style={{ width: total > 0 ? `${(yes / maxVotes) * 100}%` : '0%' }}
                          title={`${yes} voti`}
                        >
                          <span className="chart-bar-value">{yes}</span>
                        </div>
                      </div>
                    </div>
                    <div className="chart-bar-container">
                      <div className="chart-bar-label">No</div>
                      <div className="chart-bar-wrapper">
                        <div
                          className="chart-bar chart-bar-no"
                          style={{ width: total > 0 ? `${(no / maxVotes) * 100}%` : '0%' }}
                          title={`${no} voti`}
                        >
                          <span className="chart-bar-value">{no}</span>
                        </div>
                      </div>
                    </div>
                    <div className="chart-bar-container">
                      <div className="chart-bar-label">Proponi</div>
                      <div className="chart-bar-wrapper">
                        <div
                          className="chart-bar chart-bar-proponi"
                          style={{ width: total > 0 ? `${(proponi / maxVotes) * 100}%` : '0%' }}
                          title={`${proponi} voti`}
                        >
                          <span className="chart-bar-value">{proponi}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="chart-total">Totale: {total}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Toggle Vista */}
        <section className="view-mode-toggle-section">
          <div className="view-mode-toggle">
            <button
              className={`toggle-btn ${viewMode === 'by-destination' ? 'active' : ''}`}
              onClick={() => setViewMode('by-destination')}
            >
              <i className="fas fa-map"></i>
              Vista per Destinazione
            </button>
            <button
              className={`toggle-btn ${viewMode === 'by-participant' ? 'active' : ''}`}
              onClick={() => setViewMode('by-participant')}
            >
              <i className="fas fa-users"></i>
              Vista per Partecipante
            </button>
          </div>
        </section>

        {/* Dettaglio Votazioni per Destinazione */}
        {viewMode === 'by-destination' && (
          <section className="voting-details-section">
            <h2>
              <i className="fas fa-list"></i> Dettaglio Votazioni per Destinazione
            </h2>
          <div className="destinations-voting-list">
            {adventure.destinations.length > 0 ? (
              adventure.destinations.map((destination) => (
                <div key={destination.id} className="destination-voting-card">
                  <div className="destination-voting-header">
                    {destination.image_url && (
                      <div className="destination-voting-image">
                        <img src={destination.image_url} alt={destination.name} />
                      </div>
                    )}
                    <div className="destination-voting-info">
                      <h3>{destination.name}</h3>
                      {destination.description && (
                        <p className="destination-description">{destination.description}</p>
                      )}
                      {destination.tags && destination.tags.length > 0 && (
                        <div className="destination-tags">
                          {destination.tags.map((tag, index) => (
                            <span key={index} className="destination-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="expand-toggle-btn"
                      onClick={() => toggleDestinationExpansion(destination.id)}
                    >
                      <i className={`fas fa-chevron-${expandedDestinations.has(destination.id) ? 'up' : 'down'}`}></i>
                    </button>
                  </div>

                  {/* Statistiche della destinazione */}
                  <div className="destination-voting-stats">
                    <div className="vote-stat-item">
                      <i className="fas fa-thumbs-up" style={{ color: '#10b981' }}></i>
                      <span className="stat-label">Ti Piace</span>
                      <span className="stat-value">{destination.vote_count_yes || 0}</span>
                    </div>
                    <div className="vote-stat-item">
                      <i className="fas fa-thumbs-down" style={{ color: '#e53e3e' }}></i>
                      <span className="stat-label">Non ti Convince</span>
                      <span className="stat-value">{destination.vote_count_no || 0}</span>
                    </div>
                    <div className="vote-stat-item">
                      <i className="fas fa-lightbulb" style={{ color: '#f59e0b' }}></i>
                      <span className="stat-label">Proponi</span>
                      <span className="stat-value">{destination.vote_count_proponi || 0}</span>
                    </div>
                    <div className="vote-stat-item">
                      <i className="fas fa-users"></i>
                      <span className="stat-label">Totale</span>
                      <span className="stat-value">{destination.total_votes || 0}</span>
                    </div>
                  </div>

                  {/* Lista dettagliata dei voti */}
                  {expandedDestinations.has(destination.id) && (
                    <div className="votes-detail-list">
                      {destination.votes && destination.votes.length > 0 ? (
                        <div className="votes-list">
                          {destination.votes.map((vote) => (
                            <div key={vote.id} className="vote-item">
                              <div className="vote-item-header">
                                <div className="vote-user-info">
                                  <i className="fas fa-user"></i>
                                  <span className="vote-user-email">{vote.user_email || 'Email non disponibile'}</span>
                                </div>
                                <div
                                  className="vote-type-badge"
                                  style={{ backgroundColor: getVoteTypeColor(vote.vote_type) }}
                                >
                                  <i className={`fas ${getVoteTypeIcon(vote.vote_type)}`}></i>
                                  <span>{getVoteTypeLabel(vote.vote_type)}</span>
                                </div>
                              </div>
                              {vote.comment && (
                                <div className="vote-comment">
                                  <i className="fas fa-comment"></i>
                                  <p>{vote.comment}</p>
                                </div>
                              )}
                              <div className="vote-date">
                                <i className="fas fa-clock"></i>
                                <span>
                                  {new Date(vote.created_at).toLocaleString('it-IT', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {vote.updated_at !== vote.created_at && (
                                  <span className="vote-updated">(Aggiornato)</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-votes">
                          <i className="fas fa-info-circle"></i>
                          <p>Nessun voto ancora per questa destinazione</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-destinations">
                <i className="fas fa-map"></i>
                <p>Nessuna destinazione proposta ancora</p>
              </div>
            )}
          </div>
        </section>
        )}

        {/* Dettaglio Votazioni per Partecipante */}
        {viewMode === 'by-participant' && (
          <section className="voting-details-section">
            <h2>
              <i className="fas fa-users"></i> Dettaglio Votazioni per Partecipante
            </h2>
            <div className="participants-voting-list">
              {adventure.participants && adventure.participants.length > 0 ? (
                adventure.participants.map((participant) => {
                  const participantVotes = getParticipantVotes(participant.user_id);
                  const hasVotes = participantVotes.length > 0;

                  return (
                    <div key={participant.id} className="participant-voting-card">
                      <div className="participant-voting-header">
                        <div className="participant-voting-info">
                          <div className="participant-avatar-large">
                            <i className="fas fa-user"></i>
                          </div>
                          <div>
                            <h3>{participant.user_email || 'Email non disponibile'}</h3>
                            <p className="participant-meta">
                              Partecipante da {new Date(participant.created_at).toLocaleDateString('it-IT')}
                            </p>
                            <div className="participant-votes-summary">
                              {hasVotes ? (
                                <span>
                                  Ha votato per {participantVotes.length} destinazione{participantVotes.length !== 1 ? 'i' : ''}
                                </span>
                              ) : (
                                <span className="no-votes-badge">Non ha ancora votato</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {hasVotes && (
                          <button
                            className="expand-toggle-btn"
                            onClick={() => toggleParticipantExpansion(participant.user_id)}
                          >
                            <i className={`fas fa-chevron-${expandedParticipants.has(participant.user_id) ? 'up' : 'down'}`}></i>
                          </button>
                        )}
                      </div>

                      {hasVotes && expandedParticipants.has(participant.user_id) && (
                        <div className="participant-votes-detail">
                          <div className="participant-votes-list">
                            {participantVotes.map(({ destination, vote }) => (
                              <div key={vote.id} className="participant-vote-item">
                                <div className="participant-vote-destination">
                                  <div className="vote-destination-header">
                                    {destination.image_url && (
                                      <img src={destination.image_url} alt={destination.name} className="vote-destination-thumb" />
                                    )}
                                    <div>
                                      <h4>{destination.name}</h4>
                                      {destination.description && (
                                        <p className="vote-destination-desc">{destination.description}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="participant-vote-info">
                                  <div
                                    className="participant-vote-badge"
                                    style={{ backgroundColor: getVoteTypeColor(vote.vote_type) }}
                                  >
                                    <i className={`fas ${getVoteTypeIcon(vote.vote_type)}`}></i>
                                    <span>{getVoteTypeLabel(vote.vote_type)}</span>
                                  </div>
                                  {vote.comment && (
                                    <div className="participant-vote-comment">
                                      <i className="fas fa-comment"></i>
                                      <p>{vote.comment}</p>
                                    </div>
                                  )}
                                  <div className="participant-vote-date">
                                    <i className="fas fa-clock"></i>
                                    <span>
                                      {new Date(vote.created_at).toLocaleString('it-IT', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="no-participants">
                  <i className="fas fa-users"></i>
                  <p>Nessun partecipante aggiunto all'avventura</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AdventureVotingPage;

