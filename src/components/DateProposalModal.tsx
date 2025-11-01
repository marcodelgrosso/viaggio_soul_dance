import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import BookingDatePicker from './BookingDatePicker';
import '../styles/components/Modal.scss';

interface DateProposalModalProps {
  isOpen: boolean;
  adventureId: string;
  currentDepartureDate?: string | null;
  currentArrivalDate?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DateProposalModal: React.FC<DateProposalModalProps> = ({
  isOpen,
  adventureId,
  currentDepartureDate,
  currentArrivalDate,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [proposedDepartureDate, setProposedDepartureDate] = useState('');
  const [proposedArrivalDate, setProposedArrivalDate] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProposedDepartureDate(currentDepartureDate || '');
      setProposedArrivalDate(currentArrivalDate || '');
      setComment('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen, currentDepartureDate, currentArrivalDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSuccess(false);

    if (!proposedDepartureDate || !proposedArrivalDate) {
      setError('Inserisci sia la data di partenza che quella di arrivo');
      return;
    }

    if (new Date(proposedDepartureDate) >= new Date(proposedArrivalDate)) {
      setError('La data di arrivo deve essere successiva alla data di partenza');
      return;
    }

    setLoading(true);

    try {
      // Upsert: inserisce o aggiorna la proposta esistente
      const { error: upsertError } = await supabase
        .from('adventure_date_proposals')
        .upsert({
          adventure_id: adventureId,
          user_id: user.id,
          proposed_departure_date: proposedDepartureDate,
          proposed_arrival_date: proposedArrivalDate,
          comment: comment.trim() || null,
        }, {
          onConflict: 'adventure_id,user_id'
        });

      if (upsertError) {
        throw upsertError;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Errore nella proposta di date:', err);
      setError(err.message || 'Errore nell\'invio della proposta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal open" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className="fas fa-calendar-check"></i>
            Proponi Date Alternative
          </h2>
          <button className="close-button" onClick={onClose} aria-label="Chiudi">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="date-proposal-form">
          <div className="form-group">
            <BookingDatePicker
              departureDate={proposedDepartureDate || null}
              arrivalDate={proposedArrivalDate || null}
              onDatesChange={(dep, arr) => {
                setProposedDepartureDate(dep || '');
                setProposedArrivalDate(arr || '');
              }}
              minDate={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label htmlFor="comment">
              <i className="fas fa-comment"></i>
              Commento (opzionale)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Spiega perché preferisci queste date..."
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

          {success && (
            <div className="alert-message success" role="alert">
              <i className="fas fa-check-circle"></i>
              <span>Proposta inviata con successo!</span>
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
              disabled={loading || !proposedDepartureDate || !proposedArrivalDate}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Invio...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Invia Proposta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DateProposalModal;

