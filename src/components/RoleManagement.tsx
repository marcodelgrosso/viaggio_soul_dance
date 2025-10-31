import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { UserRole, UserPermission } from '../types/permissions';
import '../styles/components/RoleManagement.scss';

interface UserWithRole {
  id: string;
  email: string;
  role: UserRole | null;
  permissions: UserPermission[];
}

const RoleManagement: React.FC = () => {
  const { isSuperAdmin, role, email } = useAuth();
  
  // Debug
  console.log('RoleManagement render:', { isSuperAdmin, role, email });
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [selectedPermissions, setSelectedPermissions] = useState<UserPermission[]>([]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadUsers();
    }
  }, [isSuperAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Carica tutti gli utenti da auth.users (tramite funzione custom o view)
      // Nota: Supabase non permette di query diretta su auth.users
      // Dobbiamo usare una funzione RPC o una vista
      
      // Carica ruoli esistenti
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      // Carica permessi esistenti
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('*');

      if (rolesError) {
        console.error('Errore nel caricamento dei ruoli:', rolesError);
      }

      if (permissionsError) {
        console.error('Errore nel caricamento dei permessi:', permissionsError);
      }

      // Crea una mappa di userId -> permissions
      const permissionsMap: { [key: string]: UserPermission[] } = {};
      (permissionsData || []).forEach((p: any) => {
        if (!permissionsMap[p.user_id]) {
          permissionsMap[p.user_id] = [];
        }
        permissionsMap[p.user_id].push(p.permission as UserPermission);
      });

      // Combina ruoli con permessi
      const usersList: UserWithRole[] = (rolesData || []).map((r: any) => ({
        id: r.user_id,
        email: '', // L'email dovrà essere caricata da una vista o funzione custom
        role: r.role as UserRole,
        permissions: permissionsMap[r.user_id] || [],
      }));

      setUsers(usersList);
    } catch (error) {
      console.error('Errore nel caricamento degli utenti:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserWithRole) => {
    setEditingUserId(user.id);
    setSelectedRole(user.role || 'user');
    setSelectedPermissions([...user.permissions]);
  };

  const handleSaveUser = async () => {
    if (!editingUserId) return;

    try {
      // Aggiorna ruolo
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: editingUserId,
          role: selectedRole,
        });

      if (roleError) {
        throw roleError;
      }

      // Rimuovi permessi esistenti
      const { error: deleteError } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', editingUserId);

      if (deleteError) {
        throw deleteError;
      }

      // Inserisci nuovi permessi
      if (selectedPermissions.length > 0) {
        const permissionsToInsert = selectedPermissions.map(perm => ({
          user_id: editingUserId,
          permission: perm,
        }));

        const { error: insertError } = await supabase
          .from('user_permissions')
          .insert(permissionsToInsert);

        if (insertError) {
          throw insertError;
        }
      }

      alert('Ruolo e permessi aggiornati con successo!');
      setEditingUserId(null);
      loadUsers();
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error);
      alert('Errore nell\'aggiornamento dei ruoli e permessi');
    }
  };

  const togglePermission = (permission: UserPermission) => {
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
    } else {
      setSelectedPermissions([...selectedPermissions, permission]);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="role-management">
        <div className="access-denied">
          <i className="fas fa-lock"></i>
          <p>Accesso negato. Solo i superadmin possono gestire ruoli e permessi.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="role-management">
      <div className="role-management-header">
        <h2>
          <i className="fas fa-user-shield"></i>
          Gestione Ruoli e Permessi
        </h2>
        <button className="refresh-btn" onClick={loadUsers}>
          <i className="fas fa-sync-alt"></i>
          Aggiorna
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Caricamento utenti...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="no-users">
          <i className="fas fa-users"></i>
          <p>Nessun utente trovato. Gli utenti verranno visualizzati qui dopo la registrazione.</p>
        </div>
      ) : (
        <div className="users-list">
          {users.map(user => (
            <div key={user.id} className="user-card">
              {editingUserId === user.id ? (
                <div className="user-edit-form">
                  <div className="form-group">
                    <label>Ruolo:</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    >
                      <option value="user">User</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Permessi:</label>
                    <div className="permissions-list">
                      {(['travel_editor', 'prices_editor', 'view_statistics'] as UserPermission[]).map(perm => (
                        <label key={perm} className="permission-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm)}
                            onChange={() => togglePermission(perm)}
                            disabled={selectedRole === 'superadmin'}
                          />
                          <span>
                            {perm === 'travel_editor' && '✏️ Editor Viaggi'}
                            {perm === 'prices_editor' && '💰 Editor Prezzi'}
                            {perm === 'view_statistics' && '📊 Visualizza Statistiche'}
                          </span>
                        </label>
                      ))}
                    </div>
                    {selectedRole === 'superadmin' && (
                      <p className="info-text">
                        <i className="fas fa-info-circle"></i>
                        I superadmin hanno automaticamente tutti i permessi.
                      </p>
                    )}
                  </div>

                  <div className="form-actions">
                    <button className="save-btn" onClick={handleSaveUser}>
                      <i className="fas fa-check"></i>
                      Salva
                    </button>
                    <button className="cancel-btn" onClick={() => setEditingUserId(null)}>
                      <i className="fas fa-times"></i>
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="user-info">
                    <div className="user-id">
                      <i className="fas fa-user"></i>
                      <span>{user.id.substring(0, 8)}...</span>
                    </div>
                    <div className="user-role">
                      <span className={`role-badge role-${user.role}`}>
                        {user.role === 'superadmin' ? '👑 Superadmin' : '👤 User'}
                      </span>
                    </div>
                  </div>

                  {user.permissions.length > 0 && (
                    <div className="user-permissions">
                      <strong>Permessi:</strong>
                      <div className="permissions-tags">
                        {user.permissions.map(perm => (
                          <span key={perm} className="permission-tag">
                            {perm === 'travel_editor' && '✏️ Editor Viaggi'}
                            {perm === 'prices_editor' && '💰 Editor Prezzi'}
                            {perm === 'view_statistics' && '📊 Visualizza Statistiche'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button className="edit-btn" onClick={() => handleEditUser(user)}>
                    <i className="fas fa-edit"></i>
                    Modifica
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="role-management-info">
        <h3>
          <i className="fas fa-info-circle"></i>
          Note
        </h3>
        <ul>
          <li>I <strong>Superadmin</strong> hanno automaticamente tutti i permessi</li>
          <li>Gli utenti <strong>User</strong> possono avere permessi specifici assegnati</li>
          <li>I permessi disponibili sono:
            <ul>
              <li><strong>travel_editor</strong>: Modificare le destinazioni di viaggio</li>
              <li><strong>prices_editor</strong>: Modificare i prezzi</li>
              <li><strong>view_statistics</strong>: Visualizzare le statistiche</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RoleManagement;

