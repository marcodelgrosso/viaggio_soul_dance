import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Adventure, AdventurePlace, AdventureWithPlaces } from '../types/adventures';
import CreateAdventureModal from './CreateAdventureModal';
import '../styles/components/AdventuresManager.scss';

const AdventuresManager: React.FC = () => {
  const { user, hasPermission, isSuperAdmin, actualIsSuperAdmin, permissions } = useAuth();
  const [adventures, setAdventures] = useState<AdventureWithPlaces[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAdventure, setSelectedAdventure] = useState<AdventureWithPlaces | null>(null);

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

      // Per ogni avventura, carica i luoghi
      const adventuresWithPlaces = await Promise.all(
        (adventuresData || []).map(async (adventure: Adventure) => {
          const { data: placesData } = await supabase
            .from('adventure_places')
            .select('*')
            .eq('adventure_id', adventure.id)
            .order('order_index', { ascending: true });

          return {
            ...adventure,
            places: placesData || [],
            creators: [], // Caricato separatamente se necessario
          };
        })
      );

      setAdventures(adventuresWithPlaces);
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

              <div className="adventure-places">
                <h4>
                  <i className="fas fa-map-marker-alt"></i>
                  Luoghi ({adventure.places.length})
                </h4>
                <ul>
                  {adventure.places.map((place, index) => (
                    <li key={place.id}>
                      <span className="place-number">{index + 1}.</span>
                      <div>
                        <strong>{place.name}</strong>
                        {place.description && <span className="place-desc">{place.description}</span>}
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
                <button className="view-adventure-btn">
                  <i className="fas fa-eye"></i>
                  Visualizza
                </button>
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
    </div>
  );
};

export default AdventuresManager;

