import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import '../styles/components/Modal.scss';

interface CreateAdventureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DestinationPlace {
  name: string;
  description: string;
}

interface Destination {
  name: string;
  description: string;
  places: DestinationPlace[];
}

const CreateAdventureModal: React.FC<CreateAdventureModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [adventureName, setAdventureName] = useState('');
  const [adventureDescription, setAdventureDescription] = useState('');
  const [destinations, setDestinations] = useState<Destination[]>([
    { name: '', description: '', places: [{ name: '', description: '' }] }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddDestination = () => {
    setDestinations([...destinations, { name: '', description: '', places: [{ name: '', description: '' }] }]);
  };

  const handleRemoveDestination = (index: number) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter((_, i) => i !== index));
    }
  };

  const handleDestinationChange = (index: number, field: 'name' | 'description', value: string) => {
    const updated = [...destinations];
    updated[index] = { ...updated[index], [field]: value };
    setDestinations(updated);
  };

  const handleAddPlace = (destinationIndex: number) => {
    const updated = [...destinations];
    updated[destinationIndex].places.push({ name: '', description: '' });
    setDestinations(updated);
  };

  const handleRemovePlace = (destinationIndex: number, placeIndex: number) => {
    const updated = [...destinations];
    if (updated[destinationIndex].places.length > 1) {
      updated[destinationIndex].places = updated[destinationIndex].places.filter((_, i) => i !== placeIndex);
      setDestinations(updated);
    }
  };

  const handlePlaceChange = (destinationIndex: number, placeIndex: number, field: 'name' | 'description', value: string) => {
    const updated = [...destinations];
    updated[destinationIndex].places[placeIndex] = {
      ...updated[destinationIndex].places[placeIndex],
      [field]: value
    };
    setDestinations(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!adventureName.trim()) {
      setError('Il nome dell\'avventura è obbligatorio');
      return;
    }

    // Valida destinazioni
    const validDestinations = destinations.filter(d => d.name.trim());
    if (validDestinations.length === 0) {
      setError('Aggiungi almeno una destinazione proposta');
      return;
    }

    // Valida che ogni destinazione abbia almeno un luogo
    for (const dest of validDestinations) {
      const validPlaces = dest.places.filter(p => p.name.trim());
      if (validPlaces.length === 0) {
        setError(`La destinazione "${dest.name || 'senza nome'}" deve avere almeno un luogo da visitare`);
        return;
      }
    }

    if (!user) {
      setError('Utente non autenticato');
      return;
    }

    setLoading(true);

    try {
      // Crea l'avventura
      const { data: adventure, error: adventureError } = await supabase
        .from('adventures')
        .insert({
          name: adventureName.trim(),
          description: adventureDescription.trim() || null,
          created_by: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (adventureError) {
        throw adventureError;
      }

      // Crea le destinazioni e i loro luoghi
      for (let destIndex = 0; destIndex < validDestinations.length; destIndex++) {
        const dest = validDestinations[destIndex];
        const validPlaces = dest.places.filter(p => p.name.trim());

        // Crea la destinazione
        const { data: destination, error: destError } = await supabase
          .from('adventure_destinations')
          .insert({
            adventure_id: adventure.id,
            name: dest.name.trim(),
            description: dest.description.trim() || null,
            order_index: destIndex,
          })
          .select()
          .single();

        if (destError) {
          throw destError;
        }

        // Crea i luoghi della destinazione
        if (destination && validPlaces.length > 0) {
          const placesToInsert = validPlaces.map((place, placeIndex) => ({
            destination_id: destination.id,
            name: place.name.trim(),
            description: place.description.trim() || null,
            order_index: placeIndex,
          }));

          const { error: placesError } = await supabase
            .from('adventure_destination_places')
            .insert(placesToInsert);

          if (placesError) {
            throw placesError;
          }
        }
      }

      // Aggiungi il creator alla tabella adventure_creators
      const { error: creatorError } = await supabase
        .from('adventure_creators')
        .insert({
          adventure_id: adventure.id,
          user_id: user.id,
        });

      if (creatorError) {
        console.warn('Errore nell\'aggiunta del creator:', creatorError);
      }

      // Aggiungi il creator come partecipante di default
      const { error: participantError } = await supabase
        .from('adventure_participants')
        .insert({
          adventure_id: adventure.id,
          user_id: user.id,
        });

      if (participantError) {
        console.warn('Errore nell\'aggiunta del creator come partecipante:', participantError);
      }

      // Reset form
      setAdventureName('');
      setAdventureDescription('');
      setDestinations([{ name: '', description: '', places: [{ name: '', description: '' }] }]);
      setError('');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Errore nella creazione dell\'avventura:', err);
      setError(err.message || 'Errore nella creazione dell\'avventura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal open" onClick={onClose}>
      <div className="modal-content create-adventure-modal" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        
        <h2>
          <i className="fas fa-plus-circle"></i>
          Crea Nuova Avventura
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="adventureName">
              <i className="fas fa-map-marked-alt"></i> Nome Avventura *
            </label>
            <input
              type="text"
              id="adventureName"
              value={adventureName}
              onChange={(e) => setAdventureName(e.target.value)}
              placeholder="Es: Viaggio in Giappone"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="adventureDescription">
              <i className="fas fa-align-left"></i> Descrizione (opzionale)
            </label>
            <textarea
              id="adventureDescription"
              value={adventureDescription}
              onChange={(e) => setAdventureDescription(e.target.value)}
              placeholder="Aggiungi una descrizione dell'avventura..."
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-map"></i> Destinazioni Proposte *
            </label>
            <div className="destinations-list">
              {destinations.map((destination, destIndex) => (
                <div key={destIndex} className="destination-item">
                  <div className="destination-header">
                    <span className="destination-number">Destinazione {destIndex + 1}</span>
                    {destinations.length > 1 && (
                      <button
                        type="button"
                        className="remove-destination-btn"
                        onClick={() => handleRemoveDestination(destIndex)}
                        disabled={loading}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Nome destinazione (es: Tokyo, Parigi...)"
                    value={destination.name}
                    onChange={(e) => handleDestinationChange(destIndex, 'name', e.target.value)}
                    required={destIndex === 0}
                    disabled={loading}
                    className="destination-name-input"
                  />
                  <textarea
                    placeholder="Descrizione destinazione (opzionale)"
                    value={destination.description}
                    onChange={(e) => handleDestinationChange(destIndex, 'description', e.target.value)}
                    rows={2}
                    disabled={loading}
                    className="destination-description-input"
                  />

                  <div className="places-in-destination">
                    <label className="places-label">
                      <i className="fas fa-map-marker-alt"></i> Luoghi da Visitare in questa destinazione *
                    </label>
                    <div className="places-list">
                      {destination.places.map((place, placeIndex) => (
                        <div key={placeIndex} className="place-item">
                          <div className="place-header">
                            <span className="place-number">Luogo {placeIndex + 1}</span>
                            {destination.places.length > 1 && (
                              <button
                                type="button"
                                className="remove-place-btn"
                                onClick={() => handleRemovePlace(destIndex, placeIndex)}
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
                            onChange={(e) => handlePlaceChange(destIndex, placeIndex, 'name', e.target.value)}
                            required={placeIndex === 0 && destIndex === 0}
                            disabled={loading}
                          />
                          <textarea
                            placeholder="Descrizione (opzionale)"
                            value={place.description}
                            onChange={(e) => handlePlaceChange(destIndex, placeIndex, 'description', e.target.value)}
                            rows={2}
                            disabled={loading}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="add-place-btn"
                      onClick={() => handleAddPlace(destIndex)}
                      disabled={loading}
                    >
                      <i className="fas fa-plus"></i>
                      Aggiungi Luogo
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="add-destination-btn"
              onClick={handleAddDestination}
              disabled={loading}
            >
              <i className="fas fa-plus"></i>
              Aggiungi Destinazione
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
                  Creazione...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>
                  Crea Avventura
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAdventureModal;
