import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { AdventureParticipant } from '../../types/adventures';
import { getUserDisplayName } from '../../lib/userUtils';
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

      // Recupera i dati dell'avventura per la notifica
      const { data: adventureData, error: adventureError } = await supabase
        .from('adventures')
        .select('name')
        .eq('id', adventureId)
        .single();

      if (adventureError || !adventureData) {
        throw new Error('Errore nel recupero dei dati dell\'avventura');
      }

      // Recupera il nome del creator per la notifica
      const creatorDisplayName = await getUserDisplayName(user.id);

      // Aggiungi il partecipante con status "pending"
      const { error: insertError } = await supabase
        .from('adventure_participants')
        .insert({
          adventure_id: adventureId,
          user_id: userId,
          added_by: user.id,
          invitation_status: 'pending',
        });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('Questo utente è già un partecipante di questa avventura');
        }
        throw insertError;
      }

      // Crea la notifica di invito usando la funzione RPC
      const notificationMessage = `${creatorDisplayName} ti ha invitato a partecipare all'avventura "${adventureData.name}".`;
      
      const { data: notificationId, error: notificationError } = await supabase.rpc(
        'create_user_notification',
        {
          p_user_id: userId,
          p_type: 'adventure_invitation',
          p_title: 'Invito all\'avventura',
          p_message: notificationMessage,
          p_link: `/adventure/${adventureId}`,
          p_metadata: {
            adventure_id: adventureId,
            participant_id: userId,
            inviter_id: user.id,
          },
        }
      );

      if (notificationError) {
        console.error('Errore nella creazione della notifica:', notificationError);
        // Non blocchiamo il flusso se la notifica non viene creata
      } else {
        console.log('Notifica creata con successo:', notificationId);
      }

      setSuccess(true);
      setEmail('');
      
      // Mostra messaggio di successo
      setTimeout(() => {
        onSuccess();
      }, 1500);
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
              <span>Invito inviato con successo! L'utente riceverà una notifica per accettare o rifiutare l'invito.</span>
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

