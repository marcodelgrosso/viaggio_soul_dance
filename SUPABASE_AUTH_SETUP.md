# 🔐 Setup Autenticazione Supabase

Questa guida ti aiuterà a configurare l'autenticazione email/password con Supabase.

## 📋 Prerequisiti

- Account Supabase attivo
- Progetto Supabase configurato
- Accesso alla dashboard Supabase

## 🚀 Passo 1: Abilitare Email Authentication in Supabase

1. Vai alla [Dashboard Supabase](https://supabase.com/dashboard)
2. Seleziona il tuo progetto
3. Vai su **Authentication** → **Providers**
4. Assicurati che **Email** sia abilitato
5. (Opzionale) Configura le opzioni:
   - **Enable email confirmations**: Decidi se richiedere la conferma email
   - **Secure email change**: Abilita per cambi email sicuri
   - **Double confirm email changes**: Doppia conferma per sicurezza

## 🗄️ Passo 2: Aggiornare il Database

Esegui lo script SQL di migrazione nella console SQL di Supabase:

1. Vai su **SQL Editor** nella dashboard
2. Clicca su **New query**
3. Copia e incolla il contenuto di `supabase_migration.sql`
4. Clicca su **RUN** per eseguire

Questo script:
- Aggiunge le colonne `user_id` e `user_email` alla tabella `destination_votes`
- Crea gli indici per migliorare le performance
- Configura le policy RLS (Row Level Security)

## 🔧 Passo 3: Configurare le Policy RLS

Se preferisci gestire le policy manualmente:

### Policy per INSERT (Inserimento voti)
```sql
CREATE POLICY "Users can insert their own votes"
  ON destination_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### Policy per UPDATE (Aggiornamento voti)
```sql
CREATE POLICY "Users can update their own votes"
  ON destination_votes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Policy per SELECT (Visualizzazione voti)
```sql
CREATE POLICY "Users can view all votes"
  ON destination_votes
  FOR SELECT
  TO authenticated
  USING (true);
```

## 👤 Passo 4: Configurare l'Email Admin

Nel file `src/context/AuthContext.tsx`, modifica la costante `ADMIN_EMAIL`:

```typescript
const ADMIN_EMAIL = 'tua-email-admin@example.com';
```

L'utente con questa email avrà accesso alla dashboard admin.

## 📧 Passo 5: Configurare Email Templates (Opzionale)

1. Vai su **Authentication** → **Email Templates**
2. Personalizza i template per:
   - **Confirm signup**: Email di conferma registrazione
   - **Magic Link**: Link magico per login
   - **Change Email Address**: Cambio email
   - **Reset Password**: Reset password

## ✅ Testare l'Autenticazione

1. Avvia l'applicazione: `npm run dev`
2. Clicca su "Registrati"
3. Inserisci email e password
4. Controlla la tua email per la conferma (se abilitata)
5. Accedi con le tue credenziali

## 🔒 Sicurezza

- **Password Requirements**: Supabase richiede password di almeno 6 caratteri di default
- **Email Verification**: Considera di abilitare la verifica email per maggiore sicurezza
- **RLS Policies**: Le policy assicurano che gli utenti possano modificare solo i propri voti
- **JWT Tokens**: Supabase usa JWT per l'autenticazione, automaticamente gestiti dal client

## 🐛 Troubleshooting

### Errore: "Email already registered"
- L'email è già stata registrata. Usa "Accedi" invece di "Registrati"

### Errore: "Invalid login credentials"
- Verifica di aver inserito email e password corretti
- Controlla se l'account è stato confermato (se la verifica email è abilitata)

### Errore: "New row violates row-level security policy"
- Le policy RLS non sono configurate correttamente
- Esegui di nuovo lo script `supabase_migration.sql`

### I voti non vengono salvati
- Verifica che le colonne `user_id` e `user_email` esistano nella tabella
- Controlla le policy RLS nella dashboard Supabase

## 📝 Note Importanti

1. **Migrazione dati**: Se hai voti esistenti con `user_code`, dovrai migrarli manualmente al nuovo sistema
2. **Email Admin**: L'email admin deve corrispondere esattamente all'email dell'utente Supabase
3. **Sessione**: La sessione viene mantenuta automaticamente dal client Supabase
4. **Logout**: Il logout cancella la sessione locale e sul server

## 🔄 Migrazione da Sistema Precedente

Se avevi utenti nel sistema vecchio:

1. Esporta i dati esistenti dalla tabella `destination_votes`
2. Crea account Supabase per ogni utente
3. Migra i dati collegando `user_code` al nuovo `user_id`
4. Esegui uno script di migrazione personalizzato

Per assistenza aggiuntiva, consulta la [documentazione Supabase Auth](https://supabase.com/docs/guides/auth).

