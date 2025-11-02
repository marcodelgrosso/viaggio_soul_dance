import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Adventure } from '../types/adventures';
import '../styles/components/UserProfilePage.scss';

interface UserProfilePageProps {
  onBack: () => void;
  onViewAdventure?: (adventureId: string) => void;
}

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
}

interface UserAdventure {
  adventure: Adventure;
  invitation_status: 'pending' | 'accepted' | 'declined' | null;
  participant_id: string;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ onBack, onViewAdventure }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userAdventures, setUserAdventures] = useState<UserAdventure[]>([]);
  const [loadingAdventures, setLoadingAdventures] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadUserAdventures();
      
      // Ascolta gli eventi di cambiamento dello status dell'invito
      const handleStatusChange = () => {
        loadUserAdventures();
      };
      
      window.addEventListener('adventureStatusChanged', handleStatusChange);
      
      return () => {
        window.removeEventListener('adventureStatusChanged', handleStatusChange);
      };
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // Cerca il profilo esistente
      const { data: profileData, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, che è ok se il profilo non esiste ancora
        throw fetchError;
      }

      if (profileData) {
        setProfile(profileData);
        setFirstName(profileData.first_name || '');
        setLastName(profileData.last_name || '');
      } else {
        // Profilo non esiste ancora
        setFirstName('');
        setLastName('');
      }
    } catch (err: any) {
      console.error('Errore nel caricamento del profilo:', err);
      setError('Errore nel caricamento del profilo. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserAdventures = async () => {
    if (!user) return;

    try {
      setLoadingAdventures(true);


      // Carica le partecipazioni dell'utente
      // Prova prima una query semplice per vedere tutte le partecipazioni
      const { data: allParticipants, error: allError } = await supabase
        .from('adventure_participants')
        .select('id, adventure_id, invitation_status, user_id')
        .eq('user_id', user.id);

      if (allError) {
        console.error('Errore nel caricamento di tutte le partecipazioni:', allError);
      }

      // Filtra manualmente per includere accepted, pending e null
      const participantsData = (allParticipants || []).filter(p => 
        !p.invitation_status || 
        p.invitation_status === 'accepted' || 
        p.invitation_status === 'pending'
      );


      if (!participantsData || participantsData.length === 0) {
        setUserAdventures([]);
        return;
      }

      // Carica i dettagli delle avventure
      const adventureIds = participantsData.map(p => p.adventure_id);

      const { data: adventuresData, error: adventuresError } = await supabase
        .from('adventures')
        .select('*')
        .in('id', adventureIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (adventuresError) {
        console.error('Errore nel caricamento delle avventure:', adventuresError);
        throw adventuresError;
      }


      // Combina i dati
      // Se invitation_status è NULL, lo trattiamo come 'accepted' per retrocompatibilità
      const adventures: UserAdventure[] = (adventuresData || []).map(adventure => {
        const participant = participantsData.find(p => p.adventure_id === adventure.id);
        const status = participant?.invitation_status;
        return {
          adventure,
          invitation_status: status === null || status === undefined ? 'accepted' : status,
          participant_id: participant?.id || '',
        };
      });

      setUserAdventures(adventures);
    } catch (err: any) {
      console.error('Errore nel caricamento delle avventure:', err);
      setError('Errore nel caricamento delle avventure. Controlla la console per i dettagli.');
    } finally {
      setLoadingAdventures(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const profileData = {
        user_id: user.id,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
      };

      if (profile) {
        // Aggiorna profilo esistente
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', user.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Crea nuovo profilo
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert(profileData)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        setProfile(newProfile);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Errore nel salvataggio del profilo:', err);
      setError(err.message || 'Errore nel salvataggio del profilo. Riprova più tardi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="user-profile-page">
        <div className="profile-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <div className="profile-header">
        <button onClick={onBack} className="back-btn">
          <i className="fas fa-arrow-left"></i> Torna Indietro
        </button>
        <h1>
          <i className="fas fa-user"></i> Il Mio Profilo
        </h1>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-avatar-large">
              <i className="fas fa-user"></i>
            </div>
            <div className="profile-header-info">
              <h2>Informazioni Personali</h2>
              <p>Gestisci il tuo nome e cognome</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="firstName">
                <i className="fas fa-user"></i> Nome
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Inserisci il tuo nome"
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">
                <i className="fas fa-user"></i> Cognome
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Inserisci il tuo cognome"
                disabled={saving}
              />
            </div>

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                <i className="fas fa-check-circle"></i>
                Profilo aggiornato con successo!
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onBack}
                disabled={saving}
              >
                <i className="fas fa-times"></i> Annulla
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Salvataggio...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i> Salva Modifiche
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* User Adventures Section */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-header-info">
              <h2>
                <i className="fas fa-plane"></i> Le Mie Avventure
              </h2>
              <p>Avventure a cui partecipi</p>
            </div>
          </div>

          {loadingAdventures ? (
            <div className="adventures-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <span>Caricamento avventure...</span>
            </div>
          ) : userAdventures.length > 0 ? (
            <div className="user-adventures-list">
              {userAdventures.map(({ adventure, invitation_status }) => (
                <div
                  key={adventure.id}
                  className={`adventure-item ${invitation_status === 'pending' ? 'pending' : ''}`}
                  onClick={() => {
                    if (onViewAdventure && invitation_status === 'accepted') {
                      onViewAdventure(adventure.id);
                    }
                  }}
                >
                  <div className="adventure-info">
                    <h3>{adventure.name}</h3>
                    {adventure.description && (
                      <p className="adventure-description">{adventure.description}</p>
                    )}
                    <div className="adventure-meta">
                      <span className="adventure-date">
                        <i className="fas fa-calendar"></i>
                        {new Date(adventure.created_at).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      {invitation_status === 'pending' && (
                        <span className="invitation-status pending">
                          <i className="fas fa-clock"></i>
                          Invito in attesa di accettazione
                        </span>
                      )}
                      {invitation_status === 'accepted' && (
                        <span className="invitation-status accepted">
                          <i className="fas fa-check-circle"></i>
                          Partecipante attivo
                        </span>
                      )}
                    </div>
                  </div>
                  {invitation_status === 'accepted' && onViewAdventure && (
                    <button
                      className="view-adventure-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewAdventure(adventure.id);
                      }}
                    >
                      <i className="fas fa-eye"></i>
                      Visualizza
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-adventures">
              <i className="fas fa-plane-slash"></i>
              <p>Non partecipi ancora a nessuna avventura.</p>
              <p className="no-adventures-hint">
                Quando qualcuno ti inviterà, l'avventura apparirà qui.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;

