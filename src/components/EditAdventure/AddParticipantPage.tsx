import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { AdventureParticipant } from '../../types/adventures';
import '../../styles/components/EditAdventureSection.scss';

interface AddParticipantPageProps {
  adventureId: string;
  currentParticipants: AdventureParticipant[];
  onBack: () => void;
  onSuccess: () => void;
}

const AddParticipantPage: React.FC<AddParticipantPageProps> = ({
  adventureId,
  currentParticipants,
  onBack,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('Inserisci un\'email valida');
      return;
    }

    // Verifica formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Inserisci un\'email valida');
      return;
    }

    if (!user) {
      setError('Utente non autenticato');
      return;
    }

    setLoading(true);

    try {
      // Verifica se l'utente è già un partecipante
      const participantEmails = currentParticipants.map(p => p.user_email?.toLowerCase());
      if (participantEmails.includes(email.trim().toLowerCase())) {
        setError('Questo utente è già un partecipante di questa avventura');
        setLoading(false);
        return;
      }

      // Ottieni l'ID utente dall'email usando una funzione RPC
      const { data: userIdData, error: userIdError } = await supabase.rpc(
        'get_user_id_by_email',
        { user_email: email.trim().toLowerCase() }
      );

      if (userIdError) {
        throw new Error('Impossibile trovare l\'utente. Verifica che l\'email sia corretta.');
      }

      const userId = userIdData;

      if (!userId) {
        throw new Error('Email non trovata. Verifica che l\'email sia corretta.');
      }

      // Aggiungi il partecipante
      const { error: insertError } = await supabase
        .from('adventure_participants')
        .insert({
          adventure_id: adventureId,
          user_id: userId,
          added_by: user.id,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('Questo utente è già un partecipante di questa avventura');
        }
        throw insertError;
      }

      setSuccess(true);
      setEmail('');
      
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      console.error('Errore nell\'aggiunta del partecipante:', err);
      setError(err.message || 'Errore nell\'aggiunta del partecipante');
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
          <i className="fas fa-user-plus"></i>
          Aggiungi Partecipante
        </h2>
      </div>

      <div className="edit-page-content">
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label htmlFor="participantEmail">
              <i className="fas fa-envelope"></i>
              Email Utente
              <span className="required">*</span>
            </label>
            <input
              type="email"
              id="participantEmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="esempio@email.com"
              required
              disabled={loading}
              autoFocus
              className={error ? 'input-error' : ''}
            />
            <p className="form-hint">
              Inserisci l'email dell'utente che vuoi aggiungere come partecipante all'avventura.
            </p>
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
              <span>Partecipante aggiunto con successo!</span>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onBack} 
              disabled={loading}
            >
              <i className="fas fa-times"></i>
              Annulla
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || success || !email.trim()}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Aggiunta...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  Aggiungi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddParticipantPage;

