import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { AdventureDestinationWithPlaces, DestinationTransport } from '../../types/adventures';
import SingleDatePicker from '../SingleDatePicker';
import TransportModal from '../TransportModal';
import '../../styles/components/EditAdventureSection.scss';

interface EditDestinationPageProps {
  destination: AdventureDestinationWithPlaces;
  onBack: () => void;
  onSuccess: () => void;
}

interface Place {
  id?: string;
  name: string;
  description: string;
  visit_date?: string;
  steps: string[];
}

const EditDestinationPage: React.FC<EditDestinationPageProps> = ({
  destination,
  onBack,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'viaggio' | 'trasporti' | 'alloggi'>('viaggio');
  const [transports, setTransports] = useState<DestinationTransport[]>([]);
  const [transportsLoading, setTransportsLoading] = useState(false);
  const [transportError, setTransportError] = useState('');
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [editingTransport, setEditingTransport] = useState<DestinationTransport | null>(null);
  const [modalInitialType, setModalInitialType] = useState<DestinationTransport['transport_type']>('flight');

  useEffect(() => {
    if (destination) {
      setName(destination.name);
      setDescription(destination.description || '');
      setImageUrl(destination.image_url || '');
      setTags(Array.isArray(destination.tags) ? destination.tags : (destination.tags ? JSON.parse(destination.tags as any) : []));
      setPlaces(
        destination.places.length > 0
          ? destination.places.map(p => {
              // Parse delle tappe dalla description (separate da newline o punto e virgola)
              const steps = p.description 
                ? p.description.split(/\n+|;+/).filter(s => s.trim().length > 0).map(s => s.trim())
                : [];
              
              return { 
                id: p.id, 
                name: p.name, 
                description: p.description || '',
                visit_date: (p as any).visit_date || '',
                steps: steps.length > 0 ? steps : ['']
              };
            })
          : [{ name: '', description: '', visit_date: '', steps: [''] }]
      );
    }
  }, [destination]);

  const loadTransports = useCallback(async () => {
    if (!destination?.id) return;
    setTransportsLoading(true);
    setTransportError('');
    try {
      const { data, error } = await supabase
        .from('destination_transport')
        .select('*')
        .eq('destination_id', destination.id)
        .order('departure_date', { ascending: true })
        .order('departure_time', { ascending: true });

      if (error) {
        throw error;
      }

      setTransports(data || []);
    } catch (err: any) {
      console.error('Errore nel caricamento dei trasporti:', err);
      setTransportError(err.message || 'Errore nel caricamento di trasporti e alloggi');
    } finally {
      setTransportsLoading(false);
    }
  }, [destination]);

  useEffect(() => {
    loadTransports();
  }, [loadTransports]);

  const handleAddPlace = () => {
    setPlaces([...places, { name: '', description: '', visit_date: '', steps: [''] }]);
  };

  const handleRemovePlace = (index: number) => {
    if (places.length > 1) {
      setPlaces(places.filter((_, i) => i !== index));
    }
  };

  const handlePlaceChange = (index: number, field: 'name' | 'description' | 'visit_date', value: string) => {
    const updated = [...places];
    updated[index] = { ...updated[index], [field]: value };
    setPlaces(updated);
  };

  const handleAddStep = (placeIndex: number) => {
    const updated = [...places];
    updated[placeIndex] = { 
      ...updated[placeIndex], 
      steps: [...updated[placeIndex].steps, ''] 
    };
    setPlaces(updated);
  };

  const handleRemoveStep = (placeIndex: number, stepIndex: number) => {
    const updated = [...places];
    if (updated[placeIndex].steps.length > 1) {
      updated[placeIndex] = {
        ...updated[placeIndex],
        steps: updated[placeIndex].steps.filter((_, i) => i !== stepIndex)
      };
      setPlaces(updated);
    }
  };

  const handleStepChange = (placeIndex: number, stepIndex: number, value: string) => {
    const updated = [...places];
    updated[placeIndex].steps[stepIndex] = value;
    setPlaces(updated);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name.trim()) {
      setError('Il nome della destinazione è obbligatorio');
      return;
    }

    const validPlaces = places.filter(p => p.name.trim());
    if (validPlaces.length === 0) {
      setError('Aggiungi almeno un luogo da visitare');
      return;
    }

    setLoading(true);

    try {
      // Aggiorna la destinazione
      const { error: destError } = await supabase
        .from('adventure_destinations')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          image_url: imageUrl.trim() || null,
          tags: tags.length > 0 ? tags : null,
        })
        .eq('id', destination.id);

      if (destError) {
        throw destError;
      }

      // Ottieni i luoghi esistenti
      const { data: existingPlaces } = await supabase
        .from('adventure_destination_places')
        .select('*')
        .eq('destination_id', destination.id);

      const existingPlaceIds = new Set(existingPlaces?.map(p => p.id) || []);

      // Rimuovi luoghi eliminati
      const placesToKeep = validPlaces.filter(p => p.id);
      const placesToDelete = (existingPlaces || []).filter(
        p => !placesToKeep.some(kp => kp.id === p.id)
      );

      for (const placeToDelete of placesToDelete) {
        await supabase
          .from('adventure_destination_places')
          .delete()
          .eq('id', placeToDelete.id);
      }

      // Aggiorna o crea luoghi
      // Nota: Se la colonna visit_date non esiste, verrà automaticamente rimossa in caso di errore
      const placePromises = validPlaces.map(async (place, i) => {
        // Salva le tappe nella description come stringa separata da newline
        const descriptionWithSteps = place.steps
          .filter(s => s.trim().length > 0)
          .join('\n');
        
        const placeData: any = {
          name: place.name.trim(),
          description: descriptionWithSteps || null,
          order_index: i,
        };

        // Aggiungi visit_date se presente
        // Se la colonna non esiste nel database, verrà gestito nell'errore
        if (place.visit_date && place.visit_date.trim()) {
          placeData.visit_date = place.visit_date;
        }

        if (place.id && existingPlaceIds.has(place.id)) {
          // Aggiorna luogo esistente
          const { error: updateError } = await supabase
            .from('adventure_destination_places')
            .update(placeData)
            .eq('id', place.id);
          
          if (updateError) {
            // Se l'errore è relativo a visit_date, rimuovi il campo e riprova
            if (updateError.message && updateError.message.includes('visit_date')) {
              console.warn(`Colonna visit_date non trovata per luogo ${place.name}. Continuo senza data di visita.`);
              const placeDataWithoutDate = { ...placeData };
              delete placeDataWithoutDate.visit_date;
              const { error: retryError } = await supabase
                .from('adventure_destination_places')
                .update(placeDataWithoutDate)
                .eq('id', place.id);
              if (retryError) {
                console.error(`Errore nell'aggiornamento del luogo ${place.id}:`, retryError);
                throw retryError;
              }
            } else {
              console.error(`Errore nell'aggiornamento del luogo ${place.id}:`, updateError);
              throw updateError;
            }
          }
        } else {
          // Crea nuovo luogo
          const { error: insertError } = await supabase
            .from('adventure_destination_places')
            .insert({
              destination_id: destination.id,
              ...placeData,
            });
          
          if (insertError) {
            // Se l'errore è relativo a visit_date, rimuovi il campo e riprova
            if (insertError.message && insertError.message.includes('visit_date')) {
              console.warn(`Colonna visit_date non trovata per luogo ${place.name}. Continuo senza data di visita.`);
              const placeDataWithoutDate = { ...placeData };
              delete placeDataWithoutDate.visit_date;
              const { error: retryError } = await supabase
                .from('adventure_destination_places')
                .insert({
                  destination_id: destination.id,
                  ...placeDataWithoutDate,
                });
              if (retryError) {
                console.error(`Errore nell'inserimento del nuovo luogo:`, retryError);
                throw retryError;
              }
            } else {
              console.error(`Errore nell'inserimento del nuovo luogo:`, insertError);
              throw insertError;
            }
          }
        }
      });

      // Attendi che tutti i luoghi siano salvati
      await Promise.all(placePromises);

      // Verifica che i luoghi siano stati salvati correttamente
      const { error: verifyError } = await supabase
        .from('adventure_destination_places')
        .select('*')
        .eq('destination_id', destination.id)
        .order('order_index', { ascending: true });
      
      if (verifyError) {
        console.error('Errore nella verifica dei luoghi salvati:', verifyError);
      } else {
      }

      setSuccess(true);
      
      // Forza un piccolo delay per assicurarsi che il database sia completamente aggiornato
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      console.error('Errore nella modifica della destinazione:', err);
      setError(err.message || 'Errore nella modifica della destinazione');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransportClick = (type: DestinationTransport['transport_type']) => {
    setModalInitialType(type);
    setEditingTransport(null);
    setShowTransportModal(true);
  };

  const handleEditTransport = (transport: DestinationTransport) => {
    setEditingTransport(transport);
    setModalInitialType(transport.transport_type);
    setShowTransportModal(true);
  };

  const handleDeleteTransport = async (transportId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo elemento?')) return;

    try {
      const { error } = await supabase
        .from('destination_transport')
        .delete()
        .eq('id', transportId);

      if (error) throw error;

      loadTransports();
    } catch (err: any) {
      console.error('Errore durante l\'eliminazione del trasporto/alloggio:', err);
      setTransportError(err.message || 'Errore durante l\'eliminazione');
    }
  };

  const closeTransportModal = () => {
    setShowTransportModal(false);
    setEditingTransport(null);
  };

  const formatDateTime = (date?: string | null, time?: string | null) => {
    if (!date) return '';
    const formattedDate = new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
    });
    if (time) {
      return `${formattedDate} alle ${time.slice(0, 5)}`;
    }
    return formattedDate;
  };

  const getTransportIcon = (type: string) => {
    const icons: Record<string, string> = {
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
    const labels: Record<string, string> = {
      flight: 'Volo',
      train: 'Treno',
      hotel: 'Alloggio',
      bus: 'Bus',
      car: 'Auto',
      other: 'Altro',
    };
    return labels[type] || 'Altro';
  };

  const getCostTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fixed: 'Fisso',
      estimated: 'Stimato',
      variable: 'Variabile',
    };
    return labels[type] || type;
  };

  const calculateTotalCost = (items: DestinationTransport[]) =>
    items.reduce((sum, transport) => (typeof transport.cost === 'number' ? sum + transport.cost : sum), 0);

  const renderTransportSection = (
    items: DestinationTransport[],
    options: {
      title: string;
      description: string;
      addLabel: string;
      defaultType: DestinationTransport['transport_type'];
      emptyMessage: string;
      icon: string;
    }
  ) => {
    const total = calculateTotalCost(items);

    return (
      <div className="transport-management">
        <div className="transport-management-header">
          <div className="transport-management-title">
            <h3>
              <i className={`fas ${options.icon}`}></i>
              {options.title}
            </h3>
            <p>{options.description}</p>
          </div>
          <button
            type="button"
            className="add-transport-btn"
            onClick={() => handleAddTransportClick(options.defaultType)}
          >
            <i className="fas fa-plus"></i>
            {options.addLabel}
          </button>
        </div>

        {transportError && (
          <div className="alert-message error">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{transportError}</span>
          </div>
        )}

        {transportsLoading ? (
          <div className="transport-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <span>Caricamento in corso...</span>
          </div>
        ) : items.length > 0 ? (
          <>
            {total > 0 && (
              <div className="transport-total">
                <i className="fas fa-coins"></i>
                <div>
                  <span>Totale previsto</span>
                  <strong>€ {total.toFixed(2)}</strong>
                </div>
              </div>
            )}
            <div className="transport-card-grid">
              {items.map((transport) => (
                <div key={transport.id} className="transport-card">
                  <div className="transport-card-header">
                    <div className="transport-card-icon">
                      <i className={`fas ${getTransportIcon(transport.transport_type)}`}></i>
                    </div>
                    <div className="transport-card-info">
                      <span className="transport-type-label">{getTransportLabel(transport.transport_type)}</span>
                      {(transport.departure_date || transport.arrival_date) && (
                        <small>
                          {transport.arrival_date
                            ? `Check-in ${formatDateTime(transport.arrival_date, transport.arrival_time)}`
                            : `Partenza ${formatDateTime(transport.departure_date, transport.departure_time)}`}
                        </small>
                      )}
                    </div>
                    <div className="transport-card-actions">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => handleEditTransport(transport)}
                        title="Modifica"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        type="button"
                        className="icon-button danger"
                        onClick={() => handleDeleteTransport(transport.id)}
                        title="Elimina"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div className="transport-card-body">
                    <div className="transport-card-row">
                      {transport.arrival_date && (
                        <div>
                          <strong>Check-In</strong>
                          <span>{formatDateTime(transport.arrival_date, transport.arrival_time || undefined)}</span>
                        </div>
                      )}
                      {transport.departure_date && (
                        <div>
                          <strong>Check-Out</strong>
                          <span>{formatDateTime(transport.departure_date, transport.departure_time || undefined)}</span>
                        </div>
                      )}
                    </div>
                    {transport.cost !== null && (
                      <div className="transport-card-row">
                        <div>
                          <strong>Costo</strong>
                          <span>
                            € {transport.cost?.toFixed(2)}
                            <span className={`cost-pill ${transport.cost_type}`}>
                              {getCostTypeLabel(transport.cost_type)}
                            </span>
                          </span>
                        </div>
                      </div>
                    )}
                    {transport.info_link && (
                      <div className="transport-card-row">
                        <a href={transport.info_link} target="_blank" rel="noopener noreferrer">
                          <i className="fas fa-external-link-alt"></i>
                          Apri info
                        </a>
                      </div>
                    )}
                    {transport.notes && (
                      <div className="transport-card-row notes">
                        <strong>Note</strong>
                        <p>{transport.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="transport-empty-state">
            <i className="fas fa-route"></i>
            <p>{options.emptyMessage}</p>
          </div>
        )}
      </div>
    );
  };

  const nonHotelTransports = transports.filter(t => t.transport_type !== 'hotel');
  const hotelTransports = transports.filter(t => t.transport_type === 'hotel');

  return (
    <div className="edit-page-fullscreen">
      <div className="edit-page-header">
        <button onClick={onBack} className="back-btn">
          <i className="fas fa-arrow-left"></i>
          Indietro
        </button>
        <h2>
          <i className="fas fa-edit"></i>
          Modifica Destinazione
        </h2>
      </div>

      <div className="edit-page-content">
        <div className="edit-destination-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'viaggio'}
            className={`tab-button ${activeTab === 'viaggio' ? 'active' : ''}`}
            onClick={() => setActiveTab('viaggio')}
          >
            <i className="fas fa-suitcase-rolling"></i>
            Viaggio
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'trasporti'}
            className={`tab-button ${activeTab === 'trasporti' ? 'active' : ''}`}
            onClick={() => setActiveTab('trasporti')}
          >
            <i className="fas fa-route"></i>
            Trasporti
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'alloggi'}
            className={`tab-button ${activeTab === 'alloggi' ? 'active' : ''}`}
            onClick={() => setActiveTab('alloggi')}
          >
            <i className="fas fa-hotel"></i>
            Alloggi
          </button>
        </div>
        {activeTab === 'viaggio' && (
        <form onSubmit={handleSubmit} className="edit-form" role="tabpanel">
          <div className="form-group">
            <label htmlFor="destinationName">
              <i className="fas fa-map"></i> Nome Destinazione *
            </label>
            <input
              type="text"
              id="destinationName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es: Tokyo, Parigi..."
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <div className="form-label-with-ai">
              <label htmlFor="destinationDescription">
                <i className="fas fa-align-left"></i> Descrizione (opzionale)
              </label>
              <button
                type="button"
                className="generate-ai-btn"
                onClick={async () => {
                  // TODO: Implementare integrazione AI
                  alert('Funzionalità AI in arrivo! Genererà automaticamente una descrizione per la destinazione.');
                }}
                disabled={loading || !name.trim()}
                title="Genera descrizione con AI"
              >
                <i className="fas fa-magic"></i>
                <span>Genera con AI</span>
              </button>
            </div>
            <textarea
              id="destinationDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Aggiungi una descrizione della destinazione..."
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="destinationImage">
              <i className="fas fa-image"></i> Immagine (URL) (opzionale)
            </label>
            <div className="url-input-wrapper">
              <input
                type="url"
                id="destinationImage"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/immagine.jpg"
                disabled={loading}
              />
              <button
                type="button"
                className="paste-url-btn"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
                      setImageUrl(text);
                    } else {
                      alert('Il contenuto della clipboard non sembra essere un URL valido');
                    }
                  } catch (err) {
                    console.error('Errore nella lettura della clipboard:', err);
                    alert('Impossibile accedere alla clipboard. Assicurati di avere i permessi necessari.');
                  }
                }}
                disabled={loading}
                title="Incolla URL copiato"
              >
                <i className="fas fa-paste"></i>
              </button>
            </div>
            <p className="form-hint">
              Inserisci l'URL di un'immagine rappresentativa della destinazione oppure clicca sull'icona per incollare un URL copiato.
            </p>
            {imageUrl && (
              <div className="image-preview">
                <img src={imageUrl} alt="Anteprima" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }} />
              </div>
            )}
          </div>

          <div className="form-group">
            <div className="form-label-with-ai">
              <label htmlFor="destinationTags">
                <i className="fas fa-tags"></i> Tag (opzionale)
              </label>
              <button
                type="button"
                className="generate-ai-btn"
                onClick={async () => {
                  // TODO: Implementare integrazione AI
                  alert('Funzionalità AI in arrivo! Genererà automaticamente dei tag pertinenti per la destinazione.');
                }}
                disabled={loading || !name.trim()}
                title="Genera tag con AI"
              >
                <i className="fas fa-magic"></i>
                <span>Genera con AI</span>
              </button>
            </div>
            <div className="tags-input-wrapper">
              <input
                type="text"
                id="destinationTags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Inserisci un tag e premi Invio"
                disabled={loading}
                className="tags-input"
              />
              <button
                type="button"
                className="add-tag-btn"
                onClick={handleAddTag}
                disabled={loading || !tagInput.trim()}
                title="Aggiungi tag"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
            {tags.length > 0 && (
              <div className="tags-display">
                {tags.map((tag, index) => (
                  <span key={index} className="tag-item">
                    {tag}
                    <button
                      type="button"
                      className="remove-tag-btn"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={loading}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="form-hint tags-hint">
              Aggiungi tag per categorizzare la destinazione (es: "Storia", "Cultura", "Gastronomia").
            </p>
          </div>

          <div className="form-group">
            <div className="form-label-with-ai">
              <label>
                <i className="fas fa-map-marker-alt"></i> Luoghi da Visitare *
              </label>
              <button
                type="button"
                className="generate-ai-btn"
                onClick={async () => {
                  // TODO: Implementare integrazione AI
                  alert('Funzionalità AI in arrivo! Genererà automaticamente dei luoghi interessanti da visitare per la destinazione.');
                }}
                disabled={loading || !name.trim()}
                title="Genera luoghi con AI"
              >
                <i className="fas fa-magic"></i>
                <span>Genera con AI</span>
              </button>
            </div>
            <div className="places-list">
              {places.map((place, index) => (
                <div key={index} className="place-item">
                  <div className="place-header">
                    <span className="place-number">Luogo {index + 1}</span>
                    {places.length > 1 && (
                      <button
                        type="button"
                        className="remove-place-btn"
                        onClick={() => handleRemovePlace(index)}
                        disabled={loading}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>

                  <div className="place-when-field">
                    <label>
                      <i className="fas fa-calendar-day"></i>
                      Quando
                    </label>
                    <SingleDatePicker
                      value={place.visit_date}
                      onChange={(date) => handlePlaceChange(index, 'visit_date', date || '')}
                      placeholder="Seleziona data"
                      disabled={loading}
                    />
                  </div>

                  <div className="place-title-field">
                    <label>
                      <i className="fas fa-heading"></i>
                      Titolo *
                    </label>
                    <input
                      type="text"
                      placeholder="Nome del luogo (es: Torre Eiffel, Museo Louvre...)"
                      value={place.name}
                      onChange={(e) => handlePlaceChange(index, 'name', e.target.value)}
                      required={index === 0}
                      disabled={loading}
                    />
                  </div>

                  <div className="place-steps-field">
                    <label>
                      <i className="fas fa-list"></i>
                      Tappe
                    </label>
                    <div className="steps-list">
                      {place.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="step-item">
                          <div className="step-bullet-preview"></div>
                          <input
                            type="text"
                            placeholder={`Tappa ${stepIndex + 1}`}
                            value={step}
                            onChange={(e) => handleStepChange(index, stepIndex, e.target.value)}
                            disabled={loading}
                          />
                          {place.steps.length > 1 && (
                            <button
                              type="button"
                              className="remove-step-btn"
                              onClick={() => handleRemoveStep(index, stepIndex)}
                              disabled={loading}
                              title="Rimuovi tappa"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="add-step-btn"
                      onClick={() => handleAddStep(index)}
                      disabled={loading}
                    >
                      <i className="fas fa-plus"></i>
                      Aggiungi Tappa
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="add-place-btn"
              onClick={handleAddPlace}
              disabled={loading}
            >
              <i className="fas fa-plus"></i>
              Aggiungi Luogo
            </button>
          </div>

          {error && (
            <div className="alert-message error">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert-message success">
              <i className="fas fa-check-circle"></i>
              <span>Modifiche salvate con successo!</span>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onBack} disabled={loading}>
              <i className="fas fa-times"></i>
              Annulla
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || success}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Salvataggio...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Salva Modifiche
                </>
              )}
            </button>
          </div>
        </form>
        )}

        {activeTab === 'trasporti' &&
          renderTransportSection(nonHotelTransports, {
            title: 'Trasporti',
            description: 'Gestisci voli, treni, bus e auto collegati a questa destinazione.',
            addLabel: 'Aggiungi Trasporto',
            defaultType: 'flight',
            emptyMessage: 'Non ci sono trasporti associati a questa destinazione.',
            icon: 'fa-route',
          })}

        {activeTab === 'alloggi' &&
          renderTransportSection(hotelTransports, {
            title: 'Alloggi',
            description: 'Prenotazioni hotel, appartamenti o strutture ricettive collegate.',
            addLabel: 'Aggiungi Alloggio',
            defaultType: 'hotel',
            emptyMessage: 'Non ci sono alloggi per questa destinazione.',
            icon: 'fa-hotel',
          })}
      </div>

      {showTransportModal && (
        <TransportModal
          isOpen={showTransportModal}
          destinationId={destination.id}
          transport={editingTransport}
          onClose={closeTransportModal}
          onSuccess={loadTransports}
          initialTransportType={modalInitialType}
        />
      )}
    </div>
  );
};

export default EditDestinationPage;

