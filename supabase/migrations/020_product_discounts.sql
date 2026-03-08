-- Per-product discount (percent or fixed amount off)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('percent', 'fixed')),
  ADD COLUMN IF NOT EXISTS discount_value DECIMAL(12, 2);

COMMENT ON COLUMN products.discount_type IS 'percent = discount_value is % off; fixed = discount_value is amount off in product currency';
COMMENT ON COLUMN products.discount_value IS 'Discount amount: percent (e.g. 20) or fixed (e.g. 5.00). NULL = no discount.';
