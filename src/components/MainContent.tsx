import React from 'react';
import Header from './Header';
import Destinations from './Destinations';
import Footer from './Footer';
import AdminDashboard from './AdminDashboard';
import RoleManagement from './RoleManagement';
import AdventuresManager from './AdventuresManager';
import { useAuth } from '../context/AuthContext';

const MainContent: React.FC = () => {
  const { user, isAdmin, isSuperAdmin, hasPermission, loading, role, selectedRole, actualIsSuperAdmin, permissions } = useAuth();

  // Debug
  console.log('MainContent render:', { 
    isSuperAdmin, 
    actualIsSuperAdmin,
    role, 
    loading, 
    email: user?.email, 
    selectedRole,
    hasIsCreator: hasPermission('is_creator'),
    permissions
  });

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
          {isSuperAdmin && (
            <div style={{ marginBottom: '2rem' }}>
              <RoleManagement />
            </div>
          )}
          {(hasPermission('is_creator') || actualIsSuperAdmin) && (
            <div style={{ marginBottom: '2rem' }}>
              <AdventuresManager />
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
