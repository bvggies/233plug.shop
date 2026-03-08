-- Coupon rules: active flag and per-user usage limit
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_uses_per_user INTEGER;

COMMENT ON COLUMN coupons.is_active IS 'When false, coupon cannot be applied (e.g. disabled by admin).';
COMMENT ON COLUMN coupons.max_uses_per_user IS 'Max times each user can use this coupon; NULL = unlimited.';

CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active) WHERE is_active = true;
