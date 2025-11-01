import { supabase } from './supabase';

/**
 * Ottiene il nome completo dell'utente (Nome Cognome) o l'email come fallback
 */
export const getUserDisplayName = async (userId: string): Promise<string> => {
  try {
    // Prima cerca il profilo utente
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('user_id', userId)
      .maybeSingle(); // Usa maybeSingle invece di single per gestire meglio i casi in cui non esiste

    // Se c'è un errore 406 (RLS) o altri errori, gestiscili gracefully
    if (profileError) {
      // Se è un errore 406 o permission denied, prova con la funzione RPC
      const errorStatus = 'status' in profileError ? (profileError as any).status : undefined;
      if (errorStatus === 406 || profileError.code === '42501' || 
          profileError.message?.includes('permission denied')) {
        console.warn('Errore RLS nel caricamento profilo, uso RPC:', profileError);
        // Prova con la funzione RPC che bypassa RLS
        try {
          const { data: profileRpc } = await supabase.rpc(
            'get_user_profile',
            { user_uuid: userId }
          );
          if (profileRpc && profileRpc.length > 0) {
            const p = profileRpc[0];
            const firstName = p.first_name?.trim();
            const lastName = p.last_name?.trim();
            if (firstName && lastName) {
              return `${firstName} ${lastName}`;
            } else if (firstName || lastName) {
              return firstName || lastName || '';
            }
          }
        } catch (rpcErr) {
          console.warn('Errore anche con RPC:', rpcErr);
        }
      } else if (profileError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, è normale
        console.warn('Errore nel caricamento profilo:', profileError);
      }
    }

    // Se il profilo esiste e ha nome e cognome, restituiscili
    if (profile) {
      const firstName = profile.first_name?.trim();
      const lastName = profile.last_name?.trim();
      
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      } else if (firstName) {
        return firstName;
      } else if (lastName) {
        return lastName;
      }
    }

    // Fallback: usa l'email
    const { data: userEmail } = await supabase.rpc(
      'get_user_email_by_id',
      { user_uuid: userId }
    );

    return userEmail || 'Email non disponibile';
  } catch (err) {
    console.error('Errore nel caricamento del nome utente:', err);
    // Fallback finale: prova a ottenere almeno l'email
    try {
      const { data: userEmail } = await supabase.rpc(
        'get_user_email_by_id',
        { user_uuid: userId }
      );
      return userEmail || 'Utente sconosciuto';
    } catch {
      return 'Utente sconosciuto';
    }
  }
};

/**
 * Carica email e nome completo per un partecipante
 */
export const enrichParticipant = async (participant: any) => {
  try {
    // Carica il profilo utente
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('user_id', participant.user_id)
      .maybeSingle(); // Usa maybeSingle invece di single
    
    // Se c'è un errore RLS, prova con la funzione RPC
    let profileData = profile;
    const errorStatus = profileError && 'status' in profileError ? (profileError as any).status : undefined;
    if (profileError && (errorStatus === 406 || profileError.code === '42501')) {
      try {
        const { data: profileRpc } = await supabase.rpc(
          'get_user_profile',
          { user_uuid: participant.user_id }
        );
        if (profileRpc && profileRpc.length > 0) {
          profileData = profileRpc[0];
        }
      } catch (rpcErr) {
        console.warn('Errore RPC per enrichParticipant:', rpcErr);
      }
    }

    // Carica l'email
    const { data: userEmail } = await supabase.rpc(
      'get_user_email_by_id',
      { user_uuid: participant.user_id }
    );

    const firstName = profileData?.first_name?.trim();
    const lastName = profileData?.last_name?.trim();
    const displayName = firstName && lastName 
      ? `${firstName} ${lastName}`
      : firstName || lastName || userEmail || 'Email non disponibile';

    return {
      ...participant,
      user_email: userEmail || 'Email non disponibile',
      display_name: displayName,
      first_name: firstName,
      last_name: lastName,
    };
  } catch (err) {
    console.error('Errore nell\'arricchimento del partecipante:', err);
    // Fallback: almeno l'email
    try {
      const { data: userEmail } = await supabase.rpc(
        'get_user_email_by_id',
        { user_uuid: participant.user_id }
      );
      return {
        ...participant,
        user_email: userEmail || 'Email non disponibile',
        display_name: userEmail || 'Email non disponibile',
      };
    } catch {
      return {
        ...participant,
        user_email: 'Email non disponibile',
        display_name: 'Email non disponibile',
      };
    }
  }
};

