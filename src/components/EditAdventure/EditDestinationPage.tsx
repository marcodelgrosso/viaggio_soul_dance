import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AdventureDestinationWithPlaces } from '../../types/adventures';
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
      setTags(destination.tags || []);
      setPlaces(
        destination.places.length > 0
          ? destination.places.map(p => ({ id: p.id, name: p.name, description: p.description || '' }))
          : [{ name: '', description: '' }]
      );
    }
  }, [destination]);

  const handleAddPlace = () => {
    setPlaces([...places, { name: '', description: '' }]);
  };

  const handleRemovePlace = (index: number) => {
    if (places.length > 1) {
      setPlaces(places.filter((_, i) => i !== index));
    }
  };

  const handlePlaceChange = (index: number, field: 'name' | 'description', value: string) => {
    const updated = [...places];
    updated[index] = { ...updated[index], [field]: value };
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
      for (let i = 0; i < validPlaces.length; i++) {
        const place = validPlaces[i];
        if (place.id && existingPlaceIds.has(place.id)) {
          // Aggiorna luogo esistente
          await supabase
            .from('adventure_destination_places')
            .update({
              name: place.name.trim(),
              description: place.description.trim() || null,
              order_index: i,
            })
            .eq('id', place.id);
        } else {
          // Crea nuovo luogo
          await supabase
            .from('adventure_destination_places')
            .insert({
              destination_id: destination.id,
              name: place.name.trim(),
              description: place.description.trim() || null,
              order_index: i,
            });
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 500);
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
            <label htmlFor="destinationDescription">
              <i className="fas fa-align-left"></i> Descrizione (opzionale)
            </label>
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
            <input
              type="url"
              id="destinationImage"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/immagine.jpg"
              disabled={loading}
            />
            <p className="form-hint">
              Inserisci l'URL di un'immagine rappresentativa della destinazione.
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
            <label htmlFor="destinationTags">
              <i className="fas fa-tags"></i> Tag (opzionale)
            </label>
            <div className="tags-input-container">
              <input
                type="text"
                id="destinationTags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Inserisci un tag e premi Invio"
                disabled={loading}
              />
              <button
                type="button"
                className="add-tag-btn"
                onClick={handleAddTag}
                disabled={loading || !tagInput.trim()}
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
            <p className="form-hint">
              Aggiungi tag per categorizzare la destinazione (es: "Storia", "Cultura", "Gastronomia").
            </p>
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-map-marker-alt"></i> Luoghi da Visitare *
            </label>
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
                  <input
                    type="text"
                    placeholder="Nome del luogo (es: Torre Eiffel, Museo Louvre...)"
                    value={place.name}
                    onChange={(e) => handlePlaceChange(index, 'name', e.target.value)}
                    required={index === 0}
                    disabled={loading}
                  />
                  <textarea
                    placeholder="Descrizione (opzionale)"
                    value={place.description}
                    onChange={(e) => handlePlaceChange(index, 'description', e.target.value)}
                    rows={2}
                    disabled={loading}
                  />
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

