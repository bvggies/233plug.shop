-- Request updates: admin-written updates visible to the request owner
CREATE TABLE IF NOT EXISTS request_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status_snapshot TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_updates_request_id ON request_updates(request_id);
CREATE INDEX IF NOT EXISTS idx_request_updates_created_at ON request_updates(created_at);

ALTER TABLE request_updates ENABLE ROW LEVEL SECURITY;

-- Users can view updates for their own requests
CREATE POLICY "Users can view updates for own requests"
  ON request_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = request_updates.request_id
      AND requests.user_id = auth.uid()
    )
  );

-- Admins can insert and read all request updates
CREATE POLICY "Admins can insert request updates"
  ON request_updates FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can view all request updates"
  ON request_updates FOR SELECT
  USING (is_admin());
