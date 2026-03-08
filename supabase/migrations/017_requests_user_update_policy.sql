-- Allow users to update their own requests (e.g. quote response: accept, decline, reduction_requested)
-- Without this, the customer's price reduction request update was blocked by RLS and never reached the DB.
CREATE POLICY "Users can update own requests"
  ON requests FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can update own requests" ON requests IS 'Lets customers set quote_response, quote_response_message, counter_price when responding to a quote.';
