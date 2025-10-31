import React, { useState } from 'react';
import { destinations } from '../types/destinations';
import { submitVoteToSupabase, VoteData } from '../config/supabase.config';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import '../styles/components/Modal.scss';

interface VotingModalProps {
  destinationId: string;
  onClose: () => void;
}

const VotingModal: React.FC<VotingModalProps> = ({ destinationId, onClose }) => {
  const { user: authenticatedUser, email } = useAuth();
  const [selectedVote, setSelectedVote] = useState<'yes' | 'no' | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destination = destinations[destinationId];

  const handleVote = (voteType: 'yes' | 'no') => {
    setSelectedVote(voteType);
  };

  const handleSubmit = async () => {
    setError('');

    if (!selectedVote) {
      setError('Per favore, seleziona prima la tua preferenza (Sì o No)');
      return;
    }

    if (!authenticatedUser) {
      setError('Errore: sessione non valida. Ricarica la pagina.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!authenticatedUser) {
        setError('Errore: sessione non valida. Ricarica la pagina.');
        setIsSubmitting(false);
        return;
      }

      const voteData: VoteData = {
        destination: destinationId,
        vote: selectedVote,
        comment: comment.trim() || undefined,
        userId: authenticatedUser.id,
        userEmail: authenticatedUser.email || '',
        timestamp: new Date().toISOString(),
      };

      await submitVoteToSupabase(voteData, supabase);
      
      // Mostra conferma
      setTimeout(() => {
        onClose();
        // Ricarica la pagina per aggiornare i badge
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'invio della votazione. Riprova.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal" style={{ display: 'block' }} onClick={onClose}>
      <div className="modal-content voting-modal" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <div className="voting-content">
          <h3>Vota questa destinazione</h3>
          <p className="voting-destination-name">{destination?.name}</p>
          <p className="voting-user-info">
            <i className="fas fa-user-circle"></i>
            Connesso come: <strong>{email}</strong>
          </p>

          {error && <p className="auth-error">{error}</p>}

          <div className="voting-buttons">
            <button
              className={`vote-btn vote-yes ${selectedVote === 'yes' ? 'selected' : ''}`}
              onClick={() => handleVote('yes')}
              disabled={isSubmitting}
            >
              <i className="fas fa-thumbs-up"></i>
              Sì, mi piace!
            </button>
            <button
              className={`vote-btn vote-no ${selectedVote === 'no' ? 'selected' : ''}`}
              onClick={() => handleVote('no')}
              disabled={isSubmitting}
            >
              <i className="fas fa-thumbs-down"></i>
              No, non mi convince
            </button>
          </div>

          <div className="comment-section">
            <h4>Lascia un commento</h4>
            <textarea
              id="commentText"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Condividi la tua opinione su questa destinazione..."
              disabled={isSubmitting}
            />
          </div>

          <button
            className="submit-vote-btn"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedVote}
          >
            <i className="fas fa-paper-plane"></i>
            {isSubmitting ? 'Invio in corso...' : 'Invia votazione'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VotingModal;

