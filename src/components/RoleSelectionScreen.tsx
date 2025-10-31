import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/components/RoleSelectionScreen.scss';

const RoleSelectionScreen: React.FC = () => {
  const { email, selectRole } = useAuth();

  return (
    <div className="role-selection-screen">
      <div className="role-selection-container">
        <div className="role-selection-header">
          <i className="fas fa-user-shield"></i>
          <h1>Seleziona Modalità di Accesso</h1>
          <p>Benvenuto, <strong>{email}</strong></p>
          <p className="subtitle">Scegli come vuoi accedere alla piattaforma:</p>
        </div>

        <div className="role-cards-container">
          <div 
            className="role-card role-card-user"
            onClick={() => selectRole('user')}
          >
            <div className="role-card-icon">
              <i className="fas fa-user"></i>
            </div>
            <h2>Accedi come Utente</h2>
            <p>Esplora le destinazioni, visualizza i dettagli e vota le tue preferenze</p>
            <div className="role-features">
              <div className="feature-item">
                <i className="fas fa-check"></i>
                <span>Vedi tutte le destinazioni</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check"></i>
                <span>Vota le destinazioni</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check"></i>
                <span>Aggiungi commenti</span>
              </div>
            </div>
            <button className="role-select-btn">
              <span>Accedi</span>
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>

          <div 
            className="role-card role-card-admin"
            onClick={() => selectRole('superadmin')}
          >
            <div className="role-card-icon">
              <i className="fas fa-crown"></i>
            </div>
            <h2>Accedi come Amministratore</h2>
            <p>Gestisci la piattaforma, visualizza statistiche e gestisci utenti e permessi</p>
            <div className="role-features">
              <div className="feature-item">
                <i className="fas fa-check"></i>
                <span>Dashboard statistiche</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check"></i>
                <span>Gestione ruoli e permessi</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check"></i>
                <span>Visualizza tutte le votazioni</span>
              </div>
            </div>
            <button className="role-select-btn">
              <span>Accedi</span>
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>

        <div className="role-selection-footer">
          <p>Puoi cambiare modalità in qualsiasi momento dal menu profilo</p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionScreen;

