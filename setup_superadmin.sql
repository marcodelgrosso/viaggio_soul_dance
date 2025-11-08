-- Setup Superadmin per marco.delgrosso88@gmail.com
-- IMPORTANTE: Esegui PRIMA fix_permissions_constraint.sql se ottieni errori di constraint!

-- Normalizza eventuali valori legacy e il constraint sui ruoli
UPDATE user_roles SET role = 'platform_superadmin' WHERE role = 'superadmin';
UPDATE user_roles SET role = 'platform_user'       WHERE role = 'user';

ALTER TABLE user_roles
  DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('platform_superadmin', 'platform_user'));

ALTER TABLE user_roles
  ALTER COLUMN role SET DEFAULT 'platform_user';

-- Prima verifica che l'utente esista
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'marco.delgrosso88@gmail.com';

-- Inserisci il ruolo di amministratore piattaforma (sostituisce se esiste già)
INSERT INTO user_roles (user_id, role)
SELECT id, 'platform_superadmin' 
FROM auth.users 
WHERE email = 'marco.delgrosso88@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'platform_superadmin', updated_at = NOW();

-- Verifica che sia stato inserito correttamente
SELECT ur.*, u.email
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'marco.delgrosso88@gmail.com';

-- Opzionale: Inserisci anche i permessi espliciti (anche se gli amministratori piattaforma li hanno automaticamente)
-- NOTA: Questo fallirà se il constraint non include i nuovi codici perm_* - esegui prima fix_permissions_constraint.sql
INSERT INTO user_permissions (user_id, permission)
SELECT u.id, 'perm_create_adventures'
FROM auth.users u
WHERE u.email = 'marco.delgrosso88@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_permissions up 
    WHERE up.user_id = u.id AND up.permission = 'perm_create_adventures'
  )
ON CONFLICT (user_id, permission) DO NOTHING;

INSERT INTO user_permissions (user_id, permission)
SELECT u.id, 'perm_view_statistics'
FROM auth.users u
WHERE u.email = 'marco.delgrosso88@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_permissions up 
    WHERE up.user_id = u.id AND up.permission = 'perm_view_statistics'
  )
ON CONFLICT (user_id, permission) DO NOTHING;

-- Verifica tutti i permessi
SELECT up.*, u.email
FROM user_permissions up
JOIN auth.users u ON u.id = up.user_id
WHERE u.email = 'marco.delgrosso88@gmail.com';

-- Messaggio finale
SELECT 'Setup completato! Ricarica la pagina nell''applicazione.' as messaggio;
