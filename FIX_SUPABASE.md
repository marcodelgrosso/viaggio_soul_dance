# 🔧 Fix Problema Supabase

## Problema: I voti non vengono salvati

### Soluzione 1: Disattiva Row Level Security (RLS)

Il problema più comune è che Supabase ha attivato RLS (Row Level Security) per default, che blocca le inserzioni.

**Come risolvere:**

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleziona il progetto "Soul_dance_travel"
3. Clicca su **"Table Editor"** nella sidebar
4. Seleziona la tabella **`destination_votes`**
5. Cerca l'icona 🔒 (lucchetto) accanto al nome della tabella
6. Clicca su **"Disable RLS"** o **"Remove RLS policy"**

### Soluzione 2: Crea una Policy RLS permettere insert

Se vuoi mantenere RLS attivo, crea una policy che permetta l'inserimento:

1. Vai su **"Authentication"** → **"Policies"**
2. Seleziona la tabella `destination_votes`
3. Clicca **"New Policy"**
4. Nome: `Allow anonymous inserts`
5. Policy type: `INSERT`
6. Target roles: `anon`
7. Policy definition:
```sql
true
```
8. Clicca **"Save"**

### Soluzione 3: Verifica il codice

Apri la console del browser (F12) e controlla se ci sono errori quando voti:

1. Apri `index.html`
2. Premi **F12** per aprire DevTools
3. Vai nella tab **Console**
4. Clicca "Vota questa destinazione"
5. Inserisci credenziali e vota
6. Controlla se ci sono errori in rosso

Gli errori comuni sono:

**Errore 401/403:**
- Significa che RLS blocca l'accesso → Usa Soluzione 1 o 2

**Errore "column user_code does not exist":**
- La tabella non è stata aggiornata → Esegui `supabase_setup.sql` di nuovo

**Errore "relation destination_votes does not exist":**
- La tabella non esiste → Esegui `supabase_setup.sql`

### Soluzione 4: Usa il file di test

Ho creato `test-supabase-connection.html` per te:

1. Apri il file nel browser
2. Vedi i risultati dei test
3. Il file ti dirà esattamente quale è il problema

## ✅ Checklist per far funzionare le votazioni

- [ ] La tabella `destination_votes` esiste (controlla in Table Editor)
- [ ] RLS è disattivato per la tabella (🔒 icona → Disable RLS)
- [ ] La tabella ha il campo `user_code` (controlla la struttura)
- [ ] Non ci sono errori nella console del browser
- [ ] La password in `auth-config.js` è corretta
- [ ] Gli utenti sono nella lista `allowedUsers`

## 🧪 Test Manuale

Dopo aver applicato le soluzioni, testa:

1. Apri `index.html`
2. Clicca "Vota questa destinazione"
3. Usa:
   - Username: `roberta.denoto` (o qualsiasi altro dalla lista)
   - Password: `SOUL_DANCE_2025` (o quella che hai impostato)
4. Vota
5. Vai su Supabase → Table Editor → `destination_votes`
6. **Dovresti vedere il tuo voto!**

## 💡 Se Nulla Funziona

Esegui questo comando SQL diretto in Supabase per verificare:

```sql
-- Test inserimento manuale
INSERT INTO destination_votes (destination_id, vote_type, user_code, comment)
VALUES ('seville', 'yes', 'test.user', 'Test manuale');

-- Verifica che sia stato inserito
SELECT * FROM destination_votes WHERE user_code = 'test.user';

-- Se funziona, elimina il test
DELETE FROM destination_votes WHERE user_code = 'test.user';
```

Se questo comando funziona ma l'applicazione no, il problema è nel codice JavaScript.

