# 🔧 Fix Rapido: Assegnare Ruolo Superadmin

Se non vedi la sezione "Gestione Ruoli e Permessi", ecco come risolvere:

## ✅ Opzione 1: Via Email (Fallback Automatico)

Se la tua email corrisponde a `marco.delgrosso88@gmail.com`, il sistema ti riconosce automaticamente come superadmin anche senza database.

**Verifica**: Controlla la console del browser (F12) e cerca i log che mostrano:
```
Auth State: { email: '...', role: 'superadmin', isSuperAdmin: true, ... }
```

## ✅ Opzione 2: Assegnare Ruolo nel Database

Se vuoi usare il sistema database:

### Passo 1: Esegui la Migrazione SQL

1. Vai su **Supabase Dashboard** → **SQL Editor**
2. Apri il file `supabase_roles_migration.sql`
3. Copia tutto il contenuto e incollalo nell'editor SQL
4. Clicca **RUN** per eseguire

### Passo 2: Assegna Ruolo Superadmin

Dopo aver eseguito la migrazione, esegui questa query (sostituisci con la tua email):

```sql
-- Trova il tuo user_id
SELECT id, email FROM auth.users WHERE email = 'tua-email@example.com';

-- Poi inserisci il ruolo (sostituisci USER_ID con l'id trovato sopra)
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_QUI', 'superadmin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'superadmin';
```

**Oppure** direttamente con l'email:

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'superadmin' 
FROM auth.users 
WHERE email = 'marco.delgrosso88@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'superadmin';
```

### Passo 3: Ricarica la Pagina

1. Fai **logout** e **login** di nuovo
2. Oppure semplicemente **ricarica la pagina** (F5)
3. Dovresti vedere la sezione "Gestione Ruoli e Permessi"

## 🔍 Debug

Apri la console del browser (F12) e verifica:

1. **Messaggi di log**:
   - `Auth State: ...` - Mostra ruolo e permessi
   - `MainContent render:` - Mostra se isSuperAdmin è true
   - `RoleManagement render:` - Conferma che il componente viene renderizzato

2. **Errori**:
   - Se vedi errori su `user_roles` o `user_permissions`, la migrazione non è stata eseguita
   - Se vedi errori di RLS, controlla le policy nel database

3. **Network tab**:
   - Verifica che le query a `user_roles` e `user_permissions` vengano eseguite
   - Controlla le risposte (dovrebbero essere array vuoti se non hai ancora ruoli)

## 🐛 Se Ancora Non Funziona

1. **Verifica email**: Assicurati che l'email nel codice (`SUPERADMIN_EMAIL`) corrisponda esattamente alla tua email
2. **Pulisci cache**: Fai logout, chiudi il browser, riapri e fai login
3. **Controlla console**: Cerca errori in rosso nella console
4. **Verifica database**: Controlla che le tabelle `user_roles` e `user_permissions` esistano

## 📝 Note

- Il sistema funziona anche **senza database**: se l'email corrisponde, sei automaticamente superadmin
- Se hai eseguito la migrazione SQL ma non vedi la sezione, potrebbe essere necessario fare logout/login
- I log nella console ti aiutano a capire cosa sta succedendo

