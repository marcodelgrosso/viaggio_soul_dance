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
import Tooltip from './Tooltip';
import SkeletonScreen from './SkeletonScreen';
import { useToast } from '../hooks/useToast';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
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
  const { showError, showSuccess, showInfo } = useToast();
  const [adventure, setAdventure] = useState<AdventureWithDestinations | null>(null);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
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
    
    // Se hasLoadedRef è false o lastAdventureIdRef è null, forza il reload
    const shouldForceReload = !hasLoadedRef.current || lastAdventureIdRef.current === null;
    
    // Evita di ricaricare se già caricato e i parametri non sono cambiati (solo se non è un forced reload)
    if (!shouldForceReload && 
        hasLoadedRef.current && 
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
          showError('Non hai i permessi per modificare questa avventura');
          setTimeout(() => onBack(), 2000);
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

      // Per ogni destinazione, carica i luoghi e i voti
      // Usa un timestamp per forzare il refresh dalla cache
      const cacheBuster = Date.now();
      const destinationsWithPlaces = await Promise.all(
        (destinationsData || []).map(async (destination) => {
          // Query senza cache per ottenere dati sempre freschi
          // Usa un timestamp unico per evitare cache
          const timestamp = new Date().getTime();
          const { data: placesData, error: placesError } = await supabase
            .from('adventure_destination_places')
            .select('id, destination_id, name, description, order_index, created_at, visit_date')
            .eq('destination_id', destination.id)
            .order('order_index', { ascending: true })
            // Aggiungi un filtro sempre vero con timestamp per bypassare la cache
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Questo è sempre vero ma forza il refresh

          if (placesError) {
            console.error(`Errore nel caricamento dei luoghi per destinazione ${destination.id}:`, placesError);
          }

          // Carica i voti per la destinazione (opzionale, gestisce errori)
          let voteCountYes = 0;
          let voteCountNo = 0;
          try {
            const { data: votesData, error: votesError } = await supabase
              .from('adventure_destination_votes')
              .select('vote_type')
              .eq('destination_id', destination.id);

            if (votesError) {
              // Se c'è un errore (es. RLS, tabella non accessibile), ignora silenziosamente
              console.warn(`Non è stato possibile caricare i voti per la destinazione ${destination.id}:`, votesError);
            } else if (votesData) {
              voteCountYes = votesData.filter(v => v.vote_type === 'yes').length;
              voteCountNo = votesData.filter(v => v.vote_type === 'no').length;
            }
          } catch (error) {
            // Gestisci errori in modo silenzioso per non interrompere il caricamento
            console.warn(`Errore nel caricamento dei voti per destinazione ${destination.id}:`, error);
          }

          return {
            ...destination,
            places: placesData || [],
            vote_count_yes: voteCountYes,
            vote_count_no: voteCountNo,
            // I tags vengono restituiti come array JSON da Supabase
            tags: destination.tags ? (Array.isArray(destination.tags) ? destination.tags : JSON.parse(destination.tags as any)) : [],
          };
        })
      );

      // Arricchisci i partecipanti con email, nome completo e permessi
      const participantsWithEmails = await Promise.all(
        (participantsData || []).map(async (participant) => {
          const enriched = await enrichParticipant(participant);
          
          // Carica i permessi per questo partecipante in questa avventura
          const { data: permissionsData } = await supabase
            .from('adventure_participant_permissions')
            .select('can_view_statistics, can_edit, can_view_only')
            .eq('adventure_id', adventureId)
            .eq('user_id', participant.user_id)
            .maybeSingle(); // Usa maybeSingle perché potrebbero non esistere ancora permessi
          
          return {
            ...enriched,
            permissions: permissionsData || {
              can_view_statistics: false,
              can_edit: false,
              can_view_only: true, // Default: solo visualizzazione
            },
          };
        })
      );

      if (isMountedRef.current) {
        // Crea un nuovo oggetto avventura per forzare il re-render
        const updatedAdventure = {
          ...adventureData,
          destinations: destinationsWithPlaces.map(dest => ({
            ...dest,
            places: dest.places.map(place => ({
              ...place,
              // Assicurati che visit_date sia incluso
              visit_date: (place as any).visit_date || null
            }))
          })),
          creators: creatorsData || [],
          participants: participantsWithEmails,
        };
        
        setAdventure(updatedAdventure);
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

  // Gestione modifiche non salvate
  useUnsavedChanges({
    hasUnsavedChanges,
    onBeforeUnload: () => {
      if (hasUnsavedChanges) {
        showError('Hai modifiche non salvate. Assicurati di salvare prima di uscire.');
      }
    },
  });

  // Shortcut da tastiera
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S o Cmd+S per salvare
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Il salvataggio è gestito dai componenti figli
        showInfo('Usa il pulsante "Salva Modifiche" nella sezione attiva', 2000);
      }
      // Esc per annullare o tornare indietro (solo quando non siamo in fullscreen)
      if (e.key === 'Escape') {
        const isFullscreen = currentPage.type !== 'section';
        if (!isFullscreen) {
          if (hasUnsavedChanges) {
            if (window.confirm('Hai modifiche non salvate. Vuoi davvero uscire?')) {
              setHasUnsavedChanges(false);
              onBack();
            }
          } else {
            onBack();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, onBack, showInfo, currentPage]);

  const handleRefresh = useCallback(() => {
    // Forza il reload ignorando tutti i controlli di cache
    hasLoadedRef.current = false;
    lastAdventureIdRef.current = null;
    lastUserIdRef.current = null;
    loadAdventureData();
    setHasUnsavedChanges(false);
  }, [loadAdventureData]);

  const handleSectionChange = (section: Section) => {
    navigateTo({ type: 'section', section });
  };

  const handleSuccessAndBack = async () => {
    
    // Forza il refresh completo prima di tornare indietro
    hasLoadedRef.current = false;
    lastAdventureIdRef.current = null;
    lastUserIdRef.current = null;
    
    try {
      // Attendi un momento per assicurarsi che il database sia aggiornato
      console.log('Attendo 1 secondo prima del refresh...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Ricarica i dati
      console.log('Eseguendo loadAdventureData...');
      setLoading(true); // Mostra loading durante il refresh
      await loadAdventureData();
      
      // Attendi un altro momento per assicurarsi che i dati siano stati processati e renderizzati
      await new Promise(resolve => setTimeout(resolve, 500));
      
      
      // Torna indietro
      navigateBack();
    } catch (error) {
      console.error('Errore durante il refresh dopo la modifica:', error);
      setLoading(false);
      // Torna indietro comunque anche in caso di errore
      navigateBack();
    }
  };

  if (loading) {
    return (
      <div className="edit-adventure-loading">
        <SkeletonScreen type="form" count={1} />
        <SkeletonScreen type="card" count={2} />
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
          <Tooltip content="Torna alla pagina precedente">
            <button 
              onClick={navigateBack} 
              className="nav-btn"
              disabled={!canGoBack}
              aria-label="Pagina precedente"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
          </Tooltip>
          <Tooltip content="Vai alla pagina successiva">
            <button 
              onClick={navigateForward} 
              className="nav-btn"
              disabled={!canGoForward}
              aria-label="Pagina successiva"
            >
              <i className="fas fa-arrow-right"></i>
            </button>
          </Tooltip>
          <Tooltip content="Chiudi modifica avventura">
            <button 
              onClick={onBack} 
              className="nav-btn close-btn"
              aria-label="Chiudi modifica"
            >
              <i className="fas fa-times"></i>
            </button>
          </Tooltip>
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
            currentParticipants={adventure.participants || []}
            onBack={navigateBack}
            onSuccess={handleSuccessAndBack}
          />
        )}
      </div>
    );
  }

  // Altrimenti mostra il layout normale con sidebar
  const activeSection = currentPage.section;
  
  // Statistiche per la sidebar
  const stats = {
    destinations: adventure?.destinations?.length || 0,
    participants: adventure?.participants?.length || 0,
    totalPlaces: adventure?.destinations?.reduce((sum, d) => sum + (d.places?.length || 0), 0) || 0,
  };

  return (
    <div className="edit-adventure-page">
      <div className="edit-adventure-header">
        <Tooltip content="Torna alla pagina precedente (Esc)">
          <button 
            onClick={onBack} 
            className="back-btn"
            aria-label="Torna indietro"
          >
            <i className="fas fa-arrow-left"></i> Torna Indietro
          </button>
        </Tooltip>
        <h1>
          <i className="fas fa-edit"></i>
          Modifica Avventura: {adventure.name}
        </h1>
        {hasUnsavedChanges && (
          <div className="unsaved-changes-indicator" role="status" aria-live="polite">
            <i className="fas fa-exclamation-circle"></i>
            <span>Modifiche non salvate</span>
          </div>
        )}
      </div>

      <div className="edit-adventure-layout">
        <aside className={`edit-adventure-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Chiudi sidebar' : 'Apri sidebar'}
            aria-expanded={sidebarOpen}
          >
            <i className={`fas ${sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
          </button>
          <nav className="sidebar-nav" aria-label="Navigazione sezioni">
            <button
              className={`nav-item ${activeSection === 'information' ? 'active' : ''}`}
              onClick={() => handleSectionChange('information')}
              aria-label="Sezione Informazioni"
              aria-current={activeSection === 'information' ? 'page' : undefined}
            >
              <i className="fas fa-info-circle"></i>
              <span>Informazioni</span>
            </button>
            <button
              className={`nav-item ${activeSection === 'destinations' ? 'active' : ''}`}
              onClick={() => handleSectionChange('destinations')}
              aria-label={`Sezione Destinazioni (${stats.destinations})`}
              aria-current={activeSection === 'destinations' ? 'page' : undefined}
            >
              <i className="fas fa-map"></i>
              <span>Destinazioni</span>
              {stats.destinations > 0 && (
                <span className="nav-badge">{stats.destinations}</span>
              )}
            </button>
            <button
              className={`nav-item ${activeSection === 'participants' ? 'active' : ''}`}
              onClick={() => handleSectionChange('participants')}
              aria-label={`Sezione Partecipanti (${stats.participants})`}
              aria-current={activeSection === 'participants' ? 'page' : undefined}
            >
              <i className="fas fa-users"></i>
              <span>Partecipanti</span>
              {stats.participants > 0 && (
                <span className="nav-badge">{stats.participants}</span>
              )}
            </button>
          </nav>
          {sidebarOpen && (
            <div className="sidebar-stats" aria-label="Statistiche avventura">
              <div className="stat-item">
                <i className="fas fa-map-marker-alt"></i>
                <span className="stat-label">Luoghi totali</span>
                <span className="stat-value">{stats.totalPlaces}</span>
              </div>
            </div>
          )}
        </aside>

        <main className="edit-adventure-content" role="main">
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
              onParticipantPermissionsUpdate={(userId, permissions) => {
                // Aggiorna solo i permessi del partecipante senza ricaricare tutto
                if (adventure) {
                  setAdventure({
                    ...adventure,
                    participants: (adventure.participants || []).map(p => 
                      p.user_id === userId 
                        ? { ...p, permissions }
                        : p
                    ),
                  });
                }
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default EditAdventurePage;
