import React, { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { AdventureWithDestinations, AdventureDestinationWithPlaces } from '../../types/adventures';
import Tooltip from '../Tooltip';
import LazyImage from '../LazyImage';
import { useToast } from '../../hooks/useToast';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
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
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // Drag & Drop per riordinare destinazioni
  const handleReorder = useCallback(async (reorderedDestinations: AdventureDestinationWithPlaces[]) => {
    setIsReordering(true);
    try {
      // Aggiorna order_index per ogni destinazione
      const updates = reorderedDestinations.map((destination, index) => ({
        id: destination.id,
        order_index: index,
      }));

      // Esegui tutti gli aggiornamenti
      const updatePromises = updates.map((update) =>
        supabase
          .from('adventure_destinations')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
      );

      const results = await Promise.all(updatePromises);
      const hasError = results.some((result) => result.error);

      if (hasError) {
        throw new Error('Errore durante il riordinamento');
      }

      showSuccess('Ordine delle destinazioni aggiornato');
      onSuccess();
    } catch (error: any) {
      console.error('Errore nel riordinamento:', error);
      showError('Errore nel riordinamento delle destinazioni');
    } finally {
      setIsReordering(false);
    }
  }, [onSuccess, showSuccess, showError]);

  const { draggedItem, draggedOverIndex, isDragging, getDragProps } = useDragAndDrop({
    items: adventure.destinations,
    onReorder: handleReorder,
    getItemId: (item) => item.id,
    disabled: loading || isReordering,
  });


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

      showSuccess(`Destinazione "${destinationName}" eliminata con successo`);
      onSuccess();
    } catch (error: any) {
      console.error('Errore nell\'eliminazione della destinazione:', error);
      showError('Errore nell\'eliminazione della destinazione');
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
            <p>Gestisci le destinazioni votabili dai partecipanti. Trascina per riordinare.</p>
          </div>
          <Tooltip content="Aggiungi una nuova destinazione all'avventura">
            <button
              className="btn btn-secondary add-item-btn"
              onClick={onOpenAddModal}
              aria-label="Aggiungi destinazione"
              disabled={loading || isReordering}
            >
              <i className="fas fa-plus"></i>
              Aggiungi Destinazione
            </button>
          </Tooltip>
        </div>
      </div>

      {isReordering && (
        <div className="reordering-indicator">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Riordinamento in corso...</span>
        </div>
      )}

      <div className={`destinations-list ${isDragging ? 'dragging' : ''}`}>
        {adventure.destinations.length > 0 ? (
          adventure.destinations.map((destination, index) => {
            const dragProps = getDragProps(index, destination);
            const isDragged = draggedItem?.id === destination.id;
            const isDraggedOver = draggedOverIndex === index;

            return (
              <div
                key={destination.id}
                className={`destination-card-editable ${isDragged ? 'dragged' : ''} ${isDraggedOver ? 'drag-over' : ''}`}
                {...dragProps}
              >
                <div className="drag-handle" title="Trascina per riordinare">
                  <i className="fas fa-grip-vertical"></i>
                </div>
              {destination.image_url && (
                <div className="destination-card-image">
                  <LazyImage 
                    src={destination.image_url} 
                    alt={destination.name}
                  />
                </div>
              )}
              <div className="card-header">
                <div className="card-title">
                  <h3>{destination.name}</h3>
                  {destination.description && (
                    <p className="card-description">{destination.description}</p>
                  )}
                </div>
                <div className="card-actions">
                  <Tooltip content="Modifica questa destinazione">
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => handleEditDestination(destination)}
                      aria-label={`Modifica destinazione ${destination.name}`}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                  </Tooltip>
                  <Tooltip content="Elimina questa destinazione">
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDeleteDestination(destination.id, destination.name)}
                      disabled={loading}
                      aria-label={`Elimina destinazione ${destination.name}`}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </Tooltip>
                </div>
              </div>

              <div className="card-content">
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
                <div className="places-summary">
                  <h4>
                    <i className="fas fa-map-marker-alt"></i>
                    Luoghi da Visitare ({destination.places.length})
                  </h4>
                  {destination.places.length > 0 ? (
                    <div className="places-list-compact">
                      {destination.places.map((place) => {
                        // Parse delle tappe dalla description (separate da newline o punto e virgola)
                        const steps = place.description 
                          ? place.description.split(/\n+|;+/).filter(s => s.trim().length > 0)
                          : [];
                        
                        // Formatta la data (usa visit_date se disponibile, altrimenti created_at)
                        const formatVisitDate = (dateString: string | null | undefined) => {
                          if (!dateString) return null;
                          try {
                            const date = new Date(dateString);
                            const options: Intl.DateTimeFormatOptions = { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'long' 
                            };
                            return date.toLocaleDateString('it-IT', options);
                          } catch {
                            return null;
                          }
                        };

                        // Usa visit_date se disponibile, altrimenti created_at
                        const visitDate = (place as any).visit_date || place.created_at;
                        const formattedDate = formatVisitDate(visitDate);

                        // Usa una key combinata per forzare il re-render quando cambiano i dati
                        const placeKey = `${place.id}-${place.name}-${place.description?.substring(0, 20)}-${steps.length}`;
                        
                        return (
                          <div key={placeKey} className="place-item-compact">
                            {formattedDate && (
                              <div className="place-when">
                                <i className="fas fa-calendar-day"></i>
                                <span>{formattedDate}</span>
                              </div>
                            )}
                            <div className="place-title">
                              <h5>{place.name}</h5>
                            </div>
                            {steps.length > 0 && (
                              <div className="place-steps">
                                {steps.map((step, stepIndex) => (
                                  <div key={`${placeKey}-step-${stepIndex}`} className="place-step">
                                    <div className="step-bullet"></div>
                                    <span>{step.trim()}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
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
            );
          })
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

