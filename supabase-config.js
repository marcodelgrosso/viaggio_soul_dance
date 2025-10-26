// Configurazione Supabase
// Configurazione completata per Viaggio Soul Dance

const SUPABASE_CONFIG = {
    url: 'https://fkfjeunangjkhjlpqito.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrZmpldW5hbmdqa2hqbHBxaXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0OTU3NTIsImV4cCI6MjA3NzA3MTc1Mn0.9bCdKWn4sWQSMC9s5PAQfYFFGOkC6fbm7t_5cpuKTxM'
};

// Esponi come variabile globale
window.SUPABASE_CONFIG = SUPABASE_CONFIG;

// Funzione per inviare le votazioni a Supabase (con upsert)
async function submitVoteToSupabase(voteData) {
    try {
        // Prima verifica se esiste già un voto di questo utente per questa destinazione
        const checkResponse = await fetch(
            `${SUPABASE_CONFIG.url}/rest/v1/destination_votes?destination_id=eq.${voteData.destination}&user_code=eq.${voteData.userCode}`,
            {
                headers: {
                    'apikey': SUPABASE_CONFIG.anonKey,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
                }
            }
        );

        const existingVotes = await checkResponse.json();
        
        if (existingVotes.length > 0) {
            // Aggiorna il voto esistente
            const updateResponse = await fetch(
                `${SUPABASE_CONFIG.url}/rest/v1/destination_votes?destination_id=eq.${voteData.destination}&user_code=eq.${voteData.userCode}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_CONFIG.anonKey,
                        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
                    },
                    body: JSON.stringify({
                        vote_type: voteData.vote,
                        comment: voteData.comment || null,
                        updated_at: new Date().toISOString()
                    })
                }
            );

            if (!updateResponse.ok) {
                throw new Error('Errore nell\'aggiornamento della votazione');
            }

            // Controlla se la risposta ha contenuto prima di fare .json()
            const updateResult = await updateResponse.text();
            if (updateResult) {
                return JSON.parse(updateResult);
            }
            return { success: true, message: 'Voto aggiornato' };
        } else {
            // Inserisci un nuovo voto
            const insertResponse = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/destination_votes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_CONFIG.anonKey,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                    'Prefer': 'return=representation' // Restituisci sempre i dati
                },
                body: JSON.stringify({
                    destination_id: voteData.destination,
                    vote_type: voteData.vote,
                    comment: voteData.comment || null,
                    user_code: voteData.userCode
                })
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                throw new Error(`Errore nell'invio della votazione: ${errorText}`);
            }

            const insertResult = await insertResponse.text();
            if (insertResult) {
                return JSON.parse(insertResult);
            }
            return { success: true, message: 'Voto inserito' };
        }
    } catch (error) {
        console.error('Errore nell\'invio a Supabase:', error);
        throw error;
    }
}

// Funzione per ottenere le statistiche delle votazioni
async function getVoteStatistics() {
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
async function getDestinationVoteCount(destinationId) {
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
        const yesCount = votes.filter(v => v.vote_type === 'yes').length;
        const noCount = votes.filter(v => v.vote_type === 'no').length;

        return { yes: yesCount, no: noCount, total: votes.length };
    } catch (error) {
        console.error('Errore nel recupero dei conteggi:', error);
        return { yes: 0, no: 0, total: 0 };
    }
}

