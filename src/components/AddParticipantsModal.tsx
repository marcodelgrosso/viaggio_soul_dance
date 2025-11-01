import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { AdventureParticipant } from '../types/adventures';
import { getUserDisplayName } from '../lib/userUtils';
import '../styles/components/Modal.scss';

interface AddParticipantsModalProps {
  isOpen: boolean;
  adventureId: string;
  currentParticipants: AdventureParticipant[];
  onClose: () => void;
  onSuccess: () => void;
}

const AddParticipantsModal: React.FC<AddParticipantsModalProps> = ({
  isOpen,
  adventureId,
  currentParticipants,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset form quando il modal si apre
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
      // Prima, cerchiamo l'utente per email nella tabella auth.users
      // Usiamo una funzione RPC o facciamo una query per ottenere l'ID utente
      // Per ora, proviamo a inserire direttamente - Supabase gestirà l'errore se l'utente non esiste
      
      // In alternativa, possiamo creare una funzione RPC che ci restituisce l'ID utente dall'email
      // Per semplicità, proviamo a ottenere l'utente tramite una query alla tabella user_permissions o user_roles
      // dove abbiamo memorizzato le email
      
      // Soluzione migliore: creare una vista o funzione che ci restituisce gli utenti con le loro email
      // Per ora, usiamo un approccio più semplice: l'utente deve già esistere nel sistema
      // e lo aggiungiamo tramite una funzione RPC custom

      // Tentativo: ottenere l'ID utente tramite una query
      // Poiché non possiamo accedere direttamente a auth.users, usiamo una strategia diversa
      // Inseriamo il partecipante e se fallisce, mostriamo l'errore

      // Per ora, assumiamo che dobbiamo prima ottenere l'ID utente dall'email
      // Creiamo una funzione RPC per questo scopo o usiamo una query alla tabella users se esiste

      // Soluzione temporanea: chiediamo all'utente di inserire l'email e creiamo una funzione nel backend
      // che ci restituisce l'ID utente. Ma per ora, proviamo un approccio più semplice.
      
      // Nota: potremmo dover creare una funzione SQL custom per ottenere l'ID utente dall'email
      // Per ora, mostriamo un messaggio che l'utente deve già essere registrato

      // Verifica se l'utente è già un partecipante
      const participantEmails = currentParticipants.map(p => p.user_email?.toLowerCase());
      if (participantEmails.includes(email.trim().toLowerCase())) {
        setError('Questo utente è già un partecipante di questa avventura');
        setLoading(false);
        return;
      }

      // Ottieni l'ID utente dall'email usando una funzione RPC
      // Per ora, creiamo una funzione SQL che faccia questo
      // Chiamata a una funzione RPC che restituisce l'user_id dall'email
      const { data: userIdData, error: userIdError } = await supabase.rpc(
        'get_user_id_by_email',
        { user_email: email.trim().toLowerCase() }
      );

      if (userIdError) {
        // Se la funzione non esiste o l'utente non è trovato
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
        if (insertError.code === '23505') { // Unique constraint violation
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

      setSuccess('Invito inviato con successo! L\'utente riceverà una notifica per accettare o rifiutare l\'invito.');
      setEmail('');
      
      // Attendi un momento prima di chiudere e ricaricare
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Errore nell\'aggiunta del partecipante:', err);
      setError(err.message || 'Errore nell\'aggiunta del partecipante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal open" onClick={onClose}>
      <div className="modal-content add-participant-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className="fas fa-user-plus"></i>
            Aggiungi Partecipante
          </h2>
          <button className="close-button" onClick={onClose} aria-label="Chiudi">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-participant-form">
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
              <span>{success}</span>
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
              disabled={loading || !email.trim()}
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

export default AddParticipantsModal;

