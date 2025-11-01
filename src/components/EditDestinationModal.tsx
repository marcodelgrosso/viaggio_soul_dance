import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AdventureDestinationWithPlaces } from '../types/adventures';
import '../styles/components/Modal.scss';

interface EditDestinationModalProps {
  isOpen: boolean;
  destination: AdventureDestinationWithPlaces | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface Place {
  id?: string;
  name: string;
  description: string;
}

const EditDestinationModal: React.FC<EditDestinationModalProps> = ({
  isOpen,
  destination,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (destination && isOpen) {
      setName(destination.name);
      setDescription(destination.description || '');
      setPlaces(
        destination.places.length > 0
          ? destination.places.map(p => ({ id: p.id, name: p.name, description: p.description || '' }))
          : [{ name: '', description: '' }]
      );
      setError('');
    }
  }, [destination, isOpen]);

  if (!isOpen || !destination) return null;

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

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Errore nella modifica della destinazione:', err);
      setError(err.message || 'Errore nella modifica della destinazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal open" onClick={onClose}>
      <div className="modal-content create-adventure-modal" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>

        <h2>
          <i className="fas fa-edit"></i>
          Modifica Destinazione
        </h2>

        <form onSubmit={handleSubmit}>
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
              rows={3}
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

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
              Annulla
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
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

export default EditDestinationModal;

