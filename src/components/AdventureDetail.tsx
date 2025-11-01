import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { AdventureWithDestinations, AdventureParticipant } from '../types/adventures';
import AddParticipantsModal from './AddParticipantsModal';
import '../styles/components/AdventureDetail.scss';

interface AdventureDetailProps {
  adventureId: string;
  onBack: () => void;
  onEdit?: (adventureId: string) => void;
}

const AdventureDetail: React.FC<AdventureDetailProps> = ({ adventureId, onBack, onEdit }) => {
  const { user, actualIsSuperAdmin } = useAuth();
  const [adventure, setAdventure] = useState<AdventureWithDestinations | null>(null);
  const [participants, setParticipants] = useState<AdventureParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [canManageParticipants, setCanManageParticipants] = useState(false);
  const [canEditAdventure, setCanEditAdventure] = useState(false);

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
          const { data: votesData } = await supabase
            .from('adventure_destination_votes')
            .select('*')
            .eq('destination_id', destination.id);

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
          const userVote = user ? votesWithEmails.find(v => v.user_id === user.id) || null : null;

          return {
            ...destination,
            places: placesData || [],
            votes: votesWithEmails,
            vote_count_yes: voteCountYes,
            vote_count_no: voteCountNo,
            user_vote: userVote,
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

      // Ottieni le email degli utenti partecipanti
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

      // Verifica permessi - creator originale, creator aggiunti o superadmin possono modificare
      if (user) {
        const isOriginalCreator = adventureData.created_by === user.id;
        const isAdventureCreator = creatorsData?.some(c => c.user_id === user.id) || false;
        const canManage = isOriginalCreator || isAdventureCreator || actualIsSuperAdmin;
        setCanManageParticipants(canManage);
        setCanEditAdventure(canManage);
      }
    } catch (error) {
      console.error('Errore nel caricamento dei dettagli dell\'avventura:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (destinationId: string, voteType: 'yes' | 'no', comment?: string) => {
    if (!user) return;

    try {
      // Verifica se esiste già un voto
      const { data: existingVote } = await supabase
        .from('adventure_destination_votes')
        .select('*')
        .eq('destination_id', destinationId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        // Aggiorna voto esistente
        const { error } = await supabase
          .from('adventure_destination_votes')
          .update({
            vote_type: voteType,
            comment: comment || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingVote.id);

        if (error) throw error;
      } else {
        // Crea nuovo voto
        const { error } = await supabase
          .from('adventure_destination_votes')
          .insert({
            destination_id: destinationId,
            user_id: user.id,
            vote_type: voteType,
            comment: comment || null,
          });

        if (error) throw error;
      }

      // Ricarica i dettagli
      loadAdventureDetails();
    } catch (error) {
      console.error('Errore nella votazione:', error);
      alert('Errore nel salvataggio del voto');
    }
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
            <div className="date-item">
              <strong>Creata il:</strong>
              <span>{new Date(adventure.created_at).toLocaleString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}</span>
            </div>
            {adventure.updated_at !== adventure.created_at && (
              <div className="date-item">
                <strong>Aggiornata il:</strong>
                <span>{new Date(adventure.updated_at).toLocaleString('it-IT', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}</span>
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
                  <div className="destination-header">
                    <h3>{destination.name}</h3>
                  </div>
                  {destination.description && (
                    <p className="destination-description">{destination.description}</p>
                  )}

                  <div className="destination-places">
                    <h4>
                      <i className="fas fa-map-marker-alt"></i> Luoghi da Visitare ({destination.places.length})
                    </h4>
                    <ol className="places-list">
                      {destination.places.map((place) => (
                        <li key={place.id} className="place-item">
                          <strong>{place.name}</strong>
                          {place.description && <span className="place-desc">{place.description}</span>}
                        </li>
                      ))}
                    </ol>
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
                    </div>
                    {user && (
                      <div className="vote-actions">
                        <button
                          className={`vote-btn ${destination.user_vote?.vote_type === 'yes' ? 'active' : ''}`}
                          onClick={() => handleVote(destination.id, 'yes')}
                        >
                          <i className="fas fa-thumbs-up"></i>
                          Sì
                        </button>
                        <button
                          className={`vote-btn ${destination.user_vote?.vote_type === 'no' ? 'active' : ''}`}
                          onClick={() => handleVote(destination.id, 'no')}
                        >
                          <i className="fas fa-thumbs-down"></i>
                          No
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
                {participants.map((participant) => (
                  <li key={participant.id} className="participant-item">
                    <div className="participant-info">
                      <i className="fas fa-user"></i>
                      <span>{participant.user_email || 'Email non disponibile'}</span>
                      <span className="participant-added-date">
                        Aggiunto il {new Date(participant.created_at).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    {canManageParticipants && participant.user_id !== user?.id && (
                      <button
                        className="remove-participant-btn"
                        onClick={() => handleRemoveParticipant(participant.id)}
                        title="Rimuovi partecipante"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </li>
                ))}
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
    </div>
  );
};

export default AdventureDetail;
