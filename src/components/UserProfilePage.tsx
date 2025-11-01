import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import '../styles/components/UserProfilePage.scss';

interface UserProfilePageProps {
  onBack: () => void;
}

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
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
      </div>
    </div>
  );
};

export default UserProfilePage;

