import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Adventure, AdventureWithDestinations } from '../types/adventures';
import CreateAdventureModal from './CreateAdventureModal';
import AddParticipantsModal from './AddParticipantsModal';
import '../styles/components/AdventuresManager.scss';

interface AdventuresManagerProps {
  onViewAdventure?: (adventureId: string) => void;
}

const AdventuresManager: React.FC<AdventuresManagerProps> = ({ onViewAdventure }) => {
  const { user, hasPermission, isSuperAdmin, actualIsSuperAdmin, permissions } = useAuth();
  const [adventures, setAdventures] = useState<AdventureWithDestinations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [adventureForParticipants, setAdventureForParticipants] = useState<string | null>(null);

  useEffect(() => {
    loadAdventures();
  }, []);

  const loadAdventures = async () => {
    try {
      setLoading(true);
      
      // Carica tutte le avventure attive
      const { data: adventuresData, error: adventuresError } = await supabase
        .from('adventures')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

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

          return {
            ...adventure,
            destinations: destinationsData || [],
            creators: [], // Caricato separatamente se necessario
            participants: participantsData || [],
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

  // Debug
  console.log('AdventuresManager debug:', {
    hasPermission: hasPermission('is_creator'),
    isSuperAdmin,
    actualIsSuperAdmin,
    permissions,
  });

  // Superadmin ha sempre permesso, anche in modalità user
  const canCreate = hasPermission('is_creator') || actualIsSuperAdmin;

  if (!canCreate) {
    return (
      <div className="adventures-manager">
        <div className="access-denied">
          <i className="fas fa-lock"></i>
          <p>Non hai il permesso per creare avventure.</p>
          <p>Contatta un amministratore per ottenere il permesso "is_creator".</p>
        </div>
      </div>
    );
  }

  return (
    <div className="adventures-manager">
      <div className="adventures-header">
        <h2>
          <i className="fas fa-route"></i>
          Gestione Avventure
        </h2>
        <button className="create-adventure-btn" onClick={() => setShowCreateModal(true)}>
          <i className="fas fa-plus-circle"></i>
          Nuova Avventura
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Caricamento avventure...</p>
        </div>
      ) : adventures.length === 0 ? (
        <div className="no-adventures">
          <i className="fas fa-map"></i>
          <p>Nessuna avventura creata ancora.</p>
          <p>Crea la tua prima avventura cliccando il pulsante sopra!</p>
        </div>
      ) : (
        <div className="adventures-grid">
          {adventures.map((adventure) => (
            <div key={adventure.id} className="adventure-card">
              <div className="adventure-header">
                <h3>{adventure.name}</h3>
                {adventure.created_by === user?.id && (
                  <span className="creator-badge">
                    <i className="fas fa-user"></i> Creator
                  </span>
                )}
              </div>
              
              {adventure.description && (
                <p className="adventure-description">{adventure.description}</p>
              )}

              <div className="adventure-destinations">
                <h4>
                  <i className="fas fa-map"></i>
                  Destinazioni Proposte ({adventure.destinations.length})
                </h4>
                <ul>
                  {adventure.destinations.map((destination, index) => (
                    <li key={destination.id}>
                      <span className="destination-number">{index + 1}.</span>
                      <div>
                        <strong>{destination.name}</strong>
                        {destination.description && <span className="destination-desc">{destination.description}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="adventure-footer">
                <span className="adventure-date">
                  <i className="fas fa-calendar"></i>
                  {new Date(adventure.created_at).toLocaleDateString('it-IT')}
                </span>
                <div className="adventure-actions">
                  {(adventure.created_by === user?.id || actualIsSuperAdmin) && (
                    <button
                      className="add-participant-icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAdventureForParticipants(adventure.id);
                        setShowAddParticipantModal(true);
                      }}
                      title="Aggiungi partecipante"
                    >
                      <i className="fas fa-user-plus"></i>
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
                    Visualizza
                  </button>
                </div>
              </div>
            </div>
          ))}
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

