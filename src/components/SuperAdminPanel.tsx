import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import RoleManagement from './RoleManagement';
import Destinations from './Destinations';
import SuperAdminAdventures from './SuperAdminAdventures';
import SuperAdminAccessLogs from './SuperAdminAccessLogs';
import SuperAdminFeedbackCenter from './SuperAdminFeedbackCenter';
import SuperAdminFinanceOverview from './SuperAdminFinanceOverview';
import SuperAdminSystemSettings from './SuperAdminSystemSettings';
import '../styles/components/SuperAdminPanel.scss';

export type SuperAdminSection =
  | 'overview'
  | 'access'
  | 'users'
  | 'adventures'
  | 'content'
  | 'feedback'
  | 'finance'
  | 'settings';

interface SuperAdminPanelProps {
  onClose?: () => void;
}

interface SectionDescriptor {
  id: SuperAdminSection;
  label: string;
  description: string;
  icon: string;
  requiresPermission?: {
    permission: string;
    fallback?: React.ReactNode;
  };
}

const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ onClose }) => {
  const { user, actualIsSuperAdmin } = useAuth();
  const getIsDesktop = () => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const [activeSection, setActiveSection] = useState<SuperAdminSection>('overview');
  const [isDesktop, setIsDesktop] = useState<boolean>(getIsDesktop);
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true));

  useEffect(() => {
    const handleResize = () => {
      const desktop = getIsDesktop();
      setIsDesktop(desktop);
      setSidebarOpen(desktop);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sections = useMemo<SectionDescriptor[]>(() => {
    return [
      {
        id: 'overview',
        label: 'Dashboard',
        description: 'Metriche chiave e stato della piattaforma',
        icon: 'fa-chart-line',
      },
      {
        id: 'access',
        label: 'Accessi & Sicurezza',
        description: 'Tracciamento accessi e attività recenti',
        icon: 'fa-shield-halved',
      },
      {
        id: 'users',
        label: 'Utenti & Ruoli',
        description: 'Gestisci ruoli, permessi e onboarding',
        icon: 'fa-users-gear',
      },
      {
        id: 'adventures',
        label: 'Avventure',
        description: 'Panoramica e gestione del catalogo avventure',
        icon: 'fa-route',
      },
      {
        id: 'content',
        label: 'Contenuti',
        description: 'Destinazioni statiche e materiali promozionali',
        icon: 'fa-map-location-dot',
      },
      {
        id: 'feedback',
        label: 'Feedback & Segnalazioni',
        description: 'Notifiche, richieste di supporto e commenti',
        icon: 'fa-inbox',
      },
      {
        id: 'finance',
        label: 'Finanze',
        description: 'Overview costi trasporti e analisi spese',
        icon: 'fa-coins',
      },
      {
        id: 'settings',
        label: 'Impostazioni',
        description: 'Configurazioni globali e integrazioni',
        icon: 'fa-sliders',
      },
    ];
  }, []);

  const handleSectionChange = (section: SuperAdminSection) => {
    setActiveSection(section);
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return <AdminDashboard />;
      case 'access':
        return <SuperAdminAccessLogs />;
      case 'users':
        return <RoleManagement />;
      case 'adventures':
        return (
          <SuperAdminAdventures />
        );
      case 'content':
        return (
          <div className="superadmin-section-wrapper">
            <div className="superadmin-section-header">
              <div>
                <h2>Contenuti e Destinazioni</h2>
                <p>Rivedi e aggiorna i contenuti statici della piattaforma.</p>
              </div>
            </div>
            <Destinations />
          </div>
        );
      case 'feedback':
        return <SuperAdminFeedbackCenter />;
      case 'finance':
        return <SuperAdminFinanceOverview />;
      case 'settings':
        return <SuperAdminSystemSettings />;
      default:
        return null;
    }
  };

  if (!actualIsSuperAdmin) {
    return (
      <div className="superadmin-panel">
        <div className="superadmin-panel-empty">
          <i className="fas fa-lock"></i>
          <h2>Accesso riservato</h2>
          <p>Solo i superadmin possono accedere al pannello di controllo avanzato.</p>
        </div>
      </div>
    );
  }

  const panelClassNames = [
    'superadmin-panel',
    isDesktop ? 'is-desktop' : 'is-mobile',
    isSidebarOpen ? 'sidebar-open' : 'sidebar-closed',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={panelClassNames}>
      <aside
        className="superadmin-sidebar"
        aria-hidden={!isDesktop && !isSidebarOpen}
      >
        <div className="superadmin-sidebar-header">
          <div className="superadmin-sidebar-title">
            <i className="fas fa-crown"></i>
            <div>
              <h3>Amministrazione</h3>
              <span className="superadmin-sidebar-subtitle">Superadmin toolkit</span>
            </div>
          </div>
          {user && (
            <div className="superadmin-user-chip">
              <i className="fas fa-user-shield"></i>
              <span>{user.email}</span>
            </div>
          )}
          {!isDesktop && (
            <button
              className="superadmin-sidebar-close"
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Chiudi menu amministratore"
            >
              <i className="fas fa-times" />
            </button>
          )}
        </div>

        <nav className="superadmin-nav">
          {sections.map((section) => {
            const isActive = section.id === activeSection;
            const handleClick = () => handleSectionChange(section.id);
            return (
              <button
                key={section.id}
                className={`superadmin-nav-item ${isActive ? 'active' : ''}`}
                onClick={handleClick}
              >
                <div className="superadmin-nav-item-main">
                  <i className={`fas ${section.icon}`} />
                  <div>
                    <span className="label">{section.label}</span>
                    <span className="description">{section.description}</span>
                  </div>
                </div>
                <i className="fas fa-angle-right" />
              </button>
            );
          })}
        </nav>

        <div className="superadmin-sidebar-footer">
          <div className="superadmin-status-card">
            <i className="fas fa-circle-check"></i>
            <div>
              <p>Stato Piattaforma</p>
              <strong>Operativa</strong>
            </div>
          </div>
          {onClose && (
            <button className="superadmin-exit-btn" onClick={onClose}>
              <i className="fas fa-arrow-left"></i>
              Torna alla vista utente
            </button>
          )}
        </div>
      </aside>
      {!isDesktop && (
        <div
          className={`superadmin-sidebar-backdrop ${isSidebarOpen ? 'visible' : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden={!isSidebarOpen}
        />
      )}

      <main className="superadmin-content">
        <header className="superadmin-content-header">
          {!isDesktop && (
            <button
              className="superadmin-sidebar-toggle"
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Apri menu amministratore"
            >
              <i className="fas fa-bars" />
            </button>
          )}
          <div className="superadmin-header-body">
            <h1>{sections.find((section) => section.id === activeSection)?.label}</h1>
            <p>{sections.find((section) => section.id === activeSection)?.description}</p>
          </div>
        </header>
        <section className="superadmin-content-body">{renderActiveSection()}</section>
      </main>
    </div>
  );
};

export default SuperAdminPanel;


