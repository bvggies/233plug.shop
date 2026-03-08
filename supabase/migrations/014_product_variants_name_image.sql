-- Extend product_variants with optional name and image for admin-managed variants
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN product_variants.name IS 'Display name for the variant (e.g. "Large / Blue")';
COMMENT ON COLUMN product_variants.image_url IS 'Optional image URL for this variant';
