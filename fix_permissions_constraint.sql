-- Fix Constraint per user_permissions - Aggiunge 'is_creator'
-- Esegui questo script nella SQL Editor di Supabase

-- Prima rimuovi il constraint esistente
ALTER TABLE user_permissions 
DROP CONSTRAINT IF EXISTS user_permissions_permission_check;

-- Aggiungi il nuovo constraint con 'is_creator'
ALTER TABLE user_permissions
ADD CONSTRAINT user_permissions_permission_check 
CHECK (permission IN ('travel_editor', 'prices_editor', 'view_statistics', 'is_creator'));

-- Verifica che il constraint sia stato applicato
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_permissions'::regclass
AND conname = 'user_permissions_permission_check';

-- Ora puoi inserire i permessi 'is_creator'
-- Prova di nuovo lo script setup_superadmin.sql

