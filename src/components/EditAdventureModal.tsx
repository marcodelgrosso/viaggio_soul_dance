import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Adventure } from '../types/adventures';
import '../styles/components/Modal.scss';

interface EditAdventureModalProps {
  isOpen: boolean;
  adventure: Adventure | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditAdventureModal: React.FC<EditAdventureModalProps> = ({
  isOpen,
  adventure,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (adventure && isOpen) {
      setName(adventure.name);
      setDescription(adventure.description || '');
      setError('');
    }
  }, [adventure, isOpen]);

  if (!isOpen || !adventure) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Il nome dell\'avventura è obbligatorio');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('adventures')
        .update({
          name: name.trim(),
          description: description.trim() || null,
        })
        .eq('id', adventure.id);

      if (updateError) {
        throw updateError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Errore nella modifica dell\'avventura:', err);
      setError(err.message || 'Errore nella modifica dell\'avventura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal open" onClick={onClose}>
      <div className="modal-content add-participant-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Chiudi">
          <i className="fas fa-times"></i>
        </button>

        <div className="modal-header">
          <h2>
            <i className="fas fa-edit"></i>
            Modifica Avventura
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="add-participant-form">
          <div className="form-group">
            <label htmlFor="adventureName">
              <i className="fas fa-map-marked-alt"></i>
              Nome Avventura
              <span className="required">*</span>
            </label>
            <input
              type="text"
              id="adventureName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es: Viaggio in Giappone"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="adventureDescription">
              <i className="fas fa-align-left"></i>
              Descrizione
            </label>
            <textarea
              id="adventureDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Aggiungi una descrizione dell'avventura..."
              rows={4}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="alert-message error" role="alert">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
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

export default EditAdventureModal;

