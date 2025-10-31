-- Setup Superadmin per marco.delgrosso88@gmail.com
-- IMPORTANTE: Esegui PRIMA fix_permissions_constraint.sql se ottieni errori di constraint!

-- Prima verifica che l'utente esista
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'marco.delgrosso88@gmail.com';

-- Inserisci il ruolo superadmin (sostituisce se esiste già)
INSERT INTO user_roles (user_id, role)
SELECT id, 'superadmin' 
FROM auth.users 
WHERE email = 'marco.delgrosso88@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'superadmin', updated_at = NOW();

-- Verifica che sia stato inserito correttamente
SELECT ur.*, u.email
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'marco.delgrosso88@gmail.com';

-- Opzionale: Inserisci anche i permessi espliciti (anche se superadmin li ha automaticamente)
-- NOTA: Questo fallirà se il constraint non include 'is_creator' - esegui prima fix_permissions_constraint.sql
INSERT INTO user_permissions (user_id, permission)
SELECT u.id, 'is_creator'
FROM auth.users u
WHERE u.email = 'marco.delgrosso88@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_permissions up 
    WHERE up.user_id = u.id AND up.permission = 'is_creator'
  )
ON CONFLICT (user_id, permission) DO NOTHING;

INSERT INTO user_permissions (user_id, permission)
SELECT u.id, 'view_statistics'
FROM auth.users u
WHERE u.email = 'marco.delgrosso88@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_permissions up 
    WHERE up.user_id = u.id AND up.permission = 'view_statistics'
  )
ON CONFLICT (user_id, permission) DO NOTHING;

-- Verifica tutti i permessi
SELECT up.*, u.email
FROM user_permissions up
JOIN auth.users u ON u.id = up.user_id
WHERE u.email = 'marco.delgrosso88@gmail.com';

-- Messaggio finale
SELECT 'Setup completato! Ricarica la pagina nell''applicazione.' as messaggio;
