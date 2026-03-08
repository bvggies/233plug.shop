-- Tracking codes for guest order/request tracking
-- Add column (nullable first for backfill), backfill, then set NOT NULL and add trigger for new rows.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code TEXT UNIQUE;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS tracking_code TEXT UNIQUE;

-- Backfill existing orders: O + 9 chars of id (unique)
UPDATE orders
SET tracking_code = 'O' || upper(substring(replace(id::text, '-', ''), 1, 9))
WHERE tracking_code IS NULL;

-- Backfill existing requests: R + 9 chars of id (unique)
UPDATE requests
SET tracking_code = 'R' || upper(substring(replace(id::text, '-', ''), 1, 9))
WHERE tracking_code IS NULL;

-- No second update needed
ALTER TABLE orders ALTER COLUMN tracking_code SET NOT NULL;
ALTER TABLE requests ALTER COLUMN tracking_code SET NOT NULL;

-- Trigger: generate 10-char code with prefix O (orders) or R (requests)
CREATE OR REPLACE FUNCTION generate_tracking_code()
RETURNS TRIGGER AS $$
DECLARE
  prefix text;
  new_code text;
  done boolean := false;
BEGIN
  IF NEW.tracking_code IS NOT NULL AND NEW.tracking_code != '' THEN
    RETURN NEW;
  END IF;
  prefix := CASE WHEN TG_TABLE_NAME = 'orders' THEN 'O' ELSE 'R' END;
  WHILE NOT done LOOP
    new_code := prefix || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 9));
    IF (TG_TABLE_NAME = 'orders' AND NOT EXISTS (SELECT 1 FROM orders WHERE tracking_code = new_code))
       OR (TG_TABLE_NAME = 'requests' AND NOT EXISTS (SELECT 1 FROM requests WHERE tracking_code = new_code)) THEN
      NEW.tracking_code := new_code;
      done := true;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_tracking_code_trigger ON orders;
CREATE TRIGGER orders_tracking_code_trigger
  BEFORE INSERT ON orders FOR EACH ROW
  EXECUTE FUNCTION generate_tracking_code();

DROP TRIGGER IF EXISTS requests_tracking_code_trigger ON requests;
CREATE TRIGGER requests_tracking_code_trigger
  BEFORE INSERT ON requests FOR EACH ROW
  EXECUTE FUNCTION generate_tracking_code();

-- RPC for public tracking lookup (no auth required; returns minimal safe info)
CREATE OR REPLACE FUNCTION get_tracking_info(code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  o orders%ROWTYPE;
  r requests%ROWTYPE;
  batch_id uuid;
  batch_row shipment_batches%ROWTYPE;
  events_json json;
BEGIN
  IF code IS NULL OR trim(code) = '' THEN
    RETURN NULL;
  END IF;
  code := upper(trim(code));

  -- Try order first
  SELECT * INTO o FROM orders WHERE tracking_code = code LIMIT 1;
  IF FOUND THEN
    batch_id := o.shipment_batch_id;
    IF batch_id IS NOT NULL THEN
      SELECT * INTO batch_row FROM shipment_batches WHERE id = batch_id;
      SELECT json_agg(json_build_object(
        'id', e.id, 'event_type', e.event_type, 'message', e.message, 'created_at', e.created_at
      ) ORDER BY e.created_at)
      INTO events_json FROM shipment_tracking_events e WHERE e.shipment_batch_id = batch_id;
    END IF;
    result := json_build_object(
      'type', 'order',
      'id', o.id,
      'status', o.status,
      'created_at', o.created_at,
      'total_price', o.total_price,
      'currency', o.currency,
      'shipment_batch', CASE WHEN batch_id IS NOT NULL THEN json_build_object(
        'id', batch_row.id, 'batch_name', batch_row.batch_name,
        'tracking_number', batch_row.tracking_number, 'estimated_delivery', batch_row.estimated_delivery,
        'status', batch_row.status
      ) ELSE NULL END,
      'tracking_events', COALESCE(events_json, '[]'::json)
    );
    RETURN result;
  END IF;

  -- Try request
  SELECT * INTO r FROM requests WHERE tracking_code = code LIMIT 1;
  IF FOUND THEN
    batch_id := r.shipment_batch_id;
    IF batch_id IS NOT NULL THEN
      SELECT * INTO batch_row FROM shipment_batches WHERE id = batch_id;
      SELECT json_agg(json_build_object(
        'id', e.id, 'event_type', e.event_type, 'message', e.message, 'created_at', e.created_at
      ) ORDER BY e.created_at)
      INTO events_json FROM shipment_tracking_events e WHERE e.shipment_batch_id = batch_id;
    END IF;
    result := json_build_object(
      'type', 'request',
      'id', r.id,
      'status', r.status,
      'created_at', r.created_at,
      'product_name', r.product_name,
      'quote_price', r.quote_price,
      'shipment_batch', CASE WHEN batch_id IS NOT NULL THEN json_build_object(
        'id', batch_row.id, 'batch_name', batch_row.batch_name,
        'tracking_number', batch_row.tracking_number, 'estimated_delivery', batch_row.estimated_delivery,
        'status', batch_row.status
      ) ELSE NULL END,
      'tracking_events', COALESCE(events_json, '[]'::json)
    );
    RETURN result;
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION get_tracking_info(text) IS 'Public lookup for order/request by tracking code; returns minimal safe data for guest tracking page.';

GRANT EXECUTE ON FUNCTION get_tracking_info(text) TO anon;
GRANT EXECUTE ON FUNCTION get_tracking_info(text) TO authenticated;
