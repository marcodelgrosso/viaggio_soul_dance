# 🔐 Sistema di Ruoli e Permessi

Questa guida spiega come configurare e utilizzare il sistema di ruoli e permessi implementato nel progetto.

## 📋 Struttura del Sistema

### Ruoli Disponibili

1. **Superadmin** 👑
   - Ha automaticamente tutti i permessi
   - Può gestire ruoli e permessi di tutti gli utenti
   - Accesso completo a tutte le funzionalità

2. **User** 👤
   - Ruolo base per tutti gli utenti registrati
   - Nessun permesso di default
   - I permessi devono essere assegnati manualmente da un superadmin

### Permessi Disponibili

1. **travel_editor** ✏️
   - Permette di modificare le destinazioni di viaggio
   - Editor dei contenuti delle destinazioni

2. **prices_editor** 💰
   - Permette di modificare i prezzi delle destinazioni
   - Gestione costi e tariffe

3. **view_statistics** 📊
   - Permette di visualizzare le statistiche e le votazioni
   - Accesso alla dashboard admin

## 🚀 Setup Iniziale

### Passo 1: Eseguire la Migrazione SQL

1. Vai alla **Supabase Dashboard** → **SQL Editor**
2. Apri e esegui il file `supabase_roles_migration.sql`
3. Questo creerà le tabelle `user_roles` e `user_permissions`

### Passo 2: Assegnare Ruolo Superadmin

Dopo aver creato il tuo account, esegui questa query SQL sostituendo l'email:

```sql
-- Sostituisci 'marco.delgrosso88@gmail.com' con la tua email se diversa
INSERT INTO user_roles (user_id, role)
SELECT id, 'superadmin' 
FROM auth.users 
WHERE email = 'marco.delgrosso88@gmail.com';
```

### Passo 3: Verifica la Configurazione

1. Accedi all'applicazione con il tuo account superadmin
2. Dovresti vedere la sezione "Gestione Ruoli e Permessi" sopra la dashboard
3. Puoi ora assegnare ruoli e permessi agli altri utenti

## 🎯 Come Funziona

### Per gli Utenti Normali

1. Quando un utente si registra, viene automaticamente assegnato il ruolo **user**
2. I permessi devono essere assegnati manualmente da un superadmin
3. Gli utenti possono votare le destinazioni ma non possono modificare contenuti o vedere statistiche (a meno che non abbiano i permessi)

### Per i Superadmin

1. Possono accedere alla sezione "Gestione Ruoli e Permessi"
2. Possono vedere tutti gli utenti registrati
3. Possono modificare ruoli e permessi di qualsiasi utente
4. Hanno automaticamente tutti i permessi

## 📝 Gestione Ruoli e Permessi

### Assegnare un Ruolo

1. Accedi come superadmin
2. Vai alla sezione "Gestione Ruoli e Permessi"
3. Trova l'utente e clicca "Modifica"
4. Seleziona il ruolo desiderato:
   - **User**: Ruolo base, permessi specifici da assegnare
   - **Superadmin**: Tutti i permessi automaticamente

### Assegnare Permessi

1. Con l'utente in modalità modifica
2. Seleziona i permessi desiderati:
   - ☑️ **travel_editor**: Editor destinazioni
   - ☑️ **prices_editor**: Editor prezzi
   - ☑️ **view_statistics**: Visualizza statistiche
3. Nota: I superadmin hanno automaticamente tutti i permessi

## 🔒 Controllo Accessi nel Codice

### Esempio: Verifica Permesso

```typescript
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { hasPermission } = useAuth();

  if (!hasPermission('view_statistics')) {
    return <div>Accesso negato</div>;
  }

  return <div>Contenuto riservato</div>;
};
```

### Esempio: Verifica Ruolo

```typescript
const { isSuperAdmin, isAdmin } = useAuth();

if (isSuperAdmin) {
  // Solo superadmin
}

if (isAdmin) {
  // Superadmin o utenti con view_statistics
}
```

## 🗄️ Struttura Database

### Tabella `user_roles`

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role VARCHAR(50) CHECK (role IN ('superadmin', 'user')),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Tabella `user_permissions`

```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  permission VARCHAR(50) CHECK (
    permission IN ('travel_editor', 'prices_editor', 'view_statistics')
  ),
  created_at TIMESTAMPTZ
);
```

## 🔐 Sicurezza (RLS)

Le tabelle sono protette da Row Level Security (RLS):

- **user_roles**: Gli utenti possono vedere solo il proprio ruolo
- **user_permissions**: Gli utenti possono vedere solo i propri permessi
- Solo i superadmin possono modificare ruoli e permessi

## 📊 Applicazione Permessi

### Dashboard Admin

- Mostrata solo se `hasPermission('view_statistics')` è true
- I superadmin hanno automaticamente accesso

### Editor Destinazioni (da implementare)

- Richiede permesso `travel_editor`
- I superadmin hanno automaticamente accesso

### Editor Prezzi (da implementare)

- Richiede permesso `prices_editor`
- I superadmin hanno automaticamente accesso

## 🐛 Troubleshooting

### Problema: Non vedo la sezione "Gestione Ruoli e Permessi"

**Soluzione**:
1. Verifica di essere loggato come superadmin
2. Controlla che il tuo user_id sia presente in `user_roles` con ruolo 'superadmin'
3. Verifica nella console del browser eventuali errori

### Problema: Non posso modificare ruoli

**Soluzione**:
1. Verifica che tu sia superadmin
2. Controlla che le RLS policies siano configurate correttamente
3. Verifica i permessi nella tabella `user_roles`

### Problema: I permessi non vengono applicati

**Soluzione**:
1. Fai logout e login di nuovo per ricaricare ruoli e permessi
2. Verifica che i permessi siano stati salvati in `user_permissions`
3. Controlla la console per eventuali errori di caricamento

## 💡 Best Practices

1. **Assegna permessi specifici**: Non rendere tutti superadmin, usa i permessi specifici
2. **Principio del minimo privilegio**: Assegna solo i permessi necessari
3. **Audit**: Mantieni traccia di chi ha quali permessi
4. **Testing**: Testa sempre i permessi dopo averli modificati

## 🔄 Prossimi Passi

1. Implementare funzionalità di editing destinazioni con controllo `travel_editor`
2. Implementare funzionalità di editing prezzi con controllo `prices_editor`
3. Aggiungere log delle modifiche ai ruoli
4. Aggiungere export/import di ruoli e permessi

