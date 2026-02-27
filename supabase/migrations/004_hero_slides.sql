-- Hero slides for homepage carousel
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

-- Public can read hero slides
CREATE POLICY "Hero slides are viewable by everyone" ON hero_slides FOR SELECT USING (true);

-- Admins can manage hero slides
CREATE POLICY "Admins can manage hero slides" ON hero_slides FOR ALL USING (is_admin());

DROP TRIGGER IF EXISTS hero_slides_updated_at ON hero_slides;
CREATE TRIGGER hero_slides_updated_at
  BEFORE UPDATE ON hero_slides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed default hero images (only when empty)
INSERT INTO hero_slides (image_url, title, subtitle, link_url, sort_order)
SELECT 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920', 'Shop Premium Products', 'Perfumes, sneakers, electronics & accessories. Request-to-buy sourcing from Ghana.', '/shop', 0
WHERE NOT EXISTS (SELECT 1 FROM hero_slides LIMIT 1)
UNION ALL SELECT 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1920', 'Perfumes & Fragrances', 'Discover luxury scents from around the world.', '/shop?category=perfumes', 1
WHERE NOT EXISTS (SELECT 1 FROM hero_slides LIMIT 1)
UNION ALL SELECT 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1920', 'Sneakers & Streetwear', 'Fresh kicks for every style.', '/shop?category=sneakers', 2
WHERE NOT EXISTS (SELECT 1 FROM hero_slides LIMIT 1)
UNION ALL SELECT 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1920', 'Request Any Item', 'Can''t find what you need? Tell us and we''ll source it for you.', '/request', 3
WHERE NOT EXISTS (SELECT 1 FROM hero_slides LIMIT 1);
