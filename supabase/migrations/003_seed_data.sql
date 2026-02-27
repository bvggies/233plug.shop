-- Seed default categories
INSERT INTO categories (name, slug) VALUES
  ('Perfumes', 'perfumes'),
  ('Sneakers', 'sneakers'),
  ('Electronics', 'electronics'),
  ('Accessories', 'accessories')
ON CONFLICT (slug) DO NOTHING;

-- Seed sample products with images (only when no products exist)
INSERT INTO products (name, category_id, description, images, price, currency, stock, sku)
SELECT name, category_id, description, images, price, currency, stock, sku FROM (
  SELECT
    'Bleu de Chanel Eau de Parfum'::text AS name,
    (SELECT id FROM categories WHERE slug = 'perfumes' LIMIT 1) AS category_id,
    'A bold aromatic fragrance with a woody-amber drydown. Fresh and sophisticated.'::text AS description,
    ARRAY[
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400'
    ]::text[] AS images,
    850.00::decimal AS price,
    'GHS'::text AS currency,
    25::int AS stock,
    'PERF-001'::text AS sku
  UNION ALL SELECT
    'Yeezy Boost 350 V2',
    (SELECT id FROM categories WHERE slug = 'sneakers' LIMIT 1),
    'Iconic adidas Yeezy sneakers. Primeknit upper with Boost cushioning.',
    ARRAY[
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400'
    ],
    1200.00,
    'GHS',
    15,
    'SNK-001'
  UNION ALL SELECT
    'AirPods Pro (2nd Gen)',
    (SELECT id FROM categories WHERE slug = 'electronics' LIMIT 1),
    'Active Noise Cancellation, adaptive audio, and personalized spatial audio.',
    ARRAY[
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400',
      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400'
    ],
    1500.00,
    'GHS',
    30,
    'ELEC-001'
  UNION ALL SELECT
    'Designer Leather Wallet',
    (SELECT id FROM categories WHERE slug = 'accessories' LIMIT 1),
    'Premium genuine leather wallet with RFID blocking. Multiple card slots.',
    ARRAY[
      'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
      'https://images.unsplash.com/photo-1606503153255-59d8b8b3d102?w=400'
    ],
    280.00,
    'GHS',
    40,
    'ACC-001'
  UNION ALL SELECT
    'Tom Ford Black Orchid',
    (SELECT id FROM categories WHERE slug = 'perfumes' LIMIT 1),
    'Exotic and luxurious. Black truffle, bergamot, black orchid.',
    ARRAY['https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400'],
    950.00,
    'GHS',
    12,
    'PERF-002'
  UNION ALL SELECT
    'Nike Air Max 90',
    (SELECT id FROM categories WHERE slug = 'sneakers' LIMIT 1),
    'Classic Nike Air Max with visible Air unit. Comfortable everyday sneaker.',
    ARRAY['https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=400'],
    650.00,
    'GHS',
    20,
    'SNK-002'
) s
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);
