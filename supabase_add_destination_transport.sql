-- Assicura che la funzione is_superadmin esista (se non esiste già)
CREATE OR REPLACE FUNCTION is_superadmin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid
    AND role = 'platform_superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tabella per memorizzare informazioni su voli, treni, alberghi, bus, ecc. per le destinazioni
CREATE TABLE IF NOT EXISTS destination_transport (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID NOT NULL REFERENCES adventure_destinations(id) ON DELETE CASCADE,
  transport_type VARCHAR(50) NOT NULL CHECK (transport_type IN ('flight', 'train', 'hotel', 'bus', 'car', 'other')),
  departure_date DATE,
  departure_time TIME,
  arrival_date DATE,
  arrival_time TIME,
  cost DECIMAL(10, 2),
  cost_type VARCHAR(20) NOT NULL CHECK (cost_type IN ('fixed', 'estimated', 'variable')) DEFAULT 'estimated',
  info_link TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_destination_transport_destination_id ON destination_transport(destination_id);
CREATE INDEX IF NOT EXISTS idx_destination_transport_created_by ON destination_transport(created_by);
CREATE INDEX IF NOT EXISTS idx_destination_transport_type ON destination_transport(transport_type);

-- RLS (Row Level Security)
ALTER TABLE destination_transport ENABLE ROW LEVEL SECURITY;

-- Policy: tutti i partecipanti possono vedere i mezzi di trasporto delle destinazioni
DROP POLICY IF EXISTS "Users can view destination transport" ON destination_transport;

CREATE POLICY "Users can view destination transport"
  ON destination_transport
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adventure_destinations ad
      JOIN adventures a ON ad.adventure_id = a.id
      WHERE ad.id = destination_transport.destination_id
      AND a.is_active = true
    )
  );

-- Policy: solo i creator possono inserire/modificare
DROP POLICY IF EXISTS "Creators can manage destination transport" ON destination_transport;

CREATE POLICY "Creators can manage destination transport"
  ON destination_transport
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adventure_destinations ad
      JOIN adventures a ON ad.adventure_id = a.id
      WHERE ad.id = destination_transport.destination_id
      AND (a.created_by = auth.uid() OR is_superadmin(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM adventure_destinations ad
      JOIN adventures a ON ad.adventure_id = a.id
      WHERE ad.id = destination_transport.destination_id
      AND (a.created_by = auth.uid() OR is_superadmin(auth.uid()))
    )
    AND created_by = auth.uid()
  );

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_destination_transport_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare updated_at automaticamente
DROP TRIGGER IF EXISTS update_destination_transport_updated_at ON destination_transport;

CREATE TRIGGER update_destination_transport_updated_at
  BEFORE UPDATE ON destination_transport
  FOR EACH ROW
  EXECUTE FUNCTION update_destination_transport_updated_at();

COMMENT ON TABLE destination_transport IS 'Informazioni su voli, treni, alberghi, bus e altri mezzi di trasporto per le destinazioni';
COMMENT ON COLUMN destination_transport.transport_type IS 'Tipo di trasporto: flight, train, hotel, bus, car, other';
COMMENT ON COLUMN destination_transport.cost_type IS 'Tipo di costo: fixed (fisso), estimated (stimato), variable (variabile)';
COMMENT ON COLUMN destination_transport.info_link IS 'Link esterno opzionale per informazioni aggiuntive sul trasporto/alloggio';

