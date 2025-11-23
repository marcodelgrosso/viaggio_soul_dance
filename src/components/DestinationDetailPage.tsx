import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { AdventureDestinationWithPlaces, DestinationTransport } from '../types/adventures';
import TransportModal from './TransportModal';
import '../styles/components/DestinationDetailPage.scss';

interface DestinationDetailPageProps {
  adventureId: string;
  destinationId: string;
  onBack: () => void;
}

const DestinationDetailPage: React.FC<DestinationDetailPageProps> = ({
  adventureId,
  destinationId,
  onBack,
}) => {
  const { user, actualIsSuperAdmin } = useAuth();
  const [destination, setDestination] = useState<AdventureDestinationWithPlaces | null>(null);
  const [transports, setTransports] = useState<DestinationTransport[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [editingTransport, setEditingTransport] = useState<DestinationTransport | null>(null);

  useEffect(() => {
    loadDestinationDetails();
  }, [destinationId]);

  const loadDestinationDetails = async () => {
    try {
      setLoading(true);

      // Carica l'avventura per verificare i permessi
      const { data: adventureData } = await supabase
        .from('adventures')
        .select('created_by, adventure_creators(user_id)')
        .eq('id', adventureId)
        .single();

      if (user && adventureData) {
        const isCreator = adventureData.created_by === user.id || 
                         actualIsSuperAdmin ||
                         (adventureData.adventure_creators as any[])?.some((c: any) => c.user_id === user.id);
        setCanEdit(!!isCreator);
      }

      // Carica la destinazione
      const { data: destinationData, error: destinationError } = await supabase
        .from('adventure_destinations')
        .select('*')
        .eq('id', destinationId)
        .single();

      if (destinationError) {
        throw destinationError;
      }

      // Carica i luoghi
      const { data: placesData } = await supabase
        .from('adventure_destination_places')
        .select('*')
        .eq('destination_id', destinationId)
        .order('order_index', { ascending: true });

      // Carica i trasporti
      const { data: transportsData } = await supabase
        .from('destination_transport')
        .select('*')
        .eq('destination_id', destinationId)
        .order('departure_date', { ascending: true })
        .order('departure_time', { ascending: true });

      // Processa i tags se sono JSON
      const processedTags = destinationData.tags
        ? Array.isArray(destinationData.tags)
          ? destinationData.tags
          : JSON.parse(destinationData.tags as any)
        : [];

      setDestination({
        ...destinationData,
        places: placesData || [],
        tags: processedTags,
        votes: [],
      } as AdventureDestinationWithPlaces);

      setTransports(transportsData || []);
    } catch (error) {
      console.error('Errore nel caricamento della destinazione:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcola il costo totale di tutti i trasporti
  const totalCost = transports.reduce((sum, transport) => {
    if (transport.cost && typeof transport.cost === 'number') {
      return sum + transport.cost;
    }
    return sum;
  }, 0);

  const handleAddTransport = () => {
    setEditingTransport(null);
    setShowTransportModal(true);
  };

  const handleEditTransport = (transport: DestinationTransport) => {
    setEditingTransport(transport);
    setShowTransportModal(true);
  };

  const handleDeleteTransport = async (transportId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo trasporto/alloggio?')) return;

    try {
      const { error } = await supabase
        .from('destination_transport')
        .delete()
        .eq('id', transportId);

      if (error) throw error;

      loadDestinationDetails();
    } catch (error: any) {
      console.error('Errore nell\'eliminazione:', error);
      alert('Errore nell\'eliminazione: ' + (error.message || 'Errore sconosciuto'));
    }
  };

  const formatDateTime = (date: string | null, time: string | null): string => {
    if (!date) return '';
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
    });
    if (time) {
      return `${dateStr} alle ${time.slice(0, 5)}`;
    }
    return dateStr;
  };

  const getTransportIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      flight: 'fa-plane',
      train: 'fa-train',
      hotel: 'fa-hotel',
      bus: 'fa-bus',
      car: 'fa-car',
      other: 'fa-ellipsis-h',
    };
    return icons[type] || 'fa-ellipsis-h';
  };

  const getTransportLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      flight: 'Volo',
      train: 'Treno',
      hotel: 'Albergo',
      bus: 'Bus',
      car: 'Auto',
      other: 'Altro',
    };
    return labels[type] || 'Altro';
  };

  const getCostTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      fixed: 'Fisso',
      estimated: 'Stimato',
      variable: 'Variabile',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="destination-detail-page">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Caricamento dettagli destinazione...</p>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="destination-detail-page">
        <div className="error">
          <i className="fas fa-exclamation-circle"></i>
          <p>Destinazione non trovata</p>
          <button onClick={onBack} className="back-btn">
            Torna Indietro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="destination-detail-page">
      <div className="destination-detail-header">
        <button onClick={onBack} className="back-btn">
          <i className="fas fa-arrow-left"></i> Torna Indietro
        </button>
        <h1>
          <i className="fas fa-map-marker-alt"></i>
          {destination.name}
        </h1>
      </div>

      <div className="destination-detail-content">
        {destination.image_url && (
          <div className="destination-detail-hero">
            <div className="destination-detail-image">
              <img src={destination.image_url} alt={destination.name} />
            </div>
            <div className="destination-hero-overlay">
              <h2>{destination.name}</h2>
            </div>
          </div>
        )}

        <div className="destination-detail-body">
          {destination.description && (
            <section className="destination-detail-section">
              <h2>
                <i className="fas fa-info-circle"></i>
                Descrizione
              </h2>
              <div className="section-content">
                <p>{destination.description}</p>
              </div>
            </section>
          )}

          {destination.tags && (Array.isArray(destination.tags) ? destination.tags : []).length > 0 && (
            <section className="destination-detail-section destination-tags-section">
              <h2>
                <i className="fas fa-tags"></i>
                Caratteristiche
              </h2>
              <div className="section-content">
                <div className="tags-list">
                  {(Array.isArray(destination.tags) ? destination.tags : []).map((tag: string, index: number) => (
                    <span key={index} className="tag-item">
                      <i className="fas fa-check"></i>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="destination-detail-section destination-transport-section">
            <div className="section-header-with-action">
              <h2>
                <i className="fas fa-route"></i>
                Trasporti e Alloggi
                {transports.length > 0 && (
                  <span className="transport-count">({transports.length})</span>
                )}
              </h2>
              {canEdit && (
                <button className="add-transport-btn" onClick={handleAddTransport}>
                  <i className="fas fa-plus"></i>
                  Aggiungi
                </button>
              )}
            </div>
            <div className="section-content">
              {transports.length > 0 && totalCost > 0 && (
                <div className="total-cost-summary">
                  <div className="total-cost-content">
                    <div className="total-cost-icon-wrapper">
                      <i className="fas fa-calculator"></i>
                    </div>
                    <div className="total-cost-info">
                      <span className="total-cost-label">Costo totale destinazione</span>
                      <div className="total-cost-amount">
                        <span className="currency">€</span>
                        <span className="amount">{totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {transports.length > 0 ? (
                <div className="transports-grid">
                  {transports.map((transport) => (
                    <div key={transport.id} className="transport-card">
                      <div className="transport-header">
                        <div className="transport-icon">
                          <i className={`fas ${getTransportIcon(transport.transport_type)}`}></i>
                        </div>
                        <div className="transport-info">
                          <h3>{getTransportLabel(transport.transport_type)}</h3>
                          {canEdit && (
                            <div className="transport-actions">
                              <button
                                className="edit-transport-btn"
                                onClick={() => handleEditTransport(transport)}
                                title="Modifica"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="delete-transport-btn"
                                onClick={() => handleDeleteTransport(transport.id)}
                                title="Elimina"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="transport-details">
                        {(transport.departure_date || transport.arrival_date) && (
                          <div className="transport-dates">
                            {transport.transport_type === 'hotel' ? (
                              <>
                                {transport.arrival_date && (
                                  <div className="transport-date-item">
                                    <i className="fas fa-plane-arrival"></i>
                                    <div>
                                      <strong>Check-In:</strong>
                                      <span>{formatDateTime(transport.arrival_date, transport.arrival_time || null)}</span>
                                    </div>
                                  </div>
                                )}
                                {transport.departure_date && (
                                  <div className="transport-date-item">
                                    <i className="fas fa-plane-departure"></i>
                                    <div>
                                      <strong>Check-Out:</strong>
                                      <span>{formatDateTime(transport.departure_date, transport.departure_time || null)}</span>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                {transport.departure_date && (
                                  <div className="transport-date-item">
                                    <i className="fas fa-plane-departure"></i>
                                    <div>
                                      <strong>Partenza:</strong>
                                      <span>{formatDateTime(transport.departure_date, transport.departure_time || null)}</span>
                                    </div>
                                  </div>
                                )}
                                {transport.arrival_date && (
                                  <div className="transport-date-item">
                                    <i className="fas fa-plane-arrival"></i>
                                    <div>
                                      <strong>Arrivo:</strong>
                                      <span>{formatDateTime(transport.arrival_date, transport.arrival_time || null)}</span>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                        {transport.cost !== null && (
                          <div className="transport-cost">
                            <i className="fas fa-euro-sign"></i>
                            <div>
                              <strong>Costo:</strong>
                              <span>
                                €{transport.cost ? transport.cost.toFixed(2) : 'N/A'}
                                <span className={`cost-type-badge ${transport.cost_type}`}>
                                  ({getCostTypeLabel(transport.cost_type)})
                                </span>
                              </span>
                            </div>
                          </div>
                        )}
                        {transport.info_link && (
                          <div className="transport-info-link">
                            <i className="fas fa-external-link-alt"></i>
                            <a
                              href={transport.info_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="info-link-btn"
                            >
                              Vedi informazioni
                              <i className="fas fa-arrow-right"></i>
                            </a>
                          </div>
                        )}
                        {transport.notes && (
                          <div className="transport-notes">
                            <i className="fas fa-comment"></i>
                            <p>{transport.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-transports">
                  <i className="fas fa-route"></i>
                  <p>
                    {canEdit 
                      ? 'Nessun trasporto o alloggio aggiunto. Clicca "Aggiungi" per inserire le informazioni.'
                      : 'Nessun trasporto o alloggio disponibile.'}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="destination-detail-section destination-places-section">
            <h2>
              <i className="fas fa-map-pin"></i>
              Piano di Viaggio
              {destination.places.length > 0 && (
                <span className="places-count">({destination.places.length} {destination.places.length === 1 ? 'giorno' : 'giorni'})</span>
              )}
            </h2>
            <div className="section-content">
              {destination.places.length > 0 ? (
                <div className="places-list">
                  {destination.places.map((place) => {
                    // Parse delle tappe dalla description (separate da newline o punto e virgola)
                    const steps = place.description 
                      ? place.description.split(/\n+|;+/).filter(s => s.trim().length > 0)
                      : [];
                    
                    // Formatta la data (usando created_at per ora, o potremmo aggiungere un campo visit_date)
                    const formatVisitDate = (dateString: string) => {
                      const date = new Date(dateString);
                      const options: Intl.DateTimeFormatOptions = { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      };
                      return date.toLocaleDateString('it-IT', options);
                    };

                    return (
                      <div key={place.id} className="place-item">
                        <div className="place-when">
                          <i className="fas fa-calendar-day"></i>
                          <span>{formatVisitDate(place.created_at)}</span>
                        </div>
                        <div className="place-title">
                          <h3>{place.name}</h3>
                        </div>
                        {steps.length > 0 && (
                          <div className="place-steps">
                            {steps.map((step, stepIndex) => (
                              <div key={stepIndex} className="place-step">
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
                <div className="no-places">
                  <i className="fas fa-calendar-alt"></i>
                  <p>Nessun giorno aggiunto al piano di viaggio ancora.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {showTransportModal && (
        <TransportModal
          isOpen={showTransportModal}
          destinationId={destinationId}
          transport={editingTransport}
          onClose={() => {
            setShowTransportModal(false);
            setEditingTransport(null);
          }}
          onSuccess={() => {
            loadDestinationDetails();
          }}
        />
      )}
    </div>
  );
};

export default DestinationDetailPage;

