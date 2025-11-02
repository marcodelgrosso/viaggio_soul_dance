import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AdventureWithDestinations } from '../../types/adventures';
import Tooltip from '../Tooltip';
import { useToast } from '../../hooks/useToast';
import '../../styles/components/EditAdventureSection.scss';

interface AdventureParticipantsSectionProps {
  adventure: AdventureWithDestinations;
  onSuccess: () => void;
  onOpenAddModal: () => void;
  onParticipantPermissionsUpdate?: (userId: string, permissions: { can_view_statistics: boolean; can_edit: boolean; can_view_only: boolean }) => void;
}

const AdventureParticipantsSection: React.FC<AdventureParticipantsSectionProps> = ({
  adventure,
  onSuccess,
  onOpenAddModal,
  onParticipantPermissionsUpdate,
}) => {
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState<string | null>(null); // user_id del partecipante per cui sto salvando
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('detailed'); // Modalità di visualizzazione (default: detailed)

  const handleRemoveParticipant = async (participantId: string, participantName: string) => {
    if (!window.confirm(`Sei sicuro di voler rimuovere ${participantName} dai partecipanti?`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('adventure_participants')
        .delete()
        .eq('id', participantId);

      if (error) {
        throw error;
      }

      showSuccess(`${participantName} rimosso dai partecipanti`);
      onSuccess();
    } catch (error: any) {
      console.error('Errore nella rimozione del partecipante:', error);
      showError('Errore nella rimozione del partecipante');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (
    participantUserId: string,
    permission: 'can_view_statistics' | 'can_edit' | 'can_view_only',
    value: boolean
  ) => {
    setSavingPermissions(participantUserId);
    
    try {
      // Ottieni i permessi attuali
      const participant = adventure.participants?.find(p => p.user_id === participantUserId);
      const currentPermissions = participant?.permissions || {
        can_view_statistics: false,
        can_edit: false,
        can_view_only: true,
      };

      // Aggiorna il permesso
      const updatedPermissions = {
        ...currentPermissions,
        [permission]: value,
      };

      // Se can_edit è true, can_view_only deve essere false (sono mutuamente esclusivi)
      if (permission === 'can_edit' && value) {
        updatedPermissions.can_view_only = false;
      }
      // Se can_view_only è true, can_edit deve essere false
      if (permission === 'can_view_only' && value) {
        updatedPermissions.can_edit = false;
      }

      // Salva o aggiorna i permessi
      const { data: existing, error: checkError } = await supabase
        .from('adventure_participant_permissions')
        .select('id')
        .eq('adventure_id', adventure.id)
        .eq('user_id', participantUserId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        // Aggiorna permessi esistenti
        const { error: updateError } = await supabase
          .from('adventure_participant_permissions')
          .update(updatedPermissions)
          .eq('id', existing.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Crea nuovi permessi
        const { error: insertError } = await supabase
          .from('adventure_participant_permissions')
          .insert({
            adventure_id: adventure.id,
            user_id: participantUserId,
            ...updatedPermissions,
          });

        if (insertError) {
          throw insertError;
        }
      }

      // Aggiorna lo stato locale invece di ricaricare tutto
      if (onParticipantPermissionsUpdate) {
        onParticipantPermissionsUpdate(participantUserId, updatedPermissions);
      } else {
        // Fallback: ricarica solo se non c'è il callback
        onSuccess();
      }
    } catch (error: any) {
      console.error('Errore nell\'aggiornamento dei permessi:', error);
      showError('Errore nell\'aggiornamento dei permessi');
    } finally {
      setSavingPermissions(null);
    }
  };

  return (
    <div className="edit-section">
      <div className="section-header">
        <div className="section-header-content">
          <div>
            <h2>
              <i className="fas fa-users"></i>
              Partecipanti
            </h2>
            <p>Gestisci i partecipanti dell'avventura</p>
          </div>
          <Tooltip content="Aggiungi un nuovo partecipante all'avventura">
            <button
              className="btn btn-secondary add-item-btn"
              onClick={onOpenAddModal}
              aria-label="Aggiungi partecipante"
            >
              <i className="fas fa-user-plus"></i>
              Aggiungi Partecipante
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="participants-list-editable">
        {(adventure.participants || []).length > 0 ? (
          <>
            {/* Separazione Creator e Partecipanti */}
            {(() => {
              const creators = (adventure.participants || []).filter(p => 
                (adventure.creators || []).some(c => c.user_id === p.user_id) || 
                adventure.created_by === p.user_id
              );
              const regularParticipants = (adventure.participants || []).filter(p => 
                !(adventure.creators || []).some(c => c.user_id === p.user_id) && 
                adventure.created_by !== p.user_id
              );

              return (
                <>
                  {/* Sezione Creator */}
                  {creators.length > 0 && (
                    <div className="participants-group">
                      <h3 className="participants-group-title">
                        <i className="fas fa-crown"></i>
                        Creator ({creators.length})
                      </h3>
                      <div className="participants-grid">
                        {creators.map((participant) => (
                          <ParticipantCard
                            key={participant.id}
                            participant={participant}
                            isCreator={true}
                            adventure={adventure}
                            loading={loading}
                            savingPermissions={savingPermissions}
                            handleRemoveParticipant={handleRemoveParticipant}
                            handlePermissionChange={handlePermissionChange}
                            viewMode={viewMode}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sezione Partecipanti */}
                  {regularParticipants.length > 0 && (
                    <div className="participants-group">
                      <div className="participants-group-header">
                        <h3 className="participants-group-title">
                          <i className="fas fa-users"></i>
                          Partecipanti ({regularParticipants.length})
                        </h3>
                        <div className="view-mode-toggle">
                          <Tooltip content="Vista compatta">
                            <button
                              className={`view-mode-btn ${viewMode === 'compact' ? 'active' : ''}`}
                              onClick={() => setViewMode('compact')}
                              aria-label="Vista compatta"
                            >
                              <i className="fas fa-list"></i>
                            </button>
                          </Tooltip>
                          <Tooltip content="Vista dettagliata">
                            <button
                              className={`view-mode-btn ${viewMode === 'detailed' ? 'active' : ''}`}
                              onClick={() => setViewMode('detailed')}
                              aria-label="Vista dettagliata"
                            >
                              <i className="fas fa-th-list"></i>
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                      <div className="participants-grid">
                        {regularParticipants.map((participant) => (
                          <ParticipantCard
                            key={participant.id}
                            participant={participant}
                            isCreator={false}
                            adventure={adventure}
                            loading={loading}
                            savingPermissions={savingPermissions}
                            handleRemoveParticipant={handleRemoveParticipant}
                            handlePermissionChange={handlePermissionChange}
                            viewMode={viewMode}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        ) : (
          <div className="empty-state">
            <i className="fas fa-users"></i>
            <p>Nessun partecipante aggiunto ancora</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente card partecipante separato per migliore organizzazione
interface ParticipantCardProps {
  participant: any;
  isCreator: boolean;
  adventure: AdventureWithDestinations;
  loading: boolean;
  savingPermissions: string | null;
  handleRemoveParticipant: (id: string, name: string) => void;
  handlePermissionChange: (userId: string, permission: 'can_view_statistics' | 'can_edit' | 'can_view_only', value: boolean) => void;
  viewMode: 'compact' | 'detailed';
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  isCreator,
  adventure,
  loading,
  savingPermissions,
  handleRemoveParticipant,
  handlePermissionChange,
  viewMode,
}) => {
  const permissions = participant.permissions || {
    can_view_statistics: false,
    can_edit: false,
    can_view_only: true,
  };

  // Calcola le iniziali per l'avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = participant.display_name || participant.user_email || 'Email non disponibile';
  const initials = displayName !== 'Email non disponibile' ? getInitials(displayName) : '??';
  
  // Determina il tipo di ruolo per i colori
  const getRoleType = () => {
    if (isCreator) return 'creator';
    if (permissions.can_edit) return 'editor';
    if (permissions.can_view_statistics) return 'viewer-stats';
    return 'viewer';
  };

  const roleType = getRoleType();

  // Preset di permessi
  const handlePresetChange = async (preset: 'editor' | 'viewer-stats' | 'viewer-only') => {
    const presets = {
      'editor': { can_view_statistics: true, can_edit: true, can_view_only: false },
      'viewer-stats': { can_view_statistics: true, can_edit: false, can_view_only: false },
      'viewer-only': { can_view_statistics: false, can_edit: false, can_view_only: true },
    };

    const newPermissions = presets[preset];
    
    // Applica tutti i permessi del preset
    for (const [key, value] of Object.entries(newPermissions)) {
      if (value !== permissions[key as keyof typeof permissions]) {
        await handlePermissionChange(
          participant.user_id,
          key as 'can_view_statistics' | 'can_edit' | 'can_view_only',
          value
        );
      }
    }
  };

  return (
    <div className={`participant-card participant-card-${roleType}`}>
      <div className="participant-info">
        <div className="participant-avatar">
          {initials}
        </div>
        <div className="participant-details">
          <h4>
            {displayName}
            {isCreator && (
              <span className="creator-badge" title="Creator dell'avventura">
                <i className="fas fa-crown"></i>
              </span>
            )}
          </h4>
          <p className="participant-date">
            <i className="fas fa-calendar-alt"></i>
            <span>{new Date(participant.created_at).toLocaleDateString('it-IT')}</span>
          </p>
          
          {/* Permessi solo per non-creator - solo in vista dettagliata */}
          {!isCreator && viewMode === 'detailed' && (
            <div className="participant-permissions detailed">
              {/* Visualizza statistiche - checkbox indipendente */}
              <div className="permission-item">
                <label className="permission-toggle">
                  <input
                    type="checkbox"
                    checked={permissions.can_view_statistics}
                    onChange={(e) => handlePermissionChange(participant.user_id, 'can_view_statistics', e.target.checked)}
                    disabled={loading || savingPermissions === participant.user_id}
                  />
                  <span className="permission-label">
                    <i className="fas fa-chart-bar"></i>
                    Visualizza statistiche
                  </span>
                </label>
              </div>

              {/* Switch mutuamente esclusivo: Può modificare vs Solo visualizzazione */}
              <div className="permission-switch-group">
                <label className="permission-switch-label">
                  Tipo di accesso
                </label>
                <div className="permission-switch-wrapper">
                  <label className="permission-switch">
                    <input
                      type="checkbox"
                      checked={permissions.can_edit}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handlePermissionChange(participant.user_id, 'can_edit', true);
                        } else {
                          handlePermissionChange(participant.user_id, 'can_view_only', true);
                        }
                      }}
                      disabled={loading || savingPermissions === participant.user_id}
                    />
                    <span className="switch-slider">
                      <span className="switch-icon-left">
                        <i className="fas fa-eye"></i>
                      </span>
                      <span className="switch-icon-right">
                        <i className="fas fa-edit"></i>
                      </span>
                    </span>
                  </label>
                </div>
              </div>
              
              {savingPermissions === participant.user_id && (
                <div className="saving-indicator">
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Salvataggio...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="participant-actions">
        {!isCreator && (
          <Tooltip content="Rimuovi questo partecipante">
            <button
              className="btn-icon btn-delete"
              onClick={() => handleRemoveParticipant(participant.id, displayName)}
              disabled={loading || savingPermissions === participant.user_id}
              aria-label={`Rimuovi partecipante ${displayName}`}
            >
              <i className="fas fa-times"></i>
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default AdventureParticipantsSection;

