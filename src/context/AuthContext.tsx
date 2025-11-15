import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { UserRole, UserPermission } from '../types/permissions';
import {
  logAccessEvent,
  rememberLoginTimestamp,
  consumeSessionDurationSeconds,
} from '../lib/accessLogs';

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
  selectedRole: 'platform_user' | 'platform_superadmin' | null;
  selectRole: (role: 'platform_user' | 'platform_superadmin') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Email superadmin - puoi cambiarla in base alle tue esigenze
const SUPERADMIN_EMAIL = 'marco.delgrosso88@gmail.com';

const AUTH_DEBUG = import.meta.env.DEV;
const debugLog = (...args: unknown[]) => {
  if (AUTH_DEBUG) {
    console.log(...args);
  }
};

const PLATFORM_SUPERADMIN: UserRole = 'platform_superadmin';
const PLATFORM_USER: UserRole = 'platform_user';

const ALL_PERMISSIONS: UserPermission[] = [
  'perm_manage_travel',
  'perm_manage_budget',
  'perm_view_statistics',
  'perm_create_adventures',
];

const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  superadmin: PLATFORM_SUPERADMIN,
  user: PLATFORM_USER,
  platform_superadmin: PLATFORM_SUPERADMIN,
  platform_user: PLATFORM_USER,
};

const LEGACY_PERMISSION_MAP: Record<string, UserPermission> = {
  travel_editor: 'perm_manage_travel',
  prices_editor: 'perm_manage_budget',
  view_statistics: 'perm_view_statistics',
  is_creator: 'perm_create_adventures',
  perm_manage_travel: 'perm_manage_travel',
  perm_manage_budget: 'perm_manage_budget',
  perm_view_statistics: 'perm_view_statistics',
  perm_create_adventures: 'perm_create_adventures',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'platform_user' | 'platform_superadmin' | null>(null);

  // Carica ruolo e permessi dell'utente
  const loadUserRoleAndPermissions = async (userId: string, userEmail?: string | null) => {
    try {
      debugLog('[AuthContext] loadUserRoleAndPermissions start', userId);
      // Prima controlla se l'email è quella del superadmin
      const emailToCheck = userEmail ?? user?.email ?? null;
      if (emailToCheck && emailToCheck.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
        setRole(PLATFORM_SUPERADMIN);
        setPermissions(ALL_PERMISSIONS);
        setLoading(false);
        debugLog('[AuthContext] loadUserRoleAndPermissions superadmin shortcut', userId);
        return;
      }

      // Carica ruolo dal database (gestisce gracefully se la tabella non esiste)
      let roleData: { role: string } | null = null;
      let roleError: any = null;

      try {
        debugLog('[AuthContext] loadUserRoleAndPermissions querying user_roles', userId);
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle<{ role: string }>();
        debugLog('[AuthContext] loadUserRoleAndPermissions user_roles result', { data, error });

        roleData = data ? { role: data.role } : null;
        roleError = error;
      } catch (err) {
        roleError = err;
        console.warn(
          '[AuthContext] Errore nel caricamento ruolo (eccezione durante query):',
          err,
        );
      }

      if (roleError) {
        console.warn('[AuthContext] Errore nel caricamento ruolo (post query):', roleError);
      }

      // Gestisce errori 406 (Not Acceptable) che possono verificarsi con problemi RLS
      if (roleError) {
        // PGRST116 = no rows returned, ignoriamo se non esiste ancora un ruolo
        // 406 = Not Acceptable (spesso causato da RLS)
        // 42501 = permission denied
        // 42P01 = relation does not exist
        const errorStatus = 'status' in roleError ? (roleError as any).status : undefined;
        const errorStatusCode = 'statusCode' in roleError ? (roleError as any).statusCode : undefined;
        if (roleError.code === 'PGRST116' || 
            roleError.code === '42501' || 
            roleError.code === '42P01' ||
            roleError.message?.includes('relation') || 
            roleError.message?.includes('permission denied') || 
            roleError.message?.includes('does not exist') ||
            errorStatus === 406 ||
            errorStatusCode === 406) {
          // Errori comuni che possiamo ignorare - l'utente avrà ruolo 'user' di default
          if (roleError.code !== 'PGRST116' && errorStatus !== 406 && errorStatusCode !== 406) {
            console.warn('Errore nel caricamento ruolo (ignorato):', roleError.code, roleError.message);
          }
        } else {
          console.warn('Errore nel caricamento ruolo:', roleError.code, roleError.message);
        }
      }

      // Se non c'è un ruolo nel database, crealo automaticamente come ruolo utente
      let userRole: UserRole = roleData?.role ? LEGACY_ROLE_MAP[roleData.role] ?? PLATFORM_USER : PLATFORM_USER;
      
      // Se non esiste un ruolo per l'utente e non c'è stato un errore grave, crealo
      const errorStatus = roleError && 'status' in roleError ? (roleError as any).status : undefined;
      const errorStatusCode = roleError && 'statusCode' in roleError ? (roleError as any).statusCode : undefined;
      if (!roleData && (!roleError || roleError.code === 'PGRST116' || errorStatus === 406 || errorStatusCode === 406)) {
        try {
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role: PLATFORM_USER,
            });
          
          if (!insertError) {
            userRole = PLATFORM_USER;
            debugLog('[AuthContext] loadUserRoleAndPermissions ruolo creato automaticamente', userId);
          } else if (insertError.code !== '23505') { // Ignora se già esiste (unique constraint)
            console.warn('Errore nella creazione automatica del ruolo:', insertError);
          }
        } catch (err) {
          // Ignora errori nella creazione automatica del ruolo
          console.warn('Impossibile creare ruolo automaticamente:', err);
        }
      }

      // Se è superadmin, imposta come superadmin
      if (userRole === PLATFORM_SUPERADMIN) {
        setRole(PLATFORM_SUPERADMIN);
        setPermissions(ALL_PERMISSIONS);
        setLoading(false);
        return;
      } else {
        setRole(userRole);
      }

      // Carica permessi (se la tabella esiste)
      try {
        debugLog('[AuthContext] loadUserRoleAndPermissions querying user_permissions', userId);
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('user_permissions')
          .select('permission')
          .eq('user_id', userId);
        debugLog('[AuthContext] loadUserRoleAndPermissions user_permissions result', {
          permissionsData,
          permissionsError,
        });

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
          const mappedPermissions = (permissionsData || [])
            .map((p: { permission: string }) => LEGACY_PERMISSION_MAP[p.permission])
            .filter(Boolean) as UserPermission[];
          setPermissions(mappedPermissions);
        }
      } catch (permError: any) {
        console.warn('Errore nel tentativo di caricare permessi (tabella potrebbe non esistere):', permError);
        setPermissions([]);
      }
    } catch (error) {
      console.error('Errore nel caricamento di ruolo e permessi:', error);
      // In caso di errore, assegna ruolo base
      if (user?.email === SUPERADMIN_EMAIL || user?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
        setRole(PLATFORM_SUPERADMIN);
        setPermissions(ALL_PERMISSIONS);
      } else {
        setRole(PLATFORM_USER);
        setPermissions([]);
      }
    } finally {
      setLoading(false);
      debugLog('[AuthContext] loadUserRoleAndPermissions end', userId);
    }
  };

  useEffect(() => {
    // Controlla la sessione corrente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserRoleAndPermissions(session.user.id, session.user.email);
      } else {
        setRole(null);
        setPermissions([]);
        setLoading(false);
      }
    });

    // Ascolta i cambiamenti di autenticazione
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      debugLog('[AuthContext] Auth state change', event, {
        hasSession: Boolean(session),
        userId: session?.user?.id,
      });

      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        debugLog('[AuthContext] SIGNED_IN, preparo log accesso', session.user.id);
        rememberLoginTimestamp();
        const provider = session.user.app_metadata?.provider;
        const context = provider
          ? `Login tramite ${provider}`
          : 'Login via credenziali';
        void logAccessEvent({
          action: 'login_success',
          context,
          sessionId: session.access_token ?? null,
        });
      }

      if (session?.user) {
        debugLog('[AuthContext] Carico ruolo e permessi per', session.user.id);
        await loadUserRoleAndPermissions(session.user.id, session.user.email);
        debugLog('[AuthContext] Ruolo e permessi caricati', session.user.id);
        setLoading(false);
      } else {
        debugLog('[AuthContext] Nessuna sessione attiva, reset stato auth');
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

    // Dopo la registrazione, assegna ruolo base di default
    if (!error && data.user) {
      try {
        await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: PLATFORM_USER,
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
      await loadUserRoleAndPermissions(data.user.id, data.user.email);
    }

    return { error };
  };

  const logout = async () => {
    const sessionDurationSeconds = consumeSessionDurationSeconds();
    await logAccessEvent({
      action: 'logout',
      context: 'Logout manuale dalla web app',
      sessionDurationSeconds,
    });

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

  const actualIsSuperAdmin = role === PLATFORM_SUPERADMIN || 
    user?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ||
    user?.email === SUPERADMIN_EMAIL;
  const actualIsAdmin = actualIsSuperAdmin || permissions.includes('perm_view_statistics');

  // Se l'utente è superadmin e ha selezionato un ruolo, usa quello selezionato
  // Altrimenti usa il ruolo reale (per utenti normali o se non ha ancora selezionato)
  const effectiveSelectedRole = actualIsSuperAdmin && selectedRole ? selectedRole : null;
  
  // Se preview mode è attivo, maschera i permessi superadmin
  // Se è superadmin ma ha scelto "user", maschera i permessi
  const useUserMode = previewMode || (actualIsSuperAdmin && effectiveSelectedRole === PLATFORM_USER);
  const isSuperAdmin = useUserMode ? false : (effectiveSelectedRole === PLATFORM_SUPERADMIN || (!effectiveSelectedRole && actualIsSuperAdmin));
  const isAdmin = useUserMode ? false : (isSuperAdmin || (!effectiveSelectedRole && actualIsAdmin));
  const effectivePermissions = useUserMode ? [] : permissions;
  
  const email = user?.email ?? null;

  const togglePreviewMode = () => {
    setPreviewMode(prev => !prev);
    // Salva lo stato nel localStorage per persistenza
    localStorage.setItem('previewMode', String(!previewMode));
  };

  const selectRole = (role: 'platform_user' | 'platform_superadmin') => {
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
    if (savedSelectedRole) {
      const mappedRole = LEGACY_ROLE_MAP[savedSelectedRole];
      if (mappedRole) {
        setSelectedRole(mappedRole);
      }
    }
  }, []);


  const hasPermission = (permission: UserPermission): boolean => {
    // Se preview mode è attivo, nessun permesso
    if (previewMode) {
      return false;
    }
    // Se è superadmin ma ha scelto modalità user, nessun permesso admin
    if (actualIsSuperAdmin && effectiveSelectedRole === PLATFORM_USER) {
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
