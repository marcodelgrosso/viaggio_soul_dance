import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { AdventureWithDestinations } from '../types/adventures';
import AdventureInformationSection from './EditAdventure/AdventureInformationSection';
import AdventureDestinationsSection from './EditAdventure/AdventureDestinationsSection';
import AdventureParticipantsSection from './EditAdventure/AdventureParticipantsSection';
import '../styles/components/EditAdventurePage.scss';

interface EditAdventurePageProps {
  adventureId: string;
  onBack: () => void;
}

type Section = 'information' | 'destinations' | 'participants';

const EditAdventurePage: React.FC<EditAdventurePageProps> = ({ adventureId, onBack }) => {
  const { user, actualIsSuperAdmin } = useAuth();
  const [adventure, setAdventure] = useState<AdventureWithDestinations | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>('information');
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    loadAdventureData();
  }, [adventureId, user]);

  const loadAdventureData = async () => {
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
          // Se non può modificare, torna indietro
          alert('Non hai i permessi per modificare questa avventura');
          onBack();
          return;
        }
      }

      // Carica le destinazioni (solo per la sezione destinations)
      const { data: destinationsData } = await supabase
        .from('adventure_destinations')
        .select('*')
        .eq('adventure_id', adventureId)
        .order('order_index', { ascending: true });

      // Carica i partecipanti (solo per la sezione participants)
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
          };
        })
      );

      // Ottieni email dei partecipanti
      const participantsWithEmails = await Promise.all(
        (participantsData || []).map(async (participant) => {
          try {
            const { data: userEmail } = await supabase.rpc(
              'get_user_email_by_id',
              { user_uuid: participant.user_id }
            );
            return {
              ...participant,
              user_email: userEmail || 'Email non disponibile',
            };
          } catch (err) {
            return { ...participant, user_email: 'Email non disponibile' };
          }
        })
      );

      setAdventure({
        ...adventureData,
        destinations: destinationsWithPlaces,
        creators: creatorsData || [],
        participants: participantsWithEmails,
      });
    } catch (error) {
      console.error('Errore nel caricamento dell\'avventura:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAdventureData();
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
              onClick={() => setActiveSection('information')}
            >
              <i className="fas fa-info-circle"></i>
              <span>Informazioni</span>
            </button>
            <button
              className={`nav-item ${activeSection === 'destinations' ? 'active' : ''}`}
              onClick={() => setActiveSection('destinations')}
            >
              <i className="fas fa-map"></i>
              <span>Destinazioni</span>
            </button>
            <button
              className={`nav-item ${activeSection === 'participants' ? 'active' : ''}`}
              onClick={() => setActiveSection('participants')}
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
            />
          )}
          {activeSection === 'participants' && (
            <AdventureParticipantsSection
              adventure={adventure}
              onSuccess={handleRefresh}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default EditAdventurePage;

