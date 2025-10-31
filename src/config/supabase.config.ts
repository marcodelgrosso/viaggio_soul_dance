// Configurazione Supabase
// Configurazione completata per Viaggio Soul Dance

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const SUPABASE_CONFIG: SupabaseConfig = {
  url: 'https://fkfjeunangjkhjlpqito.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrZmpldW5hbmdqa2hqbHBxaXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0OTU3NTIsImV4cCI6MjA3NzA3MTc1Mn0.9bCdKWn4sWQSMC9s5PAQfYFFGOkC6fbm7t_5cpuKTxM'
};

export interface VoteData {
  destination: string;
  vote: 'yes' | 'no';
  comment?: string;
  userId: string;
  userEmail: string;
  timestamp?: string;
}

// Funzione per inviare le votazioni a Supabase (con upsert)
// Usa il client Supabase per l'autenticazione
export async function submitVoteToSupabase(
  voteData: VoteData,
  supabaseClient: any
): Promise<any> {
  try {
    // Ottieni l'utente autenticato dalla sessione Supabase
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error('Utente non autenticato');
    }

    // Usa user_id invece di user_code
    const userId = user.id;
    const userEmail = user.email || voteData.userEmail;

    // Verifica se esiste già un voto usando user_id
    const { data: existingVotes, error: checkError } = await supabaseClient
      .from('destination_votes')
      .select('*')
      .eq('destination_id', voteData.destination)
      .eq('user_id', userId);

    if (checkError) {
      throw checkError;
    }

    if (existingVotes && existingVotes.length > 0) {
      // Aggiorna il voto esistente
      const { data, error: updateError } = await supabaseClient
        .from('destination_votes')
        .update({
          vote_type: voteData.vote,
          comment: voteData.comment || null,
          updated_at: new Date().toISOString(),
        })
        .eq('destination_id', voteData.destination)
        .eq('user_id', userId)
        .select();

      if (updateError) {
        throw updateError;
      }

      return { success: true, message: 'Voto aggiornato', data };
    } else {
      // Inserisci un nuovo voto
      const { data, error: insertError } = await supabaseClient
        .from('destination_votes')
        .insert({
          destination_id: voteData.destination,
          vote_type: voteData.vote,
          comment: voteData.comment || null,
          user_id: userId,
          user_email: userEmail,
        })
        .select();

      if (insertError) {
        throw insertError;
      }

      return { success: true, message: 'Voto inserito', data };
    }
  } catch (error) {
    console.error('Errore nell\'invio a Supabase:', error);
    throw error;
  }
}

// Funzione per ottenere le statistiche delle votazioni
export async function getVoteStatistics() {
  try {
    const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/get_vote_statistics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Errore nel recupero delle statistiche');
    }

    return await response.json();
  } catch (error) {
    console.error('Errore nel recupero delle statistiche:', error);
    return null;
  }
}

// Funzione per ottenere il conteggio delle votazioni per una destinazione
export async function getDestinationVoteCount(destinationId: string): Promise<{ yes: number; no: number; total: number }> {
  try {
    const response = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/destination_votes?destination_id=eq.${destinationId}&select=vote_type`,
      {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Errore nel recupero dei conteggi');
    }

    const votes = await response.json();
    const yesCount = votes.filter((v: any) => v.vote_type === 'yes').length;
    const noCount = votes.filter((v: any) => v.vote_type === 'no').length;

    return { yes: yesCount, no: noCount, total: votes.length };
  } catch (error) {
    console.error('Errore nel recupero dei conteggi:', error);
    return { yes: 0, no: 0, total: 0 };
  }
}


