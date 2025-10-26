# Setup Supabase per Viaggio Soul Dance

Questa guida ti aiuterà a configurare Supabase per registrare le votazioni delle destinazioni.

## 📋 Passo 1: Creare un account Supabase

1. Vai su [supabase.com](https://supabase.com)
2. Clicca su "Start your project"
3. Accedi con GitHub o crea un account

## 📋 Passo 2: Creare un nuovo progetto

1. Clicca su "New project"
2. Scegli un nome per il tuo progetto (es: "viaggio-soul-dance")
3. Scegli una password per il database
4. Seleziona una regione vicina a te
5. Clicca su "Create new project"

## 📋 Passo 3: Creare la tabella per le votazioni

1. Una volta creato il progetto, vai su "SQL Editor" nella sidebar
2. Clicca su "New query"
3. Copia e incolla il contenuto del file `supabase_setup.sql`
4. Clicca su "RUN" per eseguire la query
5. Dovresti vedere il messaggio di conferma

## 📋 Passo 4: Ottenere le credenziali API

1. Vai su "Project Settings" nella sidebar
2. Clicca su "API"
3. Copia:
   - **Project URL** (URL del tuo progetto)
   - **anon/public key** (chiave pubblica anonima)

## 📋 Passo 5: Configurare il file JavaScript

Apri il file `supabase-config.js` e sostituisci:

```javascript
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // Sostituisci con il tuo Project URL
    anonKey: 'YOUR_SUPABASE_ANON_KEY' // Sostituisci con la tua anon/public key
};
```

Con i tuoi valori reali, ad esempio:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://xxxxx.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

## 📋 Passo 6: Testare le votazioni

1. Apri la tua applicazione nel browser
2. Clicca su "Vota questa destinazione" su una card
3. Invia una votazione
4. Vai su Supabase → Table Editor → `destination_votes`
5. Dovresti vedere la nuova votazione registrata

## 🔒 Sicurezza

La chiave `anon` è sicura per l'uso nel frontend perché:
- Hai abilitato solo le operazioni di inserimento
- Non può modificare o eliminare dati
- È limitata alle operazioni sulla tabella `destination_votes`

## 📊 Visualizzare le statistiche

Puoi visualizzare le statistiche delle votazioni dal Supabase Dashboard:

1. Vai su "SQL Editor"
2. Crea una nuova query
3. Esegui:

```sql
SELECT * FROM get_vote_statistics();
```

Questo mostrerà per ogni destinazione:
- Numero totale di voti
- Voti positivi (yes)
- Voti negativi (no)
- Percentuale di voti positivi

## 🚀 Funzionalità aggiuntive

### Ottenere il numero di voti per una destinazione

```javascript
const stats = await getDestinationVoteCount('seville');
console.log(stats);
// { yes: 10, no: 2, total: 12 }
```

### Ottenere tutte le statistiche

```javascript
const allStats = await getVoteStatistics();
console.log(allStats);
```

## 📝 Note importanti

1. **Privacy**: Le votazioni sono anonime
2. **Rate limiting**: Puoi configurare limiti nella dashboard di Supabase
3. **Backup**: Supabase effettua backup automatici
4. **Modifiche**: Se hai bisogno di modificare lo schema, puoi farlo dal SQL Editor

## 🆘 Supporto

Se hai problemi:
1. Controlla la console del browser per errori
2. Verifica di aver copiato correttamente le credenziali
3. Assicurati che la tabella sia stata creata correttamente
4. Controlla i logs in Supabase → Logs

## 📱 Prossimi passi

Una volta configurato Supabase, puoi:
- Aggiungere un visualizzatore di statistiche nella homepage
- Mostrare il numero di voti per ogni destinazione
- Creare grafici con le votazioni
- Implementare paginazione per i commenti

