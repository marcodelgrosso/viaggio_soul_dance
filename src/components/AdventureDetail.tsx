import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { enrichParticipant, getUserDisplayName } from '../lib/userUtils';
import { AdventureWithDestinations, AdventureParticipant } from '../types/adventures';
import AddParticipantsModal from './AddParticipantsModal';
import DateProposalModal from './DateProposalModal';
import BookingDatePicker from './BookingDatePicker';
import DestinationDetailPage from './DestinationDetailPage';
import '../styles/components/AdventureDetail.scss';

interface AdventureDetailProps {
  adventureId: string;
  onBack: () => void;
  onEdit?: (adventureId: string) => void;
  onViewVoting?: (adventureId: string) => void;
}

const AdventureDetail: React.FC<AdventureDetailProps> = ({ adventureId, onBack, onEdit, onViewVoting }) => {
  const { user, actualIsSuperAdmin } = useAuth();
  const [adventure, setAdventure] = useState<AdventureWithDestinations | null>(null);
  const [participants, setParticipants] = useState<AdventureParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [canManageParticipants, setCanManageParticipants] = useState(false);
  const [canEditAdventure, setCanEditAdventure] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [pendingVote, setPendingVote] = useState<{ destinationId: string; voteType: 'yes' | 'no' | 'proponi' } | null>(null);
  const [voteComment, setVoteComment] = useState('');
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [departureDate, setDepartureDate] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [showDateProposalModal, setShowDateProposalModal] = useState(false);
  const [dateProposals, setDateProposals] = useState<any[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    loadAdventureDetails();
  }, [adventureId, user]);

  const loadAdventureDetails = async () => {
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
          const { data: votesData, error: votesError } = await supabase
            .from('adventure_destination_votes')
            .select('id, destination_id, user_id, vote_type, comment, created_at, updated_at')
            .eq('destination_id', destination.id);

          // Ignora errori 400 silenziosamente se causati da RLS
          if (votesError && votesError.code !== '400') {
            console.warn(`Errore nel caricamento dei voti per destinazione ${destination.id}:`, votesError);
          }

          // Trasporti della destinazione
          const { data: transportsData } = await supabase
            .from('destination_transport')
            .select('*')
            .eq('destination_id', destination.id);

          // Calcola il costo totale (somma di tutti i costi dei trasporti)
          const totalCost = (transportsData || []).reduce((sum: number, transport: any) => {
            if (transport.cost && typeof transport.cost === 'number') {
              return sum + transport.cost;
            }
            return sum;
          }, 0);

          // Arricchisci i voti con nome completo
          const votesWithEmails = await Promise.all(
            (votesData || []).map(async (vote) => {
              const displayName = await getUserDisplayName(vote.user_id);
              return {
                ...vote,
                user_email: displayName.includes('@') ? displayName : undefined, // Mantieni email solo se è email
                display_name: displayName,
              };
            })
          );

          const voteCountYes = votesWithEmails.filter(v => v.vote_type === 'yes').length;
          const voteCountNo = votesWithEmails.filter(v => v.vote_type === 'no').length;
          const voteCountProponi = votesWithEmails.filter(v => v.vote_type === 'proponi').length;
          const userVote = user ? votesWithEmails.find(v => v.user_id === user.id) || null : null;

          return {
            ...destination,
            places: placesData || [],
            votes: votesWithEmails,
            vote_count_yes: voteCountYes,
            vote_count_no: voteCountNo,
            vote_count_proponi: voteCountProponi,
            user_vote: userVote,
            total_cost: totalCost,
            transports: transportsData || [],
            // I tags vengono restituiti come array JSON da Supabase
            tags: destination.tags ? (Array.isArray(destination.tags) ? destination.tags : JSON.parse(destination.tags as any)) : [],
          };
        })
      );

      // Carica i partecipanti
      const { data: participantsData, error: participantsError } = await supabase
        .from('adventure_participants')
        .select('*')
        .eq('adventure_id', adventureId);

      if (participantsError) {
        console.error('Errore nel caricamento dei partecipanti:', participantsError);
      }

      // Arricchisci i partecipanti con email e nome completo
      const participantsWithEmails = await Promise.all(
        (participantsData || []).map(enrichParticipant)
      );

      // Carica i creator dell'avventura
      const { data: creatorsData } = await supabase
        .from('adventure_creators')
        .select('*')
        .eq('adventure_id', adventureId);

      setAdventure({
        ...adventureData,
        destinations: destinationsWithPlaces,
        creators: creatorsData || [],
        participants: participantsWithEmails,
      });
      setParticipants(participantsWithEmails);

      // Inizializza le date
      setDepartureDate(adventureData.departure_date || '');
      setArrivalDate(adventureData.arrival_date || '');

      // Verifica permessi - creator originale, creator aggiunti o superadmin possono modificare
      if (user) {
        const isOriginalCreator = adventureData.created_by === user.id;
        const isAdventureCreator = creatorsData?.some(c => c.user_id === user.id) || false;
        const canManage = isOriginalCreator || isAdventureCreator || actualIsSuperAdmin;
        setCanManageParticipants(canManage);
        setCanEditAdventure(canManage);

        // Verifica se l'utente è partecipante
        const userParticipant = participantsWithEmails?.find(p => p.user_id === user.id);
        setIsParticipant(!!userParticipant && (userParticipant.invitation_status === 'accepted' || userParticipant.invitation_status === null));
      }

      // Carica le proposte di date
      await loadDateProposals();
    } catch (error) {
      console.error('Errore nel caricamento dei dettagli dell\'avventura:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDateProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('adventure_date_proposals')
        .select('*')
        .eq('adventure_id', adventureId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Errore nel caricamento delle proposte di date:', error);
        return;
      }

      // Arricchisci le proposte con i nomi utente
      const proposalsWithNames = await Promise.all(
        (data || []).map(async (proposal) => {
          const displayName = await getUserDisplayName(proposal.user_id);
          return {
            ...proposal,
            user_display_name: displayName,
          };
        })
      );

      setDateProposals(proposalsWithNames);
    } catch (error) {
      console.error('Errore nel caricamento delle proposte di date:', error);
    }
  };

  const handleSaveDates = async () => {
    if (!adventure || !canEditAdventure) return;

    // Validazione
    if (departureDate && arrivalDate && new Date(departureDate) >= new Date(arrivalDate)) {
      alert('La data di arrivo deve essere successiva alla data di partenza');
      return;
    }

    try {
      const { error } = await supabase
        .from('adventures')
        .update({
          departure_date: departureDate || null,
          arrival_date: arrivalDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adventureId);

      if (error) {
        throw error;
      }

      // Aggiorna lo stato locale
      setAdventure({
        ...adventure,
        departure_date: departureDate || null,
        arrival_date: arrivalDate || null,
      });

      setIsEditingDates(false);
    } catch (error: any) {
      console.error('Errore nel salvataggio delle date:', error);
      alert('Errore nel salvataggio delle date: ' + (error.message || 'Errore sconosciuto'));
    }
  };

  const handleDateProposalSuccess = () => {
    loadDateProposals();
    loadAdventureDetails();
  };

  const handleVoteClick = (destinationId: string, voteType: 'yes' | 'no' | 'proponi') => {
    if (!user) return;
    setPendingVote({ destinationId, voteType });
    setVoteComment('');
    setShowVoteModal(true);
  };

  const handleVoteConfirm = async () => {
    if (!user || !pendingVote) return;

    // Il commento è obbligatorio solo per "proponi"
    if (pendingVote.voteType === 'proponi' && !voteComment.trim()) {
      alert('Il commento è obbligatorio per la proposta di modifiche');
      return;
    }

    try {
      // Verifica se esiste già un voto
      const { data: existingVote, error: existingVoteError } = await supabase
        .from('adventure_destination_votes')
        .select('id, destination_id, user_id, vote_type, comment, created_at, updated_at')
        .eq('destination_id', pendingVote.destinationId)
        .eq('user_id', user.id)
        .single();

      // Ignora errori 400 se causati da RLS
      if (existingVoteError && existingVoteError.code !== 'PGRST116' && existingVoteError.code !== '400') {
        console.warn('Errore nel recupero del voto esistente:', existingVoteError);
      }

      const commentToSave = voteComment.trim() || null;

      if (existingVote) {
        // Aggiorna voto esistente
        const { error } = await supabase
          .from('adventure_destination_votes')
          .update({
            vote_type: pendingVote.voteType,
            comment: commentToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingVote.id);

        if (error) throw error;
      } else {
        // Crea nuovo voto
        const { error } = await supabase
          .from('adventure_destination_votes')
          .insert({
            destination_id: pendingVote.destinationId,
            user_id: user.id,
            vote_type: pendingVote.voteType,
            comment: commentToSave,
          });

        if (error) throw error;
      }

      // Chiudi modal e ricarica
      setShowVoteModal(false);
      setPendingVote(null);
      setVoteComment('');
      loadAdventureDetails();
    } catch (error) {
      console.error('Errore nella votazione:', error);
      alert('Errore nel salvataggio del voto');
    }
  };

  const handleVoteCancel = () => {
    setShowVoteModal(false);
    setPendingVote(null);
    setVoteComment('');
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!window.confirm('Sei sicuro di voler rimuovere questo partecipante?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('adventure_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      loadAdventureDetails();
    } catch (error) {
      console.error('Errore nella rimozione del partecipante:', error);
      alert('Errore nella rimozione del partecipante');
    }
  };

  // Mostra la pagina dettaglio destinazione se selezionata
  if (selectedDestinationId) {
    return (
      <DestinationDetailPage
        adventureId={adventureId}
        destinationId={selectedDestinationId}
        onBack={() => setSelectedDestinationId(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="adventure-detail-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Caricamento dettagli avventura...</p>
      </div>
    );
  }

  if (!adventure) {
    return (
      <div className="adventure-detail-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>Avventura non trovata</p>
        <button onClick={onBack} className="back-btn">
          <i className="fas fa-arrow-left"></i> Torna Indietro
        </button>
      </div>
    );
  }

  return (
    <div className="adventure-detail">
      <div className="adventure-detail-header">
        <button onClick={onBack} className="back-btn">
          <i className="fas fa-arrow-left"></i> Torna Indietro
        </button>
        <div className="header-content">
          <h1>{adventure.name}</h1>
          <div className="header-actions">
            {onViewVoting && (
              <button
                className="view-voting-btn"
                title="Visualizza riepilogo votazioni"
                onClick={() => onViewVoting(adventureId)}
              >
                <i className="fas fa-chart-bar"></i>
                Votazioni
              </button>
            )}
            {canEditAdventure && onEdit && (
              <button
                className="edit-adventure-btn"
                title="Modifica avventura"
                onClick={() => onEdit(adventureId)}
              >
                <i className="fas fa-edit"></i>
                Modifica
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="adventure-detail-content">
        {adventure.description && (
          <section className="adventure-section">
            <h2>
              <i className="fas fa-align-left"></i> Descrizione
            </h2>
            <p>{adventure.description}</p>
          </section>
        )}

        <section className="adventure-section">
          <h2>
            <i className="fas fa-calendar-alt"></i> Date
          </h2>
          <div className="adventure-dates">
            {canEditAdventure && !isEditingDates ? (
              <>
                {adventure.departure_date ? (
                  <div className="date-item">
                    <strong>Partenza:</strong>
                    <span>{new Date(adventure.departure_date).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}</span>
                  </div>
                ) : (
                  <div className="date-item no-date">
                    <span>Data di partenza non impostata</span>
                  </div>
                )}
                {adventure.arrival_date ? (
                  <div className="date-item">
                    <strong>Arrivo:</strong>
                    <span>{new Date(adventure.arrival_date).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}</span>
                  </div>
                ) : (
                  <div className="date-item no-date">
                    <span>Data di arrivo non impostata</span>
                  </div>
                )}
                <button
                  className="edit-dates-btn"
                  onClick={() => setIsEditingDates(true)}
                  title="Modifica date"
                >
                  <i className="fas fa-edit"></i>
                  Modifica Date
                </button>
              </>
            ) : canEditAdventure && isEditingDates ? (
              <div className="dates-editor">
                <BookingDatePicker
                  departureDate={departureDate || null}
                  arrivalDate={arrivalDate || null}
                  onDatesChange={(dep, arr) => {
                    setDepartureDate(dep || '');
                    setArrivalDate(arr || '');
                  }}
                  minDate={new Date().toISOString().split('T')[0]}
                />
                <div className="dates-actions">
                  <button
                    className="btn btn-cancel"
                    onClick={() => {
                      setIsEditingDates(false);
                      setDepartureDate(adventure.departure_date || '');
                      setArrivalDate(adventure.arrival_date || '');
                    }}
                  >
                    Annulla
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveDates}
                  >
                    <i className="fas fa-save"></i>
                    Salva Date
                  </button>
                </div>
              </div>
            ) : (
              <>
                {adventure.departure_date ? (
                  <div className="date-item">
                    <strong>Partenza:</strong>
                    <span>{new Date(adventure.departure_date).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}</span>
                  </div>
                ) : (
                  <div className="date-item no-date">
                    <span>Data di partenza non impostata</span>
                  </div>
                )}
                {adventure.arrival_date ? (
                  <div className="date-item">
                    <strong>Arrivo:</strong>
                    <span>{new Date(adventure.arrival_date).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}</span>
                  </div>
                ) : (
                  <div className="date-item no-date">
                    <span>Data di arrivo non impostata</span>
                  </div>
                )}
                {isParticipant && (
                  <button
                    className="propose-dates-btn"
                    onClick={() => setShowDateProposalModal(true)}
                    title="Proponi date alternative"
                  >
                    <i className="fas fa-thumbs-up"></i>
                    Proponi Date Alternative
                  </button>
                )}
              </>
            )}
            
            {dateProposals.length > 0 && (
              <div className="date-proposals">
                <h3>Proposte di Date</h3>
                {dateProposals.map((proposal) => (
                  <div key={proposal.id} className="date-proposal-item">
                    <div className="proposal-header">
                      <span className="proposal-author">
                        <i className="fas fa-user"></i>
                        {proposal.user_display_name || 'Utente'}
                      </span>
                      <span className="proposal-date">
                        {new Date(proposal.created_at).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    <div className="proposal-dates">
                      <span>
                        <i className="fas fa-plane-departure"></i>
                        {proposal.proposed_departure_date 
                          ? new Date(proposal.proposed_departure_date).toLocaleDateString('it-IT')
                          : 'Non specificata'}
                      </span>
                      <span>
                        <i className="fas fa-plane-arrival"></i>
                        {proposal.proposed_arrival_date 
                          ? new Date(proposal.proposed_arrival_date).toLocaleDateString('it-IT')
                          : 'Non specificata'}
                      </span>
                    </div>
                    {proposal.comment && (
                      <div className="proposal-comment">
                        <i className="fas fa-comment"></i>
                        {proposal.comment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="adventure-section">
          <h2>
            <i className="fas fa-map"></i> Destinazioni Proposte ({adventure.destinations.length})
          </h2>
          <div className="destinations-list">
            {adventure.destinations.length > 0 ? (
              adventure.destinations.map((destination) => (
                <div key={destination.id} className="destination-card">
                  {destination.image_url && (
                    <div className="destination-image">
                      <img src={destination.image_url} alt={destination.name} />
                    </div>
                  )}
                  <div className="destination-header">
                    <h3>{destination.name}</h3>
                  </div>
                  {destination.description && (
                    <p className="destination-description">{destination.description}</p>
                  )}
                  
                  {destination.tags && (Array.isArray(destination.tags) ? destination.tags : []).length > 0 && (
                    <div className="destination-tags">
                      {(Array.isArray(destination.tags) ? destination.tags : []).map((tag: string, index: number) => (
                        <span key={index} className="destination-tag">
                          <i className="fas fa-check"></i>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {destination.total_cost !== undefined && destination.total_cost > 0 && (
                    <div className="destination-total-cost">
                      <i className="fas fa-euro-sign"></i>
                      <span className="cost-label">Costo totale:</span>
                      <span className="cost-value">€{destination.total_cost.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="destination-actions">
                    <button
                      className="view-destination-details-btn"
                      onClick={() => {
                        setSelectedDestinationId(destination.id);
                      }}
                    >
                      <i className="fas fa-eye"></i>
                      Vedi Dettagli Destinazione
                    </button>
                  </div>

                  <div className="destination-voting">
                    <div className="vote-stats">
                      <div className="vote-stat-item">
                        <i className="fas fa-thumbs-up"></i>
                        <span>{destination.vote_count_yes || 0}</span>
                      </div>
                      <div className="vote-stat-item">
                        <i className="fas fa-thumbs-down"></i>
                        <span>{destination.vote_count_no || 0}</span>
                      </div>
                      <div className="vote-stat-item">
                        <i className="fas fa-lightbulb"></i>
                        <span>{destination.vote_count_proponi || 0}</span>
                      </div>
                    </div>
                    {user && (
                      <div className="vote-actions">
                        <button
                          className={`vote-btn vote-yes ${destination.user_vote?.vote_type === 'yes' ? 'active' : ''}`}
                          onClick={() => handleVoteClick(destination.id, 'yes')}
                        >
                          <i className="fas fa-thumbs-up"></i>
                          Sì
                        </button>
                        <button
                          className={`vote-btn vote-no ${destination.user_vote?.vote_type === 'no' ? 'active' : ''}`}
                          onClick={() => handleVoteClick(destination.id, 'no')}
                        >
                          <i className="fas fa-thumbs-down"></i>
                          No
                        </button>
                        <button
                          className={`vote-btn vote-proponi ${destination.user_vote?.vote_type === 'proponi' ? 'active' : ''}`}
                          onClick={() => handleVoteClick(destination.id, 'proponi')}
                        >
                          <i className="fas fa-lightbulb"></i>
                          Proponi
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-items">Nessuna destinazione proposta ancora.</p>
            )}
          </div>
        </section>

        <section className="adventure-section">
          <div className="section-header-with-action">
            <h2>
              <i className="fas fa-users"></i> Partecipanti ({participants.length})
            </h2>
            {canManageParticipants && (
              <button
                className="add-participant-btn"
                onClick={() => setShowAddParticipantModal(true)}
              >
                <i className="fas fa-user-plus"></i> Aggiungi Partecipante
              </button>
            )}
          </div>
          <div className="participants-list">
            {participants.length > 0 ? (
              <ul className="participants-ul">
                {participants.map((participant) => {
                  // Verifica se il partecipante è anche un creator
                  const isCreator = adventure?.creators?.some(creator => creator.user_id === participant.user_id) || 
                                   adventure?.created_by === participant.user_id;
                  
                  return (
                    <li key={participant.id} className="participant-item">
                      <div className="participant-info">
                        <i className="fas fa-user"></i>
                        <span>
                          {participant.display_name || participant.user_email || 'Email non disponibile'}
                          {isCreator && (
                            <span className="creator-badge" title="Creator dell'avventura">
                              <i className="fas fa-crown"></i>
                            </span>
                          )}
                        </span>
                        <span className="participant-added-date">
                          Aggiunto il {new Date(participant.created_at).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                      {canManageParticipants && !isCreator && participant.user_id !== user?.id && (
                        <button
                          className="remove-participant-btn"
                          onClick={() => handleRemoveParticipant(participant.id)}
                          title="Rimuovi partecipante"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="no-items">Nessun partecipante aggiunto ancora.</p>
            )}
          </div>
        </section>
      </div>

      <AddParticipantsModal
        isOpen={showAddParticipantModal}
        adventureId={adventureId}
        currentParticipants={participants}
        onClose={() => setShowAddParticipantModal(false)}
        onSuccess={loadAdventureDetails}
      />

      {/* Modal per il commento del voto */}
      {showVoteModal && pendingVote && (
        <div className="modal-overlay" onClick={handleVoteCancel}>
          <div className="modal-content vote-comment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className={`fas fa-${
                  pendingVote.voteType === 'yes' ? 'thumbs-up' :
                  pendingVote.voteType === 'no' ? 'thumbs-down' :
                  'lightbulb'
                }`}></i>
                {pendingVote.voteType === 'yes' ? 'Vota: Ti Piace' :
                 pendingVote.voteType === 'no' ? 'Vota: Non ti Convince' :
                 'Vota: Proponi Modifiche'}
              </h3>
              <button className="modal-close" onClick={handleVoteCancel}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p className="vote-modal-hint">
                {pendingVote.voteType === 'proponi' 
                  ? 'Il commento è obbligatorio per proporre modifiche. Spiega quali modifiche vorresti vedere.'
                  : pendingVote.voteType === 'yes'
                  ? 'Aggiungi un commento opzionale per spiegare perché ti piace questa destinazione.'
                  : 'Aggiungi un commento opzionale per spiegare perché non ti convince questa destinazione.'}
              </p>
              <div className="form-group">
                <label htmlFor="voteComment">
                  <i className="fas fa-comment"></i> Commento {pendingVote.voteType === 'proponi' ? '*' : '(opzionale)'}
                </label>
                <textarea
                  id="voteComment"
                  value={voteComment}
                  onChange={(e) => setVoteComment(e.target.value)}
                  placeholder={
                    pendingVote.voteType === 'yes' ? 'Spiega perché ti piace questa destinazione... (opzionale)' :
                    pendingVote.voteType === 'no' ? 'Spiega perché non ti convince... (opzionale)' :
                    'Spiega quali modifiche vorresti proporre... (obbligatorio)'
                  }
                  rows={5}
                  required={pendingVote.voteType === 'proponi'}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleVoteCancel}>
                <i className="fas fa-times"></i> Annulla
              </button>
              <button
                className="btn btn-primary"
                onClick={handleVoteConfirm}
                disabled={pendingVote.voteType === 'proponi' && !voteComment.trim()}
              >
                <i className="fas fa-check"></i> Conferma Voto
              </button>
            </div>
          </div>
        </div>
      )}

      {showDateProposalModal && (
        <DateProposalModal
          isOpen={showDateProposalModal}
          adventureId={adventureId}
          currentDepartureDate={adventure?.departure_date || null}
          currentArrivalDate={adventure?.arrival_date || null}
          onClose={() => setShowDateProposalModal(false)}
          onSuccess={handleDateProposalSuccess}
        />
      )}
    </div>
  );
};

export default AdventureDetail;
