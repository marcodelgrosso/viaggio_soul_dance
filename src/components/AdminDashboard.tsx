import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useFirstLogin } from '../hooks/useFirstLogin';
import { useAuth } from '../context/AuthContext';
import AdminVotesModal from './AdminVotesModal';
import '../styles/components/AdminDashboard.scss';

const AdminDashboard: React.FC = () => {
  const { hasPermission } = useAuth();
  const [votes, setVotes] = useState<any[]>([]);
  const [firstLogins, setFirstLogins] = useState<any[]>([]);
  const [showVotesModal, setShowVotesModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { getTodayFirstLogins, cleanupOldFirstLogins } = useFirstLogin();

  useEffect(() => {
    loadAdminVotesPreview();
    loadFirstLogins();
  }, []);

  const loadAdminVotesPreview = async () => {
    try {
      const { data, error } = await supabase
        .from('destination_votes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setVotes(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento delle votazioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFirstLogins = () => {
    cleanupOldFirstLogins();
    const logins = getTodayFirstLogins();
    setFirstLogins(logins);
  };

  const resetFirstLogins = () => {
    if (window.confirm('Vuoi resettare tutti i primi accessi registrati?')) {
      localStorage.setItem('firstLogins', '[]');
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('hasLoggedIn_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      loadFirstLogins();
      alert('Primi accessi resettati con successo!');
    }
  };

  const destinationNames: { [key: string]: string } = {
    'seville': 'Siviglia, Spagna',
    'london': 'Londra, Regno Unito',
    'birmingham': 'Birmingham, Regno Unito',
    'geneva': 'Ginevra, Svizzera',
  };

  const stats: { [key: string]: { total: number; yes: number; no: number } } = {};
  votes.forEach(vote => {
    if (!stats[vote.destination_id]) {
      stats[vote.destination_id] = { total: 0, yes: 0, no: 0 };
    }
    stats[vote.destination_id].total++;
    if (vote.vote_type === 'yes') stats[vote.destination_id].yes++;
    else stats[vote.destination_id].no++;
  });

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-content">
        <div className="admin-dashboard-header">
          <div className="admin-dashboard-title">
            <i className="fas fa-chart-bar"></i>
            <h2>Dashboard Votazioni</h2>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="admin-refresh-btn" onClick={() => setShowVotesModal(true)} title="Aggiorna votazioni">
              <i className="fas fa-sync-alt"></i>
              Vedi tutte le votazioni
            </button>
            <button className="admin-reset-btn" onClick={resetFirstLogins} title="Ripulisci primi accessi di test">
              <i className="fas fa-trash-alt"></i>
              Reset primi accessi
            </button>
          </div>
        </div>

        <div className="admin-votes-preview">
          {!hasPermission('view_statistics') ? (
            <div className="no-votes-message">
              <i className="fas fa-lock" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-light)' }}>Accesso negato</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                Non hai il permesso per visualizzare le statistiche.
              </p>
            </div>
          ) : loading ? (
            <p>Caricamento votazioni...</p>
          ) : votes.length === 0 ? (
            <div className="no-votes-message">
              <i className="fas fa-inbox" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-light)' }}>Nessuna votazione ancora registrata.</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>Le votazioni appariranno qui quando gli utenti inizieranno a votare.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', width: '100%' }}>
              {Object.keys(stats).map(destId => {
                const stat = stats[destId];
                const percentage = stat.total > 0 ? Math.round((stat.yes / stat.total) * 100) : 0;
                return (
                  <div key={destId} style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-light)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary-color)', marginBottom: '1rem', fontSize: '1.1rem' }}>
                      {destinationNames[destId] || destId}
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <i className="fas fa-thumbs-up" style={{ color: '#48bb78' }}></i>
                      {' '}Positivi: <strong>{stat.yes}</strong>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <i className="fas fa-thumbs-down" style={{ color: '#f56565' }}></i>
                      {' '}Negativi: <strong>{stat.no}</strong>
                    </div>
                    <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid var(--light-bg)' }}>
                      Totale: <strong>{stat.total}</strong> ({percentage}% positivi)
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {hasPermission('view_statistics') && (
          <div className="first-logins-section">
            <h3><i className="fas fa-user-check"></i> Primi accessi oggi</h3>
          <div className="first-logins-list">
            {firstLogins.length === 0 ? (
              <div className="no-first-logins">
                <i className="fas fa-user-slash"></i>
                <p>Nessun primo accesso registrato oggi.</p>
              </div>
            ) : (
              firstLogins.map((login, index) => (
                <div key={index} className="first-login-item">
                  <i className="fas fa-user-plus"></i>
                  <div>
                    <span>{login.user}</span>
                    <div className="first-login-item-time">{login.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        )}
      </div>

      {showVotesModal && (
        <AdminVotesModal
          isOpen={showVotesModal}
          onClose={() => {
            setShowVotesModal(false);
            loadAdminVotesPreview();
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;

