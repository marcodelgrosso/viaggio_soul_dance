import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import '../../styles/components/EditAdventureSection.scss';

interface AddDestinationPageProps {
  adventureId: string;
  existingDestinationsCount: number;
  onBack: () => void;
  onSuccess: () => void;
}

interface Place {
  name: string;
  description: string;
}

const AddDestinationPage: React.FC<AddDestinationPageProps> = ({
  adventureId,
  existingDestinationsCount,
  onBack,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [places, setPlaces] = useState<Place[]>([{ name: '', description: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      // Crea la destinazione
      const { data: destination, error: destError } = await supabase
        .from('adventure_destinations')
        .insert({
          adventure_id: adventureId,
          name: name.trim(),
          description: description.trim() || null,
          order_index: existingDestinationsCount,
        })
        .select()
        .single();

      if (destError) {
        throw destError;
      }

      // Crea i luoghi
      if (destination && validPlaces.length > 0) {
        const placesToInsert = validPlaces.map((place, index) => ({
          destination_id: destination.id,
          name: place.name.trim(),
          description: place.description.trim() || null,
          order_index: index,
        }));

        const { error: placesError } = await supabase
          .from('adventure_destination_places')
          .insert(placesToInsert);

        if (placesError) {
          throw placesError;
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (err: any) {
      console.error('Errore nella creazione della destinazione:', err);
      setError(err.message || 'Errore nella creazione della destinazione');
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
          <i className="fas fa-plus-circle"></i>
          Aggiungi Destinazione
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
              <span>Destinazione creata con successo!</span>
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
                  Creazione...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>
                  Crea Destinazione
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDestinationPage;

