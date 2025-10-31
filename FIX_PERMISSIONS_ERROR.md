# 🔧 Fix Errori Permessi (406/500)

Se vedi errori 406 o 500 quando carichi i permessi, ecco come risolvere:

## 🔍 Problema

Gli errori indicano che:
- La tabella `user_permissions` potrebbe non esistere ancora
- Le RLS policies potrebbero bloccare l'accesso
- Il database potrebbe non essere completamente configurato

## ✅ Soluzione

### Passo 1: Verifica che le tabelle esistano

Esegui questa query in Supabase SQL Editor per verificare:

```sql
-- Verifica se le tabelle esistono
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_roles', 'user_permissions');
```

Se non esistono, esegui `supabase_roles_migration.sql`.

### Passo 2: Verifica le RLS Policies

```sql
-- Verifica le policies su user_permissions
SELECT * FROM pg_policies WHERE tablename = 'user_permissions';
```

### Passo 3: Fix RLS Policies (se necessario)

Se le policies bloccano l'accesso, esegui:

```sql
-- Rimuovi e ricrea le policies
DROP POLICY IF EXISTS "Users can view their own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Superadmin can manage permissions" ON user_permissions;

-- Ricrea la policy per la lettura (più permissiva per debug)
CREATE POLICY "Users can view their own permissions"
  ON user_permissions
  FOR SELECT
  TO authenticated
  USING (true);  -- Permetti a tutti gli utenti autenticati di vedere tutti i permessi (temporaneo per debug)

-- Per la gestione, solo superadmin
CREATE POLICY "Superadmin can manage permissions"
  ON user_permissions
  FOR ALL
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );
```

### Passo 4: Verifica che l'utente possa accedere

```sql
-- Test: verifica se puoi vedere i tuoi permessi
SELECT * FROM user_permissions 
WHERE user_id = auth.uid();
```

### Passo 5: Soluzione temporanea (se le tabelle non esistono)

Se le tabelle non sono ancora state create, il sistema funzionerà comunque usando i permessi predefiniti per superadmin. Il codice ora gestisce gracefully l'assenza delle tabelle.

## 🔄 Dopo il Fix

1. Ricarica la pagina (F5)
2. Controlla la console - gli errori dovrebbero scomparire
3. Il sistema dovrebbe funzionare anche senza le tabelle (per i superadmin)

## 📝 Nota

Il codice è stato aggiornato per gestire gracefully:
- Tabelle mancanti
- Errori di accesso
- Policies RLS troppo restrittive

Gli errori vengono loggati ma non bloccano l'applicazione.

