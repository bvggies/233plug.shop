-- Tracking events for shipment batches (admin adds updates; users see timeline)
CREATE TABLE IF NOT EXISTS shipment_tracking_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_batch_id UUID NOT NULL REFERENCES shipment_batches(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created',
    'processing',
    'dispatched',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'custom'
  )),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_batch ON shipment_tracking_events(shipment_batch_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created ON shipment_tracking_events(created_at);

ALTER TABLE shipment_tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tracking events"
  ON shipment_tracking_events FOR ALL
  USING (is_admin());

CREATE POLICY "Users can view tracking events for their batches"
  ON shipment_tracking_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.shipment_batch_id = shipment_tracking_events.shipment_batch_id
        AND o.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM requests r
      WHERE r.shipment_batch_id = shipment_tracking_events.shipment_batch_id
        AND r.user_id = auth.uid()
    )
  );

COMMENT ON TABLE shipment_tracking_events IS 'Timeline events for shipment batch tracking; admin adds updates, users see visualization.';
