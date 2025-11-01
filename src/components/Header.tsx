import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import LogoutModal from './LogoutModal';
import '../styles/components/Header.scss';

interface HeaderProps {
  onShowProfile?: () => void;
  onNavigateToAdventure?: (adventureId: string) => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: {
    adventure_id?: string;
    participant_id?: string;
    inviter_id?: string;
  };
  read: boolean;
  action_taken?: boolean;
  created_at: string;
}

const Header: React.FC<HeaderProps> = ({ onShowProfile, onNavigateToAdventure }) => {
  const { email, isAdmin, logout, isSuperAdmin: actualIsSuperAdmin, selectRole, selectedRole, user } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Carica notifiche
  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Polling ogni 30 secondi per nuove notifiche
      const interval = setInterval(() => {
        loadNotifications();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Errore nel caricamento delle notifiche:', error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (err) {
      console.error('Errore nel caricamento delle notifiche:', err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Errore nel segnare la notifica come letta:', error);
        return;
      }

      // Aggiorna lo stato locale
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Errore nel segnare la notifica come letta:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Errore nel segnare tutte le notifiche come lette:', error);
        return;
      }

      // Aggiorna lo stato locale
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Errore nel segnare tutte le notifiche come lette:', err);
    }
  };

  const handleAcceptInvitation = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    
    if (!user || !notification.metadata?.adventure_id) return;

    try {
      // Aggiorna lo status del partecipante a "accepted"
      const { error: updateError } = await supabase
        .from('adventure_participants')
        .update({ invitation_status: 'accepted' })
        .eq('adventure_id', notification.metadata.adventure_id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Errore nell\'accettazione dell\'invito:', updateError);
        alert('Errore nell\'accettazione dell\'invito. Riprova.');
        return;
      }

      // Segna la notifica come action_taken e letta
      const { error: notificationError } = await supabase
        .from('user_notifications')
        .update({ action_taken: true, read: true })
        .eq('id', notification.id);

      if (notificationError) {
        console.error('Errore nell\'aggiornamento della notifica:', notificationError);
      }

      // Aggiorna lo stato locale
      setNotifications(prev =>
        prev.map(n => 
          n.id === notification.id 
            ? { ...n, action_taken: true, read: true } 
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Chiudi il dropdown delle notifiche
      setShowNotificationsDropdown(false);

      // Naviga all'avventura
      if (notification.metadata?.adventure_id && onNavigateToAdventure) {
        onNavigateToAdventure(notification.metadata.adventure_id);
      }

      // Ricarica le notifiche per aggiornare lo stato
      loadNotifications();
    } catch (err) {
      console.error('Errore nell\'accettazione dell\'invito:', err);
      alert('Errore nell\'accettazione dell\'invito. Riprova.');
    }
  };

  const handleDeclineInvitation = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    
    if (!user || !notification.metadata?.adventure_id) return;

    try {
      // Rimuovi il partecipante (o aggiorna lo status a "declined")
      const { error: deleteError } = await supabase
        .from('adventure_participants')
        .delete()
        .eq('adventure_id', notification.metadata.adventure_id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Errore nel rifiuto dell\'invito:', deleteError);
        alert('Errore nel rifiuto dell\'invito. Riprova.');
        return;
      }

      // Segna la notifica come action_taken e letta
      const { error: notificationError } = await supabase
        .from('user_notifications')
        .update({ action_taken: true, read: true })
        .eq('id', notification.id);

      if (notificationError) {
        console.error('Errore nell\'aggiornamento della notifica:', notificationError);
      }

      // Aggiorna lo stato locale
      setNotifications(prev =>
        prev.map(n => 
          n.id === notification.id 
            ? { ...n, action_taken: true, read: true } 
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Ricarica le notifiche per aggiornare lo stato
      loadNotifications();
    } catch (err) {
      console.error('Errore nel rifiuto dell\'invito:', err);
      alert('Errore nel rifiuto dell\'invito. Riprova.');
    }
  };

  // Chiudi dropdown quando clicchi fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotificationsDropdown(false);
      }
    };

    if (showProfileDropdown || showNotificationsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown, showNotificationsDropdown]);

  // Chiudi dropdown quando premi ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowProfileDropdown(false);
        setShowNotificationsDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const toggleNotificationsDropdown = () => {
    setShowNotificationsDropdown(!showNotificationsDropdown);
    if (!showNotificationsDropdown) {
      loadNotifications();
    }
  };

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
            <a href="#destinations">Destinazioni</a>
            <a href="#about">Chi Siamo</a>
            <a href="#contact">Contatti</a>
          </div>
          {email && (
            <div className="nav-actions">
              {/* Notifications Menu */}
              <div className="notifications-menu" ref={notificationsRef}>
                <button
                  className="notifications-button"
                  onClick={toggleNotificationsDropdown}
                  aria-label="Notifiche"
                  aria-expanded={showNotificationsDropdown}
                >
                  <i className="fas fa-bell"></i>
                  {unreadCount > 0 && (
                    <span className="notifications-badge">{unreadCount}</span>
                  )}
                </button>
                {showNotificationsDropdown && (
                  <div className="notifications-dropdown">
                    <div className="notifications-dropdown-header">
                      <h3>
                        <i className="fas fa-bell"></i>
                        Notifiche
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          className="mark-all-read-btn"
                          onClick={markAllAsRead}
                          title="Segna tutte come lette"
                        >
                          <i className="fas fa-check-double"></i>
                          Segna tutte lette
                        </button>
                      )}
                    </div>
                    <div className="notifications-list">
                      {loadingNotifications ? (
                        <div className="notifications-loading">
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>Caricamento...</span>
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                            onClick={() => {
                              // Non navigare se è un'invito con azioni pendenti
                              if (notification.type === 'adventure_invitation' && 
                                  !notification.action_taken) {
                                return;
                              }
                              if (!notification.read) {
                                markAsRead(notification.id);
                              }
                              if (notification.link && notification.action_taken) {
                                window.location.href = notification.link;
                              }
                            }}
                          >
                            <div className="notification-icon">
                              <i className={`fas fa-${
                                notification.type === 'adventure_invitation' ? 'user-plus' :
                                notification.type === 'vote_comment' ? 'comment' :
                                notification.type === 'participant_added' ? 'users' :
                                notification.type === 'adventure_updated' ? 'edit' :
                                'bell'
                              }`}></i>
                            </div>
                            <div className="notification-content">
                              <h4>{notification.title}</h4>
                              <p>{notification.message}</p>
                              {notification.type === 'adventure_invitation' && 
                               !notification.action_taken && (
                                <div className="notification-actions">
                                  <button
                                    className="notification-btn accept-btn"
                                    onClick={(e) => handleAcceptInvitation(e, notification)}
                                  >
                                    <i className="fas fa-check"></i>
                                    Accetta
                                  </button>
                                  <button
                                    className="notification-btn decline-btn"
                                    onClick={(e) => handleDeclineInvitation(e, notification)}
                                  >
                                    <i className="fas fa-times"></i>
                                    Rifiuta
                                  </button>
                                </div>
                              )}
                              {notification.action_taken && (
                                <span className="notification-action-taken">
                                  <i className="fas fa-check-circle"></i>
                                  {notification.metadata?.adventure_id ? 'Accettato' : 'Completato'}
                                </span>
                              )}
                              <span className="notification-time">
                                {new Date(notification.created_at).toLocaleString('it-IT', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            {!notification.read && (
                              <div className="notification-unread-dot"></div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="notifications-empty">
                          <i className="fas fa-bell-slash"></i>
                          <p>Nessuna notifica</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu */}
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
                      {actualIsSuperAdmin && selectedRole === 'superadmin' && (
                        <span className="profile-badge profile-badge-superadmin">
                          <i className="fas fa-crown"></i> Amministratore
                        </span>
                      )}
                      {actualIsSuperAdmin && selectedRole === 'user' && (
                        <span className="profile-badge">
                          <i className="fas fa-user"></i> Utente
                        </span>
                      )}
                      {!actualIsSuperAdmin && isAdmin && (
                        <span className="profile-badge">
                          <i className="fas fa-shield-alt"></i> Admin
                        </span>
                      )}
                    </div>
                  </div>
                  {actualIsSuperAdmin && (
                    <>
                      <div className="profile-dropdown-divider"></div>
                      {selectedRole === 'user' ? (
                        <button 
                          className="profile-dropdown-item"
                          onClick={() => {
                            selectRole('superadmin');
                            setShowProfileDropdown(false);
                          }}
                          title="Passa a modalità Amministratore"
                        >
                          <i className="fas fa-crown"></i>
                          <span>Modalità Amministratore</span>
                        </button>
                      ) : selectedRole === 'superadmin' ? (
                        <button 
                          className="profile-dropdown-item"
                          onClick={() => {
                            selectRole('user');
                            setShowProfileDropdown(false);
                          }}
                          title="Passa a modalità Utente"
                        >
                          <i className="fas fa-user"></i>
                          <span>Modalità Utente</span>
                        </button>
                      ) : null}
                    </>
                  )}
                  {onShowProfile && (
                    <>
                      <div className="profile-dropdown-divider"></div>
                      <button 
                        className="profile-dropdown-item" 
                        onClick={() => {
                          onShowProfile();
                          setShowProfileDropdown(false);
                        }}
                      >
                        <i className="fas fa-user-edit"></i>
                        <span>Il Mio Profilo</span>
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
