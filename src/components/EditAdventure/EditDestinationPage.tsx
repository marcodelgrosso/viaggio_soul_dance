import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AdventureDestinationWithPlaces } from '../../types/adventures';
import SingleDatePicker from '../SingleDatePicker';
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
        <form onSubmit={handleSubmit} className="edit-form">
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
      </div>
    </div>
  );
};

export default EditDestinationPage;

