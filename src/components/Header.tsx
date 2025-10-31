import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import LogoutModal from './LogoutModal';
import '../styles/components/Header.scss';

const Header: React.FC = () => {
  const { email, isAdmin, isSuperAdmin, role, logout, previewMode, togglePreviewMode, isSuperAdmin: actualIsSuperAdmin } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Chiudi dropdown quando clicchi fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Chiudi dropdown quando premi ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const handleLogoutClick = () => {
    setShowProfileDropdown(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await logout();
    setShowLogoutModal(false);
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  return (
    <>
      {/* Main Header */}
      <header className="header">
        <nav className="navbar">
          <div className="nav-brand">
            <i className="fas fa-plane"></i>
            <span>Viaggio Soul Dance</span>
          </div>
          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#destinations">Destinazioni</a>
            <a href="#about">Chi Siamo</a>
            <a href="#contact">Contatti</a>
          </div>
          {email && (
            <div className="profile-menu" ref={dropdownRef}>
              <button
                className="profile-button"
                onClick={toggleProfileDropdown}
                aria-label="Menu profilo"
                aria-expanded={showProfileDropdown}
              >
                <i className="fas fa-user-circle"></i>
              </button>
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <i className="fas fa-user-circle"></i>
                    <div className="profile-info">
                      <span className="profile-email">{email}</span>
                      {previewMode && (
                        <span className="profile-badge profile-badge-preview">
                          <i className="fas fa-eye"></i> Preview Mode
                        </span>
                      )}
                      {!previewMode && actualIsSuperAdmin && (
                        <span className="profile-badge profile-badge-superadmin">
                          <i className="fas fa-crown"></i> Superadmin
                        </span>
                      )}
                      {!previewMode && !actualIsSuperAdmin && isAdmin && (
                        <span className="profile-badge">
                          <i className="fas fa-shield-alt"></i> Admin
                        </span>
                      )}
                    </div>
                  </div>
                  {actualIsSuperAdmin && (
                    <>
                      <div className="profile-dropdown-divider"></div>
                      <button 
                        className={`profile-dropdown-item ${previewMode ? 'preview-active' : ''}`}
                        onClick={togglePreviewMode}
                        title={previewMode ? 'Disattiva modalità preview' : 'Attiva modalità preview (vedi come user)'}
                      >
                        <i className={`fas ${previewMode ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        <span>{previewMode ? 'Esci da Preview' : 'Modalità Preview'}</span>
                      </button>
                    </>
                  )}
                  <div className="profile-dropdown-divider"></div>
                  <button className="profile-dropdown-item" onClick={handleLogoutClick}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Esci</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </header>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
};

export default Header;
