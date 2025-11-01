import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Adventure } from '../../types/adventures';
import '../../styles/components/EditAdventureSection.scss';

interface AdventureInformationSectionProps {
  adventure: Adventure;
  onSuccess: () => void;
}

const AdventureInformationSection: React.FC<AdventureInformationSectionProps> = ({
  adventure,
  onSuccess,
}) => {
  const [name, setName] = useState(adventure.name);
  const [description, setDescription] = useState(adventure.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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

      setSuccess('Modifiche salvate con successo!');
      setTimeout(() => {
        setSuccess('');
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('Errore nella modifica dell\'avventura:', err);
      setError(err.message || 'Errore nella modifica dell\'avventura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-section">
      <div className="section-header">
        <h2>
          <i className="fas fa-info-circle"></i>
          Informazioni Avventura
        </h2>
        <p>Modifica nome e descrizione dell'avventura</p>
      </div>

      <form onSubmit={handleSubmit} className="edit-form">
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
            rows={6}
            disabled={loading}
          />
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
            <span>{success}</span>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
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
  );
};

export default AdventureInformationSection;

