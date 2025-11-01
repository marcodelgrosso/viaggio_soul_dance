import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { UserRole, UserPermission } from '../types/permissions';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  email: string | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  actualIsSuperAdmin: boolean; // Ruolo reale superadmin (non influenzato da selectedRole)
  role: UserRole | null;
  permissions: UserPermission[];
  hasPermission: (permission: UserPermission) => boolean;
  loading: boolean;
  // Preview mode (per testare come user normale)
  previewMode: boolean;
  togglePreviewMode: () => void;
  // Role selection
  selectedRole: 'user' | 'superadmin' | null;
  selectRole: (role: 'user' | 'superadmin') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Email superadmin - puoi cambiarla in base alle tue esigenze
const SUPERADMIN_EMAIL = 'marco.delgrosso88@gmail.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'user' | 'superadmin' | null>(null);

  // Carica ruolo e permessi dell'utente
  const loadUserRoleAndPermissions = async (userId: string) => {
    try {
      // Prima controlla se l'email è quella del superadmin
      if (user?.email === SUPERADMIN_EMAIL || user?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
        console.log('Superadmin rilevato via email:', user?.email);
        setRole('superadmin');
        setPermissions(['travel_editor', 'prices_editor', 'view_statistics', 'is_creator']);
        setLoading(false);
        return;
      }

      // Carica ruolo dal database (gestisce gracefully se la tabella non esiste)
      let roleData = null;
      let roleError = null;
      
      try {
        const result = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();
        
        roleData = result.data;
        roleError = result.error;
      } catch (err: any) {
        // Se la tabella non esiste o c'è un errore di accesso, ignoralo
        console.warn('Errore nel caricamento ruolo (tabella potrebbe non esistere o accesso negato):', err);
        roleError = { code: 'TABLE_NOT_FOUND', message: err.message };
      }

      if (roleError && roleError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, ignoriamo se non esiste ancora un ruolo
        // Se è un errore di tabella non trovata (42P01), permesso negato (42501), o altro, continua
        if (roleError.code !== '42501' && roleError.code !== '42P01' && 
            !roleError.message?.includes('relation') && 
            !roleError.message?.includes('permission denied') &&
            !roleError.message?.includes('does not exist')) {
          console.warn('Errore nel caricamento ruolo:', roleError.code, roleError.message);
        }
      }

      const userRole: UserRole = roleData?.role || 'user';

      // Se è superadmin, imposta come superadmin
      if (userRole === 'superadmin') {
        console.log('Superadmin rilevato dal database');
        setRole('superadmin');
        setPermissions(['travel_editor', 'prices_editor', 'view_statistics', 'is_creator']);
        setLoading(false);
        return;
      } else {
        setRole(userRole);
      }

      // Carica permessi (se la tabella esiste)
      try {
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('user_permissions')
          .select('permission')
          .eq('user_id', userId);

        if (permissionsError) {
          // Se l'errore è perché la tabella non esiste (42501 o PGRST116), ignoralo
          if (permissionsError.code === 'PGRST116' || permissionsError.code === '42501' || permissionsError.message?.includes('relation') || permissionsError.message?.includes('permission denied')) {
            console.warn('Tabelle permessi non ancora create o accesso negato:', permissionsError.code);
            setPermissions([]);
          } else {
            console.error('Errore nel caricamento dei permessi:', permissionsError);
            setPermissions([]);
          }
        } else {
          setPermissions((permissionsData || []).map((p: { permission: UserPermission }) => p.permission));
        }
      } catch (permError: any) {
        console.warn('Errore nel tentativo di caricare permessi (tabella potrebbe non esistere):', permError);
        setPermissions([]);
      }
    } catch (error) {
      console.error('Errore nel caricamento di ruolo e permessi:', error);
      // In caso di errore, assegna ruolo base
      if (user?.email === SUPERADMIN_EMAIL || user?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
        console.log('Superadmin rilevato via email (fallback)');
        setRole('superadmin');
        setPermissions(['travel_editor', 'prices_editor', 'view_statistics', 'is_creator']);
      } else {
        setRole('user');
        setPermissions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Controlla la sessione corrente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserRoleAndPermissions(session.user.id);
      } else {
        setRole(null);
        setPermissions([]);
        setLoading(false);
      }
    });

    // Ascolta i cambiamenti di autenticazione
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserRoleAndPermissions(session.user.id).then(() => setLoading(false));
      } else {
        setRole(null);
        setPermissions([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    });

    // Dopo la registrazione, assegna ruolo 'user' di default
    if (!error && data.user) {
      try {
        await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: 'user',
          });
      } catch (roleError) {
        console.error('Errore nell\'assegnazione del ruolo:', roleError);
        // Non blocchiamo la registrazione se fallisce l'assegnazione del ruolo
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      await loadUserRoleAndPermissions(data.user.id);
    }

    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setPermissions([]);
    setSelectedRole(null);
    setPreviewMode(false);
    localStorage.removeItem('selectedRole');
    localStorage.removeItem('previewMode');
  };

  const actualIsSuperAdmin = role === 'superadmin' || 
    user?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ||
    user?.email === SUPERADMIN_EMAIL;
  const actualIsAdmin = actualIsSuperAdmin || permissions.includes('view_statistics');

  // Se l'utente è superadmin e ha selezionato un ruolo, usa quello selezionato
  // Altrimenti usa il ruolo reale (per utenti normali o se non ha ancora selezionato)
  const effectiveSelectedRole = actualIsSuperAdmin && selectedRole ? selectedRole : null;
  
  // Se preview mode è attivo, maschera i permessi superadmin
  // Se è superadmin ma ha scelto "user", maschera i permessi
  const useUserMode = previewMode || (actualIsSuperAdmin && effectiveSelectedRole === 'user');
  const isSuperAdmin = useUserMode ? false : (effectiveSelectedRole === 'superadmin' || (!effectiveSelectedRole && actualIsSuperAdmin));
  const isAdmin = useUserMode ? false : (isSuperAdmin || (!effectiveSelectedRole && actualIsAdmin));
  const effectivePermissions = useUserMode ? [] : permissions;
  
  const email = user?.email ?? null;

  const togglePreviewMode = () => {
    setPreviewMode(prev => !prev);
    // Salva lo stato nel localStorage per persistenza
    localStorage.setItem('previewMode', String(!previewMode));
  };

  const selectRole = (role: 'user' | 'superadmin') => {
    setSelectedRole(role);
    localStorage.setItem('selectedRole', role);
    // Reset preview mode quando si cambia ruolo
    setPreviewMode(false);
    localStorage.setItem('previewMode', 'false');
  };

  // Carica preview mode e selected role dal localStorage all'avvio
  useEffect(() => {
    const savedPreviewMode = localStorage.getItem('previewMode');
    if (savedPreviewMode === 'true') {
      setPreviewMode(true);
    }

    const savedSelectedRole = localStorage.getItem('selectedRole');
    if (savedSelectedRole === 'user' || savedSelectedRole === 'superadmin') {
      setSelectedRole(savedSelectedRole as 'user' | 'superadmin');
    }
  }, []);

  // Debug logging
  useEffect(() => {
    if (user && !loading) {
      console.log('Auth State:', {
        email: user.email,
        role,
        selectedRole,
        isSuperAdmin,
        isAdmin,
        permissions: effectivePermissions,
      });
    }
  }, [user, role, selectedRole, isSuperAdmin, isAdmin, effectivePermissions, loading]);

  const hasPermission = (permission: UserPermission): boolean => {
    // Se preview mode è attivo, nessun permesso
    if (previewMode) {
      return false;
    }
    // Se è superadmin ma ha scelto modalità user, nessun permesso admin
    if (actualIsSuperAdmin && effectiveSelectedRole === 'user') {
      return false;
    }
    // Superadmin ha tutti i permessi (solo se ha scelto modalità superadmin)
    if (isSuperAdmin) {
      return true;
    }
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        email,
        signUp,
        signIn,
        logout,
        isAdmin,
        isSuperAdmin,
        actualIsSuperAdmin,
        role,
        permissions: effectivePermissions,
        hasPermission,
        loading,
        previewMode,
        togglePreviewMode,
        selectedRole,
        selectRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
