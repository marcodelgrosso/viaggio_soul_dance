import React from 'react';
import Header from './Header';
import Hero from './Hero';
import Destinations from './Destinations';
import Footer from './Footer';
import AdminDashboard from './AdminDashboard';
import RoleManagement from './RoleManagement';
import { useAuth } from '../context/AuthContext';

// Componente per il banner preview
const PreviewBanner: React.FC<{ onExit: () => void }> = ({ onExit }) => (
  <div style={{
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white',
    padding: '1rem',
    textAlign: 'center',
    marginBottom: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  }}>
    <i className="fas fa-eye" style={{ marginRight: '0.5rem' }}></i>
    <strong>Modalità Preview Attiva</strong> - Stai visualizzando la piattaforma come un utente normale
    <button
      onClick={onExit}
      style={{
        marginLeft: '1rem',
        background: 'rgba(255, 255, 255, 0.2)',
        border: '1px solid white',
        color: 'white',
        padding: '0.3rem 0.8rem',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: '600'
      }}
      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
    >
      Esci da Preview
    </button>
  </div>
);

const MainContent: React.FC = () => {
  const { user, isAdmin, isSuperAdmin, hasPermission, loading, role, previewMode, togglePreviewMode } = useAuth();

  // Debug
  console.log('MainContent render:', { isSuperAdmin, role, loading, email: user?.email, previewMode });

  return (
    <div className="main-content">
      <Header />
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#667eea', marginBottom: '1rem' }}></i>
          <p>Caricamento ruoli e permessi...</p>
        </div>
      ) : (
        <>
          {previewMode && <PreviewBanner onExit={togglePreviewMode} />}
          {isSuperAdmin && !previewMode && (
            <div style={{ marginBottom: '2rem' }}>
              <RoleManagement />
            </div>
          )}
          {isAdmin && <AdminDashboard />}
          {!isAdmin && (
            <>
              <Hero />
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


