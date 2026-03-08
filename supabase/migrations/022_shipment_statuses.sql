-- Shipment batch statuses: rename pending -> pending_shipment, add granular statuses
UPDATE shipment_batches SET status = 'pending_shipment' WHERE status = 'pending';

ALTER TABLE shipment_batches
  DROP CONSTRAINT IF EXISTS shipment_batches_status_check;

ALTER TABLE shipment_batches
  ADD CONSTRAINT shipment_batches_status_check CHECK (status IN (
    'pending_shipment',
    'left_origin',
    'at_sea',
    'in_flight',
    'arrived_destination',
    'shipped',
    'delivered'
  ));

ALTER TABLE shipment_batches
  ALTER COLUMN status SET DEFAULT 'pending_shipment';

-- Tracking event types: add new predefined + keep custom (admin adds with description)
ALTER TABLE shipment_tracking_events
  DROP CONSTRAINT IF EXISTS shipment_tracking_events_event_type_check;

ALTER TABLE shipment_tracking_events
  ADD CONSTRAINT shipment_tracking_events_event_type_check CHECK (event_type IN (
    'created',
    'processing',
    'dispatched',
    'in_transit',
    'out_for_delivery',
    'left_origin',
    'at_sea',
    'in_flight',
    'arrived_destination',
    'delivered',
    'custom'
  ));

COMMENT ON COLUMN shipment_tracking_events.message IS 'Optional description; for event_type custom, use as the main label/title.';
