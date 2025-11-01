import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { enrichParticipant } from '../lib/userUtils';
import { AdventureWithDestinations, AdventureDestinationWithPlaces } from '../types/adventures';
import AdventureInformationSection from './EditAdventure/AdventureInformationSection';
import AdventureDestinationsSection from './EditAdventure/AdventureDestinationsSection';
import AdventureParticipantsSection from './EditAdventure/AdventureParticipantsSection';
import AddDestinationPage from './EditAdventure/AddDestinationPage';
import EditDestinationPage from './EditAdventure/EditDestinationPage';
import AddParticipantPage from './EditAdventure/AddParticipantPage';
import '../styles/components/EditAdventurePage.scss';

interface EditAdventurePageProps {
  adventureId: string;
  onBack: () => void;
}

type Section = 'information' | 'destinations' | 'participants';

type PageType = 
  | { type: 'section'; section: Section }
  | { type: 'add-destination' }
  | { type: 'edit-destination'; destination: AdventureDestinationWithPlaces }
  | { type: 'add-participant' };

const EditAdventurePage: React.FC<EditAdventurePageProps> = ({ adventureId, onBack }) => {
  const { user, actualIsSuperAdmin } = useAuth();
  const [adventure, setAdventure] = useState<AdventureWithDestinations | null>(null);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  
  // Stack di navigazione
  const [pageStack, setPageStack] = useState<PageType[]>([
    { type: 'section', section: 'information' }
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  // Refs per evitare re-render non necessari
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);
  const lastAdventureIdRef = useRef<string | null>(null);
  const lastUserIdRef = useRef<string | null>(null);

  const currentPage = pageStack[currentPageIndex];

  // Navigazione
  const navigateTo = (page: PageType) => {
    // Rimuovi le pagine successive all'indice corrente se ce ne sono
    const newStack = pageStack.slice(0, currentPageIndex + 1);
    newStack.push(page);
    setPageStack(newStack);
    setCurrentPageIndex(newStack.length - 1);
  };

  const navigateBack = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const navigateForward = () => {
    if (currentPageIndex < pageStack.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const canGoBack = currentPageIndex > 0;
  const canGoForward = currentPageIndex < pageStack.length - 1;

  const loadAdventureData = useCallback(async () => {
    // Evita di caricare quando la tab non è visibile o se il componente è stato smontato
    if (document.visibilityState === 'hidden' || !isMountedRef.current) {
      return;
    }
    
    const currentUserId = user?.id || null;
    
    // Evita di ricaricare se già caricato e i parametri non sono cambiati
    if (hasLoadedRef.current && 
        lastAdventureIdRef.current === adventureId && 
        lastUserIdRef.current === currentUserId) {
      return;
    }
    
    lastAdventureIdRef.current = adventureId;
    lastUserIdRef.current = currentUserId;
    
    try {
      setLoading(true);

      // Carica l'avventura
      const { data: adventureData, error: adventureError } = await supabase
        .from('adventures')
        .select('*')
        .eq('id', adventureId)
        .eq('is_active', true)
        .single();

      if (adventureError) {
        throw adventureError;
      }

      // Carica i creator
      const { data: creatorsData } = await supabase
        .from('adventure_creators')
        .select('*')
        .eq('adventure_id', adventureId);

      // Verifica permessi
      if (user) {
        const isOriginalCreator = adventureData.created_by === user.id;
        const isAdventureCreator = creatorsData?.some(c => c.user_id === user.id) || false;
        const canManage = isOriginalCreator || isAdventureCreator || actualIsSuperAdmin;
        setCanEdit(canManage);

        if (!canManage) {
          alert('Non hai i permessi per modificare questa avventura');
          onBack();
          return;
        }
      }

      // Carica le destinazioni
      const { data: destinationsData } = await supabase
        .from('adventure_destinations')
        .select('*')
        .eq('adventure_id', adventureId)
        .order('order_index', { ascending: true });

      // Carica i partecipanti
      const { data: participantsData } = await supabase
        .from('adventure_participants')
        .select('*')
        .eq('adventure_id', adventureId);

      // Per ogni destinazione, carica i luoghi
      const destinationsWithPlaces = await Promise.all(
        (destinationsData || []).map(async (destination) => {
          const { data: placesData } = await supabase
            .from('adventure_destination_places')
            .select('*')
            .eq('destination_id', destination.id)
            .order('order_index', { ascending: true });

          return {
            ...destination,
            places: placesData || [],
            // I tags vengono restituiti come array JSON da Supabase
            tags: destination.tags ? (Array.isArray(destination.tags) ? destination.tags : JSON.parse(destination.tags as any)) : [],
          };
        })
      );

      // Arricchisci i partecipanti con email e nome completo
      const participantsWithEmails = await Promise.all(
        (participantsData || []).map(enrichParticipant)
      );

      if (isMountedRef.current) {
        setAdventure({
          ...adventureData,
          destinations: destinationsWithPlaces,
          creators: creatorsData || [],
          participants: participantsWithEmails,
        });
        hasLoadedRef.current = true;
      }
    } catch (error) {
      console.error('Errore nel caricamento dell\'avventura:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [adventureId, user, actualIsSuperAdmin]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Carica i dati solo se la tab è visibile
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !hasLoadedRef.current) {
        loadAdventureData();
      }
    };

    // Carica inizialmente se la tab è visibile
    if (document.visibilityState === 'visible') {
      loadAdventureData();
    }

    // Aggiungi listener per i cambi di visibilità
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [adventureId, user, loadAdventureData]);

  const handleRefresh = useCallback(() => {
    hasLoadedRef.current = false;
    loadAdventureData();
  }, [loadAdventureData]);

  const handleSectionChange = (section: Section) => {
    navigateTo({ type: 'section', section });
  };

  const handleSuccessAndBack = () => {
    handleRefresh();
    navigateBack();
  };

  if (loading) {
    return (
      <div className="edit-adventure-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Caricamento...</p>
      </div>
    );
  }

  if (!adventure || !canEdit) {
    return (
      <div className="edit-adventure-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>Accesso negato o avventura non trovata</p>
        <button onClick={onBack} className="back-btn">
          <i className="fas fa-arrow-left"></i> Torna Indietro
        </button>
      </div>
    );
  }

  // Determina se siamo in una pagina fullscreen o in una sezione
  const isFullscreenPage = currentPage.type !== 'section';

  // Se siamo in una pagina fullscreen, mostra solo quella pagina
  if (isFullscreenPage) {
    return (
      <div className="edit-adventure-page edit-adventure-page-fullscreen">
        <div className="edit-adventure-navigation-bar">
          <button 
            onClick={navigateBack} 
            className="nav-btn"
            disabled={!canGoBack}
            title="Indietro"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <button 
            onClick={navigateForward} 
            className="nav-btn"
            disabled={!canGoForward}
            title="Avanti"
          >
            <i className="fas fa-arrow-right"></i>
          </button>
          <button onClick={onBack} className="nav-btn close-btn" title="Chiudi modifica">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {currentPage.type === 'add-destination' && (
          <AddDestinationPage
            adventureId={adventure.id}
            existingDestinationsCount={adventure.destinations.length}
            onBack={navigateBack}
            onSuccess={handleSuccessAndBack}
          />
        )}

        {currentPage.type === 'edit-destination' && (
          <EditDestinationPage
            destination={currentPage.destination}
            onBack={navigateBack}
            onSuccess={handleSuccessAndBack}
          />
        )}

        {currentPage.type === 'add-participant' && (
          <AddParticipantPage
            adventureId={adventure.id}
            currentParticipants={adventure.participants}
            onBack={navigateBack}
            onSuccess={handleSuccessAndBack}
          />
        )}
      </div>
    );
  }

  // Altrimenti mostra il layout normale con sidebar
  const activeSection = currentPage.section;

  return (
    <div className="edit-adventure-page">
      <div className="edit-adventure-header">
        <button onClick={onBack} className="back-btn">
          <i className="fas fa-arrow-left"></i> Torna Indietro
        </button>
        <h1>
          <i className="fas fa-edit"></i>
          Modifica Avventura: {adventure.name}
        </h1>
      </div>

      <div className="edit-adventure-layout">
        <aside className="edit-adventure-sidebar">
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeSection === 'information' ? 'active' : ''}`}
              onClick={() => handleSectionChange('information')}
            >
              <i className="fas fa-info-circle"></i>
              <span>Informazioni</span>
            </button>
            <button
              className={`nav-item ${activeSection === 'destinations' ? 'active' : ''}`}
              onClick={() => handleSectionChange('destinations')}
            >
              <i className="fas fa-map"></i>
              <span>Destinazioni</span>
            </button>
            <button
              className={`nav-item ${activeSection === 'participants' ? 'active' : ''}`}
              onClick={() => handleSectionChange('participants')}
            >
              <i className="fas fa-users"></i>
              <span>Partecipanti</span>
            </button>
          </nav>
        </aside>

        <main className="edit-adventure-content">
          {activeSection === 'information' && (
            <AdventureInformationSection
              adventure={adventure}
              onSuccess={handleRefresh}
            />
          )}
          {activeSection === 'destinations' && (
            <AdventureDestinationsSection
              adventure={adventure}
              onSuccess={handleRefresh}
              onOpenAddModal={() => navigateTo({ type: 'add-destination' })}
              onOpenEditModal={(destination) => navigateTo({ type: 'edit-destination', destination })}
            />
          )}
          {activeSection === 'participants' && (
            <AdventureParticipantsSection
              adventure={adventure}
              onSuccess={handleRefresh}
              onOpenAddModal={() => navigateTo({ type: 'add-participant' })}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default EditAdventurePage;
