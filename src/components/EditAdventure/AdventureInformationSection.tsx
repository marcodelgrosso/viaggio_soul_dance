import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Adventure } from '../../types/adventures';
import BookingDatePicker from '../BookingDatePicker';
import Tooltip from '../Tooltip';
import { useToast } from '../../hooks/useToast';
import { useAutoSave } from '../../hooks/useAutoSave';
import '../../styles/components/EditAdventureSection.scss';

interface AdventureInformationSectionProps {
  adventure: Adventure;
  onSuccess: () => void;
}

const AdventureInformationSection: React.FC<AdventureInformationSectionProps> = ({
  adventure,
  onSuccess: _onSuccess,
}) => {
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState(adventure.name);
  const [description, setDescription] = useState(adventure.description || '');
  const [departureDate, setDepartureDate] = useState(adventure.departure_date || '');
  const [arrivalDate, setArrivalDate] = useState(adventure.arrival_date || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Salvataggio automatico bozza (solo descrizione e date, non nome)
  const autoSaveData = {
    description,
    departure_date: departureDate,
    arrival_date: arrivalDate,
  };

  useAutoSave({
    data: autoSaveData,
    enabled: true,
    debounceDelay: 3000,
    onSave: async (data) => {
      setAutoSaveStatus('saving');
      const { error: updateError } = await supabase
        .from('adventures')
        .update({
          description: data.description || null,
          departure_date: data.departure_date || null,
          arrival_date: data.arrival_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adventure.id);

      if (updateError) {
        throw updateError;
      }
    },
    onSaveComplete: () => {
      setAutoSaveStatus('saved');
      // Nascondi il messaggio dopo 3 secondi
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 3000);
    },
    onSaveError: () => {
      setAutoSaveStatus('error');
    },
  });

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (!name.trim()) {
      setError('Il nome dell\'avventura è obbligatorio');
      return;
    }

    // Validazione date
    if (departureDate && arrivalDate && new Date(departureDate) >= new Date(arrivalDate)) {
      setError('La data di arrivo deve essere successiva alla data di partenza');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('adventures')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          departure_date: departureDate || null,
          arrival_date: arrivalDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adventure.id);

      if (updateError) {
        throw updateError;
      }

      showSuccess('Modifiche salvate con successo!');
      setError('');
    } catch (err: any) {
      console.error('Errore nella modifica dell\'avventura:', err);
      const errorMessage = err.message || 'Errore nella modifica dell\'avventura';
      setError(errorMessage);
      showError(errorMessage);
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
        <div className="section-header-content">
          <p>Modifica nome e descrizione dell'avventura</p>
          {autoSaveStatus !== 'idle' && (
            <div className={`auto-save-status auto-save-${autoSaveStatus}`}>
              {autoSaveStatus === 'saving' && (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Salvataggio automatico...</span>
                </>
              )}
              {autoSaveStatus === 'saved' && (
                <>
                  <i className="fas fa-check-circle"></i>
                  <span>Bozza salvata automaticamente</span>
                </>
              )}
              {autoSaveStatus === 'error' && (
                <>
                  <i className="fas fa-exclamation-circle"></i>
                  <span>Errore nel salvataggio automatico</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-group">
          <label htmlFor="adventureName">
            <i className="fas fa-map-marked-alt"></i>
            Nome Avventura
            <span className="required">*</span>
          </label>
          <Tooltip content="Nome identificativo dell'avventura (obbligatorio)">
            <input
              type="text"
              id="adventureName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es: Viaggio in Giappone"
              required
              disabled={loading}
              aria-label="Nome avventura"
              aria-required="true"
            />
          </Tooltip>
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

        <div className="form-group">
          <label>
            <i className="fas fa-calendar-alt"></i>
            Date dell'Avventura
          </label>
          <BookingDatePicker
            departureDate={departureDate || null}
            arrivalDate={arrivalDate || null}
            onDatesChange={(dep, arr) => {
              setDepartureDate(dep || '');
              setArrivalDate(arr || '');
            }}
            minDate={new Date().toISOString().split('T')[0]}
          />
          <span className="form-hint">
            Seleziona le date di partenza e ritorno dell'avventura.
          </span>
        </div>

        {error && (
          <div className="alert-message error">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}

        <div className="form-actions">
          <Tooltip content="Salva le modifiche (Ctrl+S)">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              aria-label="Salva modifiche"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Applicazione modifiche...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Salva Modifiche
                </>
              )}
            </button>
          </Tooltip>
        </div>
      </form>
    </div>
  );
};

export default AdventureInformationSection;

