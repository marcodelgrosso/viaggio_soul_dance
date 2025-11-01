-- Script per inserire URL di esempio per le destinazioni esistenti
-- Esegui questo script dopo aver aggiunto le colonne image_url e tags

-- Aggiorna le destinazioni senza immagine con URL di esempio da Unsplash
-- Usa immagini diverse basate sul nome o ordine della destinazione

UPDATE adventure_destinations
SET 
  image_url = CASE 
    WHEN name ILIKE '%paris%' OR name ILIKE '%parigi%' THEN 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%london%' OR name ILIKE '%londra%' THEN 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%rome%' OR name ILIKE '%roma%' THEN 'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%barcelona%' OR name ILIKE '%barcellona%' THEN 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%amsterdam%' THEN 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%berlin%' THEN 'https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%madrid%' THEN 'https://images.unsplash.com/photo-1531594896955-305cf81269f1?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%vienna%' OR name ILIKE '%vienna%' THEN 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%prague%' OR name ILIKE '%praga%' THEN 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%budapest%' THEN 'https://images.unsplash.com/photo-1547679902-b1eae0b1b5a2?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%istanbul%' THEN 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%athens%' OR name ILIKE '%atene%' THEN 'https://images.unsplash.com/photo-1632145894338-2c50b3a6c113?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%lisbon%' OR name ILIKE '%lisbona%' THEN 'https://images.unsplash.com/photo-1585338927000-1c786b0b15b1?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%dublin%' THEN 'https://images.unsplash.com/photo-1590523277598-9bb841561797?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%copenhagen%' OR name ILIKE '%copenaghen%' THEN 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%stockholm%' THEN 'https://images.unsplash.com/photo-1507959666348-4b2f9c1862ea?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%oslo%' THEN 'https://images.unsplash.com/photo-1580882472252-314a2e56b38c?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%helsinki%' THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%warsaw%' OR name ILIKE '%varsavia%' THEN 'https://images.unsplash.com/photo-1512273221322-7c2fa36b3f8f?w=800&h=600&fit=crop&crop=center'
    WHEN name ILIKE '%krakow%' OR name ILIKE '%cracovia%' THEN 'https://images.unsplash.com/photo-1572015878956-94c9e2b68528?w=800&h=600&fit=crop&crop=center'
    ELSE 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop&crop=center'
  END,
  tags = CASE
    WHEN tags IS NULL OR tags = '[]'::jsonb THEN 
      CASE 
        WHEN name ILIKE '%paris%' OR name ILIKE '%parigi%' THEN '["Cultura", "Storia", "Arte", "Gastronomia"]'::jsonb
        WHEN name ILIKE '%london%' OR name ILIKE '%londra%' THEN '["Metropoli", "Shopping", "Musei", "Teatro"]'::jsonb
        WHEN name ILIKE '%rome%' OR name ILIKE '%roma%' THEN '["Storia", "Arte", "Religione", "Gastronomia"]'::jsonb
        WHEN name ILIKE '%barcelona%' OR name ILIKE '%barcellona%' THEN '["Arte", "Architettura", "Spiaggia", "Vita Notturna"]'::jsonb
        WHEN name ILIKE '%amsterdam%' THEN '["Cultura", "Canali", "Musei", "Vita Notturna"]'::jsonb
        WHEN name ILIKE '%berlin%' THEN '["Storia", "Arte", "Musica", "Vita Notturna"]'::jsonb
        WHEN name ILIKE '%madrid%' THEN '["Cultura", "Arte", "Gastronomia", "Vita Notturna"]'::jsonb
        WHEN name ILIKE '%vienna%' OR name ILIKE '%vienna%' THEN '["Musica", "Arte", "Storia", "Architettura"]'::jsonb
        WHEN name ILIKE '%prague%' OR name ILIKE '%praga%' THEN '["Storia", "Architettura", "Birra", "Cultura"]'::jsonb
        WHEN name ILIKE '%budapest%' THEN '["Storia", "Terme", "Architettura", "Vita Notturna"]'::jsonb
        ELSE '["Viaggio", "Avventura", "Esplorazione"]'::jsonb
      END
    ELSE tags
  END
WHERE image_url IS NULL OR image_url = '';

-- Mostra le destinazioni aggiornate
SELECT 
  id,
  name,
  image_url,
  tags
FROM adventure_destinations
WHERE image_url IS NOT NULL
ORDER BY created_at DESC;

