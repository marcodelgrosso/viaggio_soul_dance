import React, { useState } from 'react';
import Header from './Header';
import Destinations from './Destinations';
import Footer from './Footer';
import AdminDashboard from './AdminDashboard';
import RoleManagement from './RoleManagement';
import AdventuresManager from './AdventuresManager';
import AdventureDetail from './AdventureDetail';
import EditAdventurePage from './EditAdventurePage';
import AdventureVotingPage from './AdventureVotingPage';
import UserProfilePage from './UserProfilePage';
import { useAuth } from '../context/AuthContext';

const MainContent: React.FC = () => {
  const { user, isAdmin, isSuperAdmin, loading, hasPermission, actualIsSuperAdmin } = useAuth();
  const [selectedAdventureId, setSelectedAdventureId] = useState<string | null>(null);
  const [editAdventureId, setEditAdventureId] = useState<string | null>(null);
  const [votingAdventureId, setVotingAdventureId] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  const navigateToHome = () => {
    setSelectedAdventureId(null);
    setEditAdventureId(null);
    setVotingAdventureId(null);
    setShowUserProfile(false);
    setShowAdminDashboard(false);
  };

  const navigateToAdminDashboard = () => {
    setSelectedAdventureId(null);
    setEditAdventureId(null);
    setVotingAdventureId(null);
    setShowUserProfile(false);
    setShowAdminDashboard(true);
  };

  return (
    <div className="main-content">
      <Header 
        onShowProfile={() => setShowUserProfile(true)}
        onNavigateToAdventure={(adventureId) => {
          setShowUserProfile(false);
          setSelectedAdventureId(adventureId);
        }}
        onNavigateToHome={navigateToHome}
        onNavigateToAdminDashboard={navigateToAdminDashboard}
      />
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#667eea', marginBottom: '1rem' }}></i>
          <p>Caricamento ruoli e permessi...</p>
        </div>
      ) : showUserProfile ? (
        <UserProfilePage 
          onBack={() => setShowUserProfile(false)}
          onViewAdventure={(adventureId) => {
            setShowUserProfile(false);
            setSelectedAdventureId(adventureId);
          }}
        />
      ) : showAdminDashboard ? (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setShowAdminDashboard(false)}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <i className="fas fa-arrow-left"></i> Torna Indietro
            </button>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 400, color: '#1a202c' }}>
              Admin Control
            </h1>
          </div>
          {isAdmin && <AdminDashboard />}
        </div>
      ) : (
        <>
          {isSuperAdmin && (
            <div style={{ marginBottom: '2rem' }}>
              <RoleManagement />
            </div>
          )}
          {/* Mostra AdventuresManager a tutti gli utenti autenticati, non solo a quelli con is_creator */}
          {user && (
            <div style={{ marginBottom: '2rem' }}>
              {editAdventureId ? (
                <EditAdventurePage
                  adventureId={editAdventureId}
                  onBack={() => setEditAdventureId(null)}
                />
              ) : votingAdventureId ? (
                <AdventureVotingPage
                  adventureId={votingAdventureId}
                  onBack={() => setVotingAdventureId(null)}
                />
              ) : selectedAdventureId ? (
                <AdventureDetail
                  adventureId={selectedAdventureId}
                  onBack={() => setSelectedAdventureId(null)}
                  onEdit={(adventureId) => setEditAdventureId(adventureId)}
                  onViewVoting={(adventureId) => {
                    // Il controllo completo dei permessi viene fatto in AdventureVotingPage
                    // Qui permettiamo la navigazione, ma AdventureVotingPage bloccherà se necessario
                    setVotingAdventureId(adventureId);
                  }}
                />
              ) : (
                <AdventuresManager
                  onViewAdventure={(adventureId) => setSelectedAdventureId(adventureId)}
                  onViewVoting={(adventureId) => {
                    // Controlla permessi prima di permettere l'accesso
                    if (hasPermission('view_statistics') || actualIsSuperAdmin) {
                      setVotingAdventureId(adventureId);
                    } else {
                      alert('Non hai i permessi necessari per visualizzare le statistiche.');
                    }
                  }}
                />
              )}
            </div>
          )}
          {isAdmin && !showAdminDashboard && <AdminDashboard />}
          {isSuperAdmin && (
            <>
              <Destinations />
            </>
          )}
          {!isAdmin && !isSuperAdmin && (
            <>
              <Footer />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MainContent;
