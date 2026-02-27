-- Seed default categories
INSERT INTO categories (name, slug) VALUES
  ('Perfumes', 'perfumes'),
  ('Sneakers', 'sneakers'),
  ('Electronics', 'electronics'),
  ('Accessories', 'accessories')
ON CONFLICT (slug) DO NOTHING;
