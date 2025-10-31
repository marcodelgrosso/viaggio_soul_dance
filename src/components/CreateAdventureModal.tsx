import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import '../styles/components/Modal.scss';

interface CreateAdventureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Place {
  name: string;
  description: string;
}

const CreateAdventureModal: React.FC<CreateAdventureModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [adventureName, setAdventureName] = useState('');
  const [adventureDescription, setAdventureDescription] = useState('');
  const [places, setPlaces] = useState<Place[]>([{ name: '', description: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddPlace = () => {
    setPlaces([...places, { name: '', description: '' }]);
  };

  const handleRemovePlace = (index: number) => {
    if (places.length > 1) {
      setPlaces(places.filter((_, i) => i !== index));
    }
  };

  const handlePlaceChange = (index: number, field: 'name' | 'description', value: string) => {
    const updatedPlaces = [...places];
    updatedPlaces[index] = { ...updatedPlaces[index], [field]: value };
    setPlaces(updatedPlaces);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!adventureName.trim()) {
      setError('Il nome dell\'avventura è obbligatorio');
      return;
    }

    // Rimuovi luoghi vuoti
    const validPlaces = places.filter(p => p.name.trim());

    if (validPlaces.length === 0) {
      setError('Aggiungi almeno un luogo da visitare');
      return;
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

      // Crea i luoghi
      if (validPlaces.length > 0 && adventure) {
        const placesToInsert = validPlaces.map((place, index) => ({
          adventure_id: adventure.id,
          name: place.name.trim(),
          description: place.description.trim() || null,
          order_index: index,
        }));

        const { error: placesError } = await supabase
          .from('adventure_places')
          .insert(placesToInsert);

        if (placesError) {
          throw placesError;
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
          // Non blocchiamo se questo fallisce, l'avventura è già creata
        }
      }

      // Reset form
      setAdventureName('');
      setAdventureDescription('');
      setPlaces([{ name: '', description: '' }]);
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                    placeholder="Nome del luogo (es: Tokyo, Monte Fuji...)"
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

