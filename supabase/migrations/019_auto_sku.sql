-- Auto-generate product SKU when admin leaves it empty
CREATE SEQUENCE IF NOT EXISTS products_sku_seq START 1;

CREATE OR REPLACE FUNCTION set_product_sku()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sku IS NULL OR trim(NEW.sku) = '' THEN
    NEW.sku := 'SKU-' || lpad(nextval('products_sku_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_auto_sku ON products;
CREATE TRIGGER products_auto_sku
  BEFORE INSERT OR UPDATE OF sku ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_sku();

-- Backfill existing products that have no SKU
UPDATE products
SET sku = 'SKU-' || lpad(nextval('products_sku_seq')::text, 6, '0')
WHERE sku IS NULL OR trim(sku) = '';

COMMENT ON SEQUENCE products_sku_seq IS 'Used to auto-generate product SKUs (SKU-000001, ...) when admin does not set one.';
