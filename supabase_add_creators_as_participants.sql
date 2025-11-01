-- Script per aggiungere automaticamente tutti i creators come partecipanti
-- Se un creator non è già presente nella tabella adventure_participants, viene aggiunto

INSERT INTO adventure_participants (adventure_id, user_id, added_by, created_at)
SELECT 
    ac.adventure_id,
    ac.user_id,
    ac.user_id as added_by,  -- Il creator si aggiunge come partecipante
    COALESCE(a.created_at, NOW()) as created_at
FROM adventure_creators ac
INNER JOIN adventures a ON a.id = ac.adventure_id
WHERE NOT EXISTS (
    SELECT 1 
    FROM adventure_participants ap 
    WHERE ap.adventure_id = ac.adventure_id 
    AND ap.user_id = ac.user_id
)
ON CONFLICT (adventure_id, user_id) DO NOTHING;

-- Verifica i risultati
SELECT 
    a.name as adventure_name,
    COUNT(DISTINCT ac.user_id) as creators_count,
    COUNT(DISTINCT ap.user_id) as participants_count
FROM adventures a
LEFT JOIN adventure_creators ac ON ac.adventure_id = a.id
LEFT JOIN adventure_participants ap ON ap.adventure_id = a.id
GROUP BY a.id, a.name
ORDER BY a.created_at DESC;

