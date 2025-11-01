import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AdventureWithDestinations, AdventureParticipant } from '../../types/adventures';
import AddParticipantsModal from '../AddParticipantsModal';
import '../../styles/components/EditAdventureSection.scss';

interface AdventureParticipantsSectionProps {
  adventure: AdventureWithDestinations;
  onSuccess: () => void;
}

const AdventureParticipantsSection: React.FC<AdventureParticipantsSectionProps> = ({
  adventure,
  onSuccess,
}) => {
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRemoveParticipant = async (participantId: string, participantEmail: string) => {
    if (!window.confirm(`Sei sicuro di voler rimuovere ${participantEmail} dai partecipanti?`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('adventure_participants')
        .delete()
        .eq('id', participantId);

      if (error) {
        throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Errore nella rimozione del partecipante:', error);
      alert('Errore nella rimozione del partecipante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-section">
      <div className="section-header">
        <div className="section-header-content">
          <div>
            <h2>
              <i className="fas fa-users"></i>
              Partecipanti
            </h2>
            <p>Gestisci i partecipanti dell'avventura</p>
          </div>
          <button
            className="btn btn-secondary add-item-btn"
            onClick={() => setShowAddParticipantModal(true)}
          >
            <i className="fas fa-user-plus"></i>
            Aggiungi Partecipante
          </button>
        </div>
      </div>

      <div className="participants-list-editable">
        {adventure.participants.length > 0 ? (
          <div className="participants-grid">
            {adventure.participants.map((participant) => (
              <div key={participant.id} className="participant-card">
                <div className="participant-info">
                  <div className="participant-avatar">
                    <i className="fas fa-user"></i>
                  </div>
                  <div className="participant-details">
                    <h4>{participant.user_email || 'Email non disponibile'}</h4>
                    <p className="participant-date">
                      Aggiunto il {new Date(participant.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
                <button
                  className="btn-icon btn-delete"
                  onClick={() => handleRemoveParticipant(participant.id, participant.user_email || '')}
                  disabled={loading}
                  title="Rimuovi partecipante"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-users"></i>
            <p>Nessun partecipante aggiunto ancora</p>
          </div>
        )}
      </div>

      <AddParticipantsModal
        isOpen={showAddParticipantModal}
        adventureId={adventure.id}
        currentParticipants={adventure.participants}
        onClose={() => setShowAddParticipantModal(false)}
        onSuccess={onSuccess}
      />
    </div>
  );
};

export default AdventureParticipantsSection;

