-- Allow users to insert their own wallet transaction (e.g. debit when paying with wallet).
-- Note: Users are NOT allowed to set order status to paid. Only the server does that when
-- checkout completes (via /api/payments/wallet/complete and Paystack/Stripe webhooks using service role).
DROP POLICY IF EXISTS "Users can insert own wallet transactions" ON wallet_transactions;
CREATE POLICY "Users can insert own wallet transactions" ON wallet_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
