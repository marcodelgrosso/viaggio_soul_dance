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
      .single();

    // Se il profilo esiste e ha nome e cognome, restituiscili
    if (!profileError && profile) {
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
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('user_id', participant.user_id)
      .single();

    // Carica l'email
    const { data: userEmail } = await supabase.rpc(
      'get_user_email_by_id',
      { user_uuid: participant.user_id }
    );

    const firstName = profile?.first_name?.trim();
    const lastName = profile?.last_name?.trim();
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

