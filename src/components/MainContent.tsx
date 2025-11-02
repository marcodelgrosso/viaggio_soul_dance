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
  const { user, isAdmin, isSuperAdmin, loading } = useAuth();
  const [selectedAdventureId, setSelectedAdventureId] = useState<string | null>(null);
  const [editAdventureId, setEditAdventureId] = useState<string | null>(null);
  const [votingAdventureId, setVotingAdventureId] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  const navigateToHome = () => {
    setSelectedAdventureId(null);
    setEditAdventureId(null);
    setVotingAdventureId(null);
    setShowUserProfile(false);
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
                  onViewVoting={(adventureId) => setVotingAdventureId(adventureId)}
                />
              ) : (
                <AdventuresManager
                  onViewAdventure={(adventureId) => setSelectedAdventureId(adventureId)}
                  onViewVoting={(adventureId) => setVotingAdventureId(adventureId)}
                />
              )}
            </div>
          )}
          {isAdmin && <AdminDashboard />}
          {!isAdmin && (
            <>
              <Destinations />
              <Footer />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MainContent;
