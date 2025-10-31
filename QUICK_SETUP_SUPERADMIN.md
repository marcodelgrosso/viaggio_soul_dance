# 🚀 Setup Rapido Superadmin

## 🔍 Problema

Se non vedi il pulsante "Nuova Avventura" o hai errori 406/500, probabilmente il tuo account non ha una riga nella tabella `user_roles` nel database Supabase.

## ✅ Soluzione Veloce

### Passo 1: Esegui lo Script SQL

Vai su **Supabase Dashboard** → **SQL Editor** e esegui il contenuto del file `setup_superadmin.sql`.

Lo script:
1. Verifica che il tuo account esista
2. Inserisce il ruolo `superadmin` per il tuo account
3. Aggiunge i permessi `is_creator` e `view_statistics`
4. Verifica che tutto sia stato inserito correttamente

### Passo 2: Verifica

Dopo aver eseguito lo script, dovresti vedere:

```sql
-- Questo query ti mostra il tuo ruolo
SELECT ur.role, u.email
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'marco.delgrosso88@gmail.com';
```

Risultato atteso: `role = 'superadmin'`

### Passo 3: Ricarica l'Applicazione

1. **Fai logout** e **login** di nuovo
2. Oppure semplicemente **ricarica la pagina** (F5)
3. Dovresti vedere:
   - Sezione "Gestione Avventure" 
   - Pulsante "Nuova Avventura"

## 🔧 Script SQL Completo

```sql
-- Setup Superadmin
INSERT INTO user_roles (user_id, role)
SELECT id, 'superadmin' 
FROM auth.users 
WHERE email = 'marco.delgrosso88@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'superadmin', updated_at = NOW();

-- Aggiungi permessi
INSERT INTO user_permissions (user_id, permission)
SELECT u.id, 'is_creator'
FROM auth.users u
WHERE u.email = 'marco.delgrosso88@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_permissions up 
    WHERE up.user_id = u.id AND up.permission = 'is_creator'
  );
```

## 📝 Nota

Il sistema funziona anche **senza** le righe nel database (usa il fallback via email), ma è meglio avere tutto nel database per:
- Gestione consistente
- Funzionalità RoleManagement completa
- Nessun errore 406/500

## 🐛 Se Ancora Non Funziona

1. **Verifica che le tabelle esistano**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('user_roles', 'user_permissions');
   ```

2. **Se le tabelle non esistono**, esegui prima `supabase_roles_migration.sql`

3. **Verifica le RLS policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_roles';
   ```

4. **Controlla la console del browser** per errori specifici

