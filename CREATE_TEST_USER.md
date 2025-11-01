# Creazione Utente di Test

Per creare l'utente di test con email `dieselprogres@hotmail.it`, hai diverse opzioni:

## Opzione 1: Supabase Dashboard (CONSIGLIATA)

1. Vai su **Supabase Dashboard**
2. Seleziona il tuo progetto
3. Vai su **Authentication** > **Users**
4. Clicca su **"Add User"** (o "Add user" button)
5. Compila il form:
   - **Email**: `dieselprogres@hotmail.it`
   - **Password**: scegli una password temporanea (es: `TestPassword123!`)
   - **Auto Confirm User**: ✅ Attiva questa opzione (così non serve confermare l'email)
6. Clicca su **"Create User"**

## Opzione 2: Auth Admin API (se hai accesso)

Esegui questo codice JavaScript/TypeScript da una console del browser o da un script Node.js:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SERVICE_ROLE_KEY' // Usa la Service Role Key, NON la anon key
)

const { data, error } = await supabase.auth.admin.createUser({
  email: 'dieselprogres@hotmail.it',
  password: 'TestPassword123!',
  email_confirm: true, // Conferma automatica l'email
})

if (error) {
  console.error('Errore:', error)
} else {
  console.log('Utente creato:', data.user)
}
```

## Opzione 3: Usa la funzione di signup (per test)

Se non hai accesso all'Admin API, puoi creare una pagina temporanea di signup nel tuo app:

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'dieselprogres@hotmail.it',
  password: 'TestPassword123!',
})

// Poi conferma l'utente manualmente dal Dashboard se necessario
```

## Verifica Utente Creato

Dopo aver creato l'utente, verifica che esista:

```sql
SELECT id, email, created_at, confirmed_at
FROM auth.users
WHERE email = 'dieselprogres@hotmail.it';
```

## Nota Importante

⚠️ **Per creare utenti tramite SQL direttamente nella tabella `auth.users` NON è raccomandato** perché:
- Richiede hash della password corretti
- Bypassa i controlli di sicurezza di Supabase
- Potrebbe causare problemi con RLS e altre funzionalità

La **Opzione 1 (Dashboard)** è la più sicura e semplice.

