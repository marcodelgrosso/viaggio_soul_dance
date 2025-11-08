import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Adventure, AdventureWithDestinations } from '../types/adventures';
import CreateAdventureModal from './CreateAdventureModal';
import AddParticipantsModal from './AddParticipantsModal';
import '../styles/components/AdventuresManager.scss';

interface AdventuresManagerProps {
  onViewAdventure?: (adventureId: string) => void;
  onViewVoting?: (adventureId: string) => void;
}

const AdventuresManager: React.FC<AdventuresManagerProps> = ({ onViewAdventure, onViewVoting }) => {
  const { user, hasPermission, actualIsSuperAdmin } = useAuth();
  const [adventures, setAdventures] = useState<AdventureWithDestinations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [adventureForParticipants, setAdventureForParticipants] = useState<string | null>(null);
  const [expandedDestinations, setExpandedDestinations] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAdventures();
    
    // Ascolta gli eventi di cambiamento dello status dell'invito
    const handleStatusChange = () => {
      loadAdventures();
    };
    
    window.addEventListener('adventureStatusChanged', handleStatusChange);
    
    return () => {
      window.removeEventListener('adventureStatusChanged', handleStatusChange);
    };
  }, []);

  const loadAdventures = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setAdventures([]);
        return;
      }


      // Prima carica le avventure dove l'utente è partecipante
      const { data: participantsData, error: participantsError } = await supabase
        .from('adventure_participants')
        .select('adventure_id, invitation_status, user_id')
        .eq('user_id', user.id);

      
      if (participantsError) {
        console.error('Errore nel caricamento delle partecipazioni:', participantsError);
      }

      // Filtra manualmente per includere accepted, pending e null
      const filteredParticipants = (participantsData || []).filter(p => 
        !p.invitation_status || 
        p.invitation_status === 'accepted' || 
        p.invitation_status === 'pending'
      );


      // Raccogli gli ID delle avventure dove l'utente è partecipante o creator
      const participantAdventureIds = filteredParticipants.map(p => p.adventure_id);
      
      // Costruisci la query per includere avventure create dall'utente O dove è partecipante
      let adventuresData: Adventure[] | null = null;
      let adventuresError: any = null;

      if (participantAdventureIds.length > 0) {
        // Esegui due query separate e unisci i risultati
        const [createdResult, participantResult] = await Promise.all([
          supabase
            .from('adventures')
            .select('*')
            .eq('is_active', true)
            .eq('created_by', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('adventures')
            .select('*')
            .eq('is_active', true)
            .in('id', participantAdventureIds)
            .order('created_at', { ascending: false })
        ]);
        
        // Unisci i risultati rimuovendo duplicati
        const allAdventures = [
          ...(createdResult.data || []),
          ...(participantResult.data || [])
        ];
        const uniqueAdventures = Array.from(
          new Map(allAdventures.map(a => [a.id, a])).values()
        ).sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        adventuresData = uniqueAdventures;
        adventuresError = createdResult.error || participantResult.error;
      } else {
        // Altrimenti mostra solo quelle create dall'utente
        const result = await supabase
          .from('adventures')
          .select('*')
          .eq('is_active', true)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });
        
        adventuresData = result.data;
        adventuresError = result.error;
      }

      if (adventuresError) {
        throw adventuresError;
      }


      // Per ogni avventura, carica le destinazioni e i partecipanti
      const adventuresWithDestinations = await Promise.all(
        (adventuresData || []).map(async (adventure: Adventure) => {
          const { data: destinationsData } = await supabase
            .from('adventure_destinations')
            .select('*')
            .eq('adventure_id', adventure.id)
            .order('order_index', { ascending: true });

          const { data: participantsData } = await supabase
            .from('adventure_participants')
            .select('*')
            .eq('adventure_id', adventure.id);

          // Trova lo status dell'invito per questa avventura
          const userParticipant = participantsData?.find(p => p.user_id === user.id);
          let invitationStatus = userParticipant?.invitation_status;
          
          // Se esiste partecipante ma senza status, è accepted (retrocompatibilità)
          if (userParticipant && !invitationStatus) {
            invitationStatus = 'accepted';
          }
          

          // Processa le destinazioni per includere tags (se sono array JSON)
          const processedDestinations = (destinationsData || []).map((dest: any) => ({
            ...dest,
            tags: dest.tags ? (Array.isArray(dest.tags) ? dest.tags : JSON.parse(dest.tags as any)) : [],
          }));

          return {
            ...adventure,
            destinations: processedDestinations,
            creators: [], // Caricato separatamente se necessario
            participants: participantsData || [],
            userInvitationStatus: invitationStatus, // Aggiunto per mostrare lo status
          };
        })
      );

      setAdventures(adventuresWithDestinations);
    } catch (error) {
      console.error('Errore nel caricamento delle avventure:', error);
    } finally {
      setLoading(false);
    }
  };

  // Superadmin ha sempre permesso, anche in modalità user
  const canCreate = hasPermission('perm_create_adventures') || actualIsSuperAdmin;

  return (
    <div className="adventures-manager">
      <div className="adventures-header">
        <h2>
          <i className="fas fa-route"></i>
          Le Mie Avventure
        </h2>
        {canCreate && (
          <button className="create-adventure-btn" onClick={() => setShowCreateModal(true)}>
            <i className="fas fa-plus-circle"></i>
            Nuova Avventura
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="skeleton-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-header">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-badge"></div>
                </div>
                <div className="skeleton-description"></div>
                <div className="skeleton-destinations"></div>
                <div className="skeleton-footer"></div>
              </div>
            ))}
          </div>
        </div>
      ) : adventures.length === 0 ? (
        <div className="no-adventures">
          <div className="empty-state-illustration">
            <i className="fas fa-map-marked-alt"></i>
          </div>
          {canCreate ? (
            <>
              <h3>Inizia la Tua Avventura</h3>
              <p className="empty-state-description">
                Crea la tua prima avventura e inizia a pianificare il tuo viaggio con gli amici!
              </p>
              <button 
                className="empty-state-cta" 
                onClick={() => setShowCreateModal(true)}
              >
                <i className="fas fa-plus-circle"></i>
                Crea Prima Avventura
              </button>
            </>
          ) : (
            <>
              <h3>Nessuna Avventura Ancora</h3>
              <p className="empty-state-description">
                Non partecipi ancora a nessuna avventura. Quando qualcuno ti inviterà, l'avventura apparirà qui.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="adventures-grid">
          {adventures.map((adventure) => {
            const isCreator = adventure.created_by === user?.id;
            const isParticipant = (adventure as any).userInvitationStatus !== null && (adventure as any).userInvitationStatus !== undefined;
            const invitationStatus = (adventure as any).userInvitationStatus;
            
            return (
            <div key={adventure.id} className="adventure-card">
              <div className="adventure-card-header">
                <div className="adventure-header-content">
                  <div className="adventure-header">
                    <h3>{adventure.name}</h3>
                    <div className="adventure-badges">
                      {isCreator && (
                        <span className="creator-badge">
                          <i className="fas fa-crown"></i> Creator
                        </span>
                      )}
                      {isParticipant && !isCreator && (
                        <span className={`participant-badge ${invitationStatus === 'pending' ? 'pending' : 'accepted'}`}>
                          <i className={`fas fa-${invitationStatus === 'pending' ? 'clock' : 'check-circle'}`}></i>
                          {invitationStatus === 'pending' ? 'In attesa' : 'Partecipante'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {adventure.description && (
                    <p className="adventure-description">{adventure.description}</p>
                  )}

                  <div className="adventure-metrics">
                    <span className="metric-item">
                      <i className="fas fa-map-marker-alt"></i>
                      {adventure.destinations.length} {adventure.destinations.length === 1 ? 'Destinazione' : 'Destinazioni'}
                    </span>
                    <span className="metric-item">
                      <i className="fas fa-users"></i>
                      {(adventure.participants || []).length} {(adventure.participants || []).length === 1 ? 'Partecipante' : 'Partecipanti'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="adventure-destinations">
                <button
                  className="destinations-toggle"
                  onClick={() => {
                    const newExpanded = new Set(expandedDestinations);
                    if (newExpanded.has(adventure.id)) {
                      newExpanded.delete(adventure.id);
                    } else {
                      newExpanded.add(adventure.id);
                    }
                    setExpandedDestinations(newExpanded);
                  }}
                >
                  <h4>
                    <i className="fas fa-map"></i>
                    Destinazioni Proposte ({adventure.destinations.length})
                  </h4>
                  <i className={`fas fa-chevron-${expandedDestinations.has(adventure.id) ? 'up' : 'down'}`}></i>
                </button>
                {expandedDestinations.has(adventure.id) && (
                  <div className="destinations-list">
                    {adventure.destinations.length > 0 ? (
                      adventure.destinations.map((destination) => (
                        <div key={destination.id} className="destination-item">
                          {destination.image_url && (
                            <div className="destination-item-image">
                              <img src={destination.image_url} alt={destination.name} />
                            </div>
                          )}
                          <div className="destination-item-content">
                            <strong className="destination-item-name">{destination.name}</strong>
                            {destination.description && (
                              <p className="destination-item-desc">{destination.description}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-destinations">Nessuna destinazione proposta ancora.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="adventure-footer">
                <span className="adventure-date">
                  <i className="fas fa-calendar"></i>
                  {new Date(adventure.created_at).toLocaleDateString('it-IT')}
                </span>
                <div className="adventure-actions">
                  {/* Pulsante per accettare invito se è pending */}
                  {isParticipant && invitationStatus === 'pending' && (
                    <button
                      className="accept-invitation-btn"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!user) return;
                        try {
                          const { error: updateError } = await supabase
                            .from('adventure_participants')
                            .update({ invitation_status: 'accepted' })
                            .eq('adventure_id', adventure.id)
                            .eq('user_id', user.id);
                          
                          if (updateError) {
                            console.error('Errore nell\'accettazione dell\'invito:', updateError);
                            alert('Errore nell\'accettazione dell\'invito. Verifica di avere i permessi necessari.');
                          } else {
                            // Ricarica le avventure
                            loadAdventures();
                            // Emetti evento per aggiornare altri componenti
                            window.dispatchEvent(new CustomEvent('adventureStatusChanged'));
                            alert('Invito accettato con successo!');
                          }
                        } catch (err) {
                          console.error('Errore nell\'accettazione dell\'invito:', err);
                          alert('Errore nell\'accettazione dell\'invito.');
                        }
                      }}
                      title="Accetta invito"
                    >
                      <i className="fas fa-check"></i>
                      Accetta
                    </button>
                  )}
                  <button
                    className="view-adventure-btn"
                    onClick={() => {
                      if (onViewAdventure) {
                        onViewAdventure(adventure.id);
                      }
                    }}
                  >
                    <i className="fas fa-eye"></i>
                    <span>Vedi</span>
                  </button>
                  {onViewVoting && (hasPermission('perm_view_statistics') || actualIsSuperAdmin || adventure.created_by === user?.id || (adventure.participants || []).find((p: any) => p.user_id === user?.id && p.permissions?.can_view_statistics)) && (
                    <button
                      className="view-voting-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewVoting(adventure.id);
                      }}
                    >
                      <i className="fas fa-chart-bar"></i>
                      <span>Voti</span>
                    </button>
                  )}
                  {(adventure.created_by === user?.id || actualIsSuperAdmin) && (
                    <button
                      className="add-participant-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAdventureForParticipants(adventure.id);
                        setShowAddParticipantModal(true);
                      }}
                    >
                      <i className="fas fa-user-plus"></i>
                      <span>Invita</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}

      <CreateAdventureModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadAdventures}
      />

      {adventureForParticipants && (
        <AddParticipantsModal
          isOpen={showAddParticipantModal}
          adventureId={adventureForParticipants}
          currentParticipants={adventures.find(a => a.id === adventureForParticipants)?.participants || []}
          onClose={() => {
            setShowAddParticipantModal(false);
            setAdventureForParticipants(null);
          }}
          onSuccess={loadAdventures}
        />
      )}
    </div>
  );
};

export default AdventuresManager;

