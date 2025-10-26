# 🔐 Configurazione Sistema di Autenticazione

## ✅ Cosa è già stato fatto

1. **Database aggiornato** con campo `user_code` per identificare chi vota
2. **Modal di votazione** aggiornato con campi per username e password
3. **Validazione automatica** delle credenziali prima di votare
4. **Sistema di aggiornamento voto** - se una persona vota di nuovo la stessa destinazione, il voto viene aggiornato

## 📝 Cosa devi fare ora

### 1️⃣ Aggiorna `auth-config.js` con i tuoi utenti

Apri il file `auth-config.js` e modifica:

```javascript
const AUTH_CONFIG = {
    // CAMBIA QUESTA PASSWORD CON UNA TUA PERSONALE
    globalPassword: 'SOUL2024', // ⬅️ CAMBIA QUESTA!
    
    // AGGIUNGI QUI I 7 CODICI DEI TUOI AMICI
    allowedUsers: [
        'marco.rossi',      // 👈 Esempi - rimuovili
        'lucia.bianchi',    // 👈 Esempi - rimuovili
        'andrea.verdi',     // 👈 Esempi - rimuovili
        'chiara.neri',      // 👈 Esempi - rimuovili
        'sara.rossi',       // 👈 Esempi - rimuovili
        'francesco.blu',    // 👈 Esempi - rimuovili
        'elena.gialli',     // 👈 Esempi - rimuovili
        // Aggiungi qui i veri codici, ad esempio:
        // 'giulia.verdi',
        // 'paolo.rossi',
        // etc...
    ]
};
```

**ESEMPIO:**

Se i tuoi amici sono:
- Mario Rossi → codice: `mario.rossi`
- Lucia Bianchi → codice: `lucia.bianchi`
- etc.

Il file diventerà:

```javascript
const AUTH_CONFIG = {
    globalPassword: 'SOUL2024', // ⬅️ CAMBIA QUESTA!
    
    allowedUsers: [
        'mario.rossi',
        'lucia.bianchi',
        'andrea.verdi',
        'chiara.neri',
        'sara.rossi',
        'francesco.blu',
        'elena.gialli'
    ]
};
```

### 2️⃣ Aggiorna le tabelle in Supabase

Devi eseguire il nuovo SQL che ho creato:

1. Vai su [supabase.com/dashboard](https://supabase.com/dashboard)
2. Seleziona il progetto "Soul_dance_travel"
3. Vai su **SQL Editor**
4. Clicca **New query**
5. Copia tutto il contenuto dal file **`supabase_setup.sql`**
6. Incolla ed esegui (clicca RUN o premi F5)

⚠️ **Nota:** Se hai già eseguito il file precedente, devi eseguire questa query per aggiornare la tabella:

```sql
-- Aggiorna la tabella esistente
ALTER TABLE destination_votes 
ADD COLUMN IF NOT EXISTS user_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Aggiungi il vincolo UNIQUE (se non esiste)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'destination_votes_destination_id_user_code_key'
    ) THEN
        ALTER TABLE destination_votes 
        ADD CONSTRAINT destination_votes_destination_id_user_code_key 
        UNIQUE(destination_id, user_code);
    END IF;
END $$;

-- Crea il trigger se non esiste
CREATE TRIGGER IF NOT EXISTS update_destination_votes_updated_at
    BEFORE UPDATE ON destination_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3️⃣ Testa il sistema

1. Apri `index.html` nel browser
2. Clicca "Vota questa destinazione" su una card
3. Inserisci un codice utente dalla tua lista (es: `mario.rossi`)
4. Inserisci la password che hai impostato
5. Clicca Sì o No e invia
6. Verifica che funzioni!

### 4️⃣ Invia il link agli amici

Condividi con i tuoi 7 amici:

**Messaggio da inviare:**

```
Ciao! 🎉

Per votare la tua destinazione preferita per il viaggio Soul Dance:

1. Apri il link: [INSERISCI QUI IL LINK]
2. Clicca "Vota questa destinazione" su una delle 4 destinazioni
3. Inserisci:
   - Il tuo codice: [mario.rossi] ⬅️ PERSONALIZZA PER OGNI AMICO
   - Password: [SOUL2024] ⬅️ CAMBIA CON LA TUA PASSWORD

Puoi votare tutte e 4 le destinazioni! Il voto può essere cambiato.

Grazie! ✈️
```

## 🔒 Sicurezza

- **Password:** Cambiala da `SOUL2024` a qualcosa di sicuro
- **Username:** Usa codici come `nome.cognome` (es: `mario.rossi`, `lucia.bianchi`)
- **Voto unico:** Ogni persona può votare una volta per destinazione, ma può cambiare voto

## 📊 Come verificare i voti

1. Vai su Supabase Dashboard
2. **Table Editor** → `destination_votes`
3. Vedi tutte le votazioni con:
   - `user_code` (chi ha votato)
   - `destination_id` (quale destinazione)
   - `vote_type` (Sì o No)
   - `comment` (commenti)

## 🎯 Funzionalità

✅ Voto una sola volta per persona per destinazione
✅ Possibilità di cambiare voto
✅ Identificazione chiara di chi ha votato
✅ Nessuna registrazione necessaria
✅ Password condivisa semplice da comunicare

## 🚀 Prossimi passi (facoltativi)

Puoi aggiungere:
- Statistiche visuali dei voti nella homepage
- Export delle votazioni in Excel/CSV
- Dashboard admin per vedere i risultati

Buon divertimento! 🎉✈️

