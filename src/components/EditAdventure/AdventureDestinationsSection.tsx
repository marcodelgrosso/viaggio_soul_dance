import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AdventureWithDestinations, AdventureDestinationWithPlaces } from '../../types/adventures';
import '../../styles/components/EditAdventureSection.scss';

interface AdventureDestinationsSectionProps {
  adventure: AdventureWithDestinations;
  onSuccess: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (destination: AdventureDestinationWithPlaces) => void;
}

const AdventureDestinationsSection: React.FC<AdventureDestinationsSectionProps> = ({
  adventure,
  onSuccess,
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDeleteDestination = async (destinationId: string, destinationName: string) => {
    if (!window.confirm(`Sei sicuro di voler eliminare la destinazione "${destinationName}"? Questa azione è irreversibile.`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('adventure_destinations')
        .delete()
        .eq('id', destinationId);

      if (error) {
        throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Errore nell\'eliminazione della destinazione:', error);
      alert('Errore nell\'eliminazione della destinazione');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDestination = (destination: AdventureDestinationWithPlaces) => {
    onOpenEditModal(destination);
  };

  return (
    <div className="edit-section">
      <div className="section-header">
        <div className="section-header-content">
          <div>
            <h2>
              <i className="fas fa-map"></i>
              Destinazioni Proposte
            </h2>
            <p>Gestisci le destinazioni votabili dai partecipanti</p>
          </div>
          <button
            className="btn btn-secondary add-item-btn"
            onClick={onOpenAddModal}
          >
            <i className="fas fa-plus"></i>
            Aggiungi Destinazione
          </button>
        </div>
      </div>

      <div className="destinations-list">
        {adventure.destinations.length > 0 ? (
          adventure.destinations.map((destination) => (
            <div key={destination.id} className="destination-card-editable">
              <div className="card-header">
                <div className="card-title">
                  <h3>{destination.name}</h3>
                  {destination.description && (
                    <p className="card-description">{destination.description}</p>
                  )}
                </div>
                <div className="card-actions">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => handleEditDestination(destination)}
                    title="Modifica destinazione"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDeleteDestination(destination.id, destination.name)}
                    disabled={loading}
                    title="Elimina destinazione"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              <div className="card-content">
                <div className="places-summary">
                  <h4>
                    <i className="fas fa-map-marker-alt"></i>
                    Luoghi da Visitare ({destination.places.length})
                  </h4>
                  {destination.places.length > 0 ? (
                    <ul className="places-list-compact">
                      {destination.places.map((place) => (
                        <li key={place.id}>
                          <strong>{place.name}</strong>
                          {place.description && <span className="place-desc">{place.description}</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-items">Nessun luogo aggiunto</p>
                  )}
                </div>

                <div className="vote-stats-compact">
                  <div className="vote-stat">
                    <i className="fas fa-thumbs-up"></i>
                    <span>{destination.vote_count_yes || 0}</span>
                  </div>
                  <div className="vote-stat">
                    <i className="fas fa-thumbs-down"></i>
                    <span>{destination.vote_count_no || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <i className="fas fa-map"></i>
            <p>Nessuna destinazione proposta ancora</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdventureDestinationsSection;

