-- Shipping zones: admins define regions for delivery (e.g. Accra, Greater Accra, Other Ghana, International)
CREATE TABLE IF NOT EXISTS shipping_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  country TEXT NOT NULL DEFAULT 'Ghana',
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_zones_active ON shipping_zones(is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_zones_sort ON shipping_zones(sort_order);

ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shipping zones are viewable by everyone" ON shipping_zones FOR SELECT USING (true);
CREATE POLICY "Admins can manage shipping zones" ON shipping_zones FOR ALL USING (is_admin());

DROP TRIGGER IF EXISTS shipping_zones_updated_at ON shipping_zones;
CREATE TRIGGER shipping_zones_updated_at
  BEFORE UPDATE ON shipping_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Link orders to a shipping zone (optional)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_zone_id UUID REFERENCES shipping_zones(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_shipping_zone ON orders(shipping_zone_id);

-- Link shipment batches to a shipping zone (optional; e.g. "Accra batch 1")
ALTER TABLE shipment_batches ADD COLUMN IF NOT EXISTS shipping_zone_id UUID REFERENCES shipping_zones(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_shipment_batches_shipping_zone ON shipment_batches(shipping_zone_id);

COMMENT ON TABLE shipping_zones IS 'Delivery zones (e.g. Accra, Greater Accra); linked to orders and shipment batches for tracking.';
