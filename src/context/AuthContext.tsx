import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { UserRole, UserPermission, UserRoleData } from '../types/permissions';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  email: string | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: UserRole | null;
  permissions: UserPermission[];
  hasPermission: (permission: UserPermission) => boolean;
  loading: boolean;
  // Preview mode (per testare come user normale)
  previewMode: boolean;
  togglePreviewMode: () => void;
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

  // Carica ruolo e permessi dell'utente
  const loadUserRoleAndPermissions = async (userId: string) => {
    try {
      // Prima controlla se l'email è quella del superadmin
      if (user?.email === SUPERADMIN_EMAIL || user?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
        console.log('Superadmin rilevato via email:', user?.email);
        setRole('superadmin');
        setPermissions(['travel_editor', 'prices_editor', 'view_statistics']);
        setLoading(false);
        return;
      }

      // Carica ruolo dal database
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, ignoriamo se non esiste ancora un ruolo
        console.warn('Tabelle ruoli non trovate o errore:', roleError.code);
      }

      const userRole: UserRole = roleData?.role || 'user';

      // Se è superadmin, imposta come superadmin
      if (userRole === 'superadmin') {
        console.log('Superadmin rilevato dal database');
        setRole('superadmin');
        setPermissions(['travel_editor', 'prices_editor', 'view_statistics']);
        setLoading(false);
        return;
      } else {
        setRole(userRole);
      }

      // Carica permessi
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', userId);

      if (permissionsError) {
        console.error('Errore nel caricamento dei permessi:', permissionsError);
        setPermissions([]);
      } else {
        setPermissions((permissionsData || []).map((p: { permission: UserPermission }) => p.permission));
      }
    } catch (error) {
      console.error('Errore nel caricamento di ruolo e permessi:', error);
      // In caso di errore, assegna ruolo base
      if (user?.email === SUPERADMIN_EMAIL || user?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
        console.log('Superadmin rilevato via email (fallback)');
        setRole('superadmin');
        setPermissions(['travel_editor', 'prices_editor', 'view_statistics']);
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
  };

  const actualIsSuperAdmin = role === 'superadmin' || 
    user?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ||
    user?.email === SUPERADMIN_EMAIL;
  const actualIsAdmin = actualIsSuperAdmin || permissions.includes('view_statistics');

  // Se preview mode è attivo, maschera i permessi superadmin
  const isSuperAdmin = previewMode ? false : actualIsSuperAdmin;
  const isAdmin = previewMode ? false : actualIsAdmin;
  const effectivePermissions = previewMode ? [] : permissions;
  
  const email = user?.email ?? null;

  const togglePreviewMode = () => {
    setPreviewMode(prev => !prev);
    // Salva lo stato nel localStorage per persistenza
    localStorage.setItem('previewMode', String(!previewMode));
  };

  // Carica preview mode dal localStorage all'avvio
  useEffect(() => {
    const savedPreviewMode = localStorage.getItem('previewMode');
    if (savedPreviewMode === 'true') {
      setPreviewMode(true);
    }
  }, []);

  // Debug logging
  useEffect(() => {
    if (user && !loading) {
      console.log('Auth State:', {
        email: user.email,
        role,
        isSuperAdmin,
        isAdmin,
        permissions,
      });
    }
  }, [user, role, isSuperAdmin, isAdmin, permissions, loading]);

  const hasPermission = (permission: UserPermission): boolean => {
    // Se preview mode è attivo, nessun permesso
    if (previewMode) {
      return false;
    }
    // Superadmin ha tutti i permessi
    if (actualIsSuperAdmin) {
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
        role,
        permissions: effectivePermissions,
        hasPermission,
        loading,
        previewMode,
        togglePreviewMode,
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
