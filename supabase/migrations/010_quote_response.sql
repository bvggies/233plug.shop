-- User response to quoted price: accept, decline, or request reduction
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS quote_response TEXT CHECK (quote_response IN ('accepted', 'declined', 'reduction_requested')),
  ADD COLUMN IF NOT EXISTS quote_response_message TEXT,
  ADD COLUMN IF NOT EXISTS counter_price DECIMAL(12, 2);

COMMENT ON COLUMN requests.quote_response IS 'User response to quote: accepted, declined, or reduction_requested';
COMMENT ON COLUMN requests.quote_response_message IS 'Optional message (reason for decline or reduction request details)';
COMMENT ON COLUMN requests.counter_price IS 'User counter-offer when requesting reduction';
