-- Editable site pages (About, Contact, Privacy, Terms)
CREATE TABLE IF NOT EXISTS site_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT,
  meta_description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site pages are viewable by everyone" ON site_pages FOR SELECT USING (true);
CREATE POLICY "Admins can manage site pages" ON site_pages FOR ALL USING (is_admin());

DROP TRIGGER IF EXISTS site_pages_updated_at ON site_pages;
CREATE TRIGGER site_pages_updated_at
  BEFORE UPDATE ON site_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FAQs are viewable by everyone" ON faqs FOR SELECT USING (true);
CREATE POLICY "Admins can manage FAQs" ON faqs FOR ALL USING (is_admin());

DROP TRIGGER IF EXISTS faqs_updated_at ON faqs;
CREATE TRIGGER faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view contact submissions" ON contact_submissions FOR SELECT USING (is_admin());
CREATE POLICY "Anyone can insert contact submissions" ON contact_submissions FOR INSERT WITH CHECK (true);

-- Seed site pages (skip if already exist)
INSERT INTO site_pages (slug, title, content, meta_description, contact_email, contact_phone, contact_address)
VALUES 
  ('about', 'About 233Plug', '233Plug is your trusted premium e-commerce platform, bringing you curated perfumes, sneakers, electronics, and accessories. Based in Ghana, we offer request-to-buy sourcing—if you can''t find what you need, tell us and we''ll source it for you.

## Our Mission
To make premium products accessible while supporting local entrepreneurship and transparent international trade.

## What We Offer
- **Curated Selection**: Handpicked products across categories
- **Request-to-Buy**: Can''t find something? We''ll source it
- **Secure Payment**: Paystack, Stripe, and wallet options
- **Reliable Delivery**: Shipped with care across Ghana and beyond', 'Learn about 233Plug - premium e-commerce and request-to-buy sourcing from Ghana', NULL, NULL, NULL),
  ('contact', 'Contact Us', 'Get in touch with our team. We typically respond within 24 hours.', 'Contact 233Plug - we''re here to help', 'hello@233plug.com', '+233 XX XXX XXXX', 'Accra, Ghana'),
  ('privacy', 'Privacy Policy', '## Information We Collect
We collect information you provide (name, email, address) when placing orders or contacting us.

## How We Use It
To process orders, respond to inquiries, and improve our services.

## Data Security
We use industry-standard encryption and do not share your data with third parties for marketing.

## Your Rights
You may request access to or deletion of your personal data at any time.', '233Plug privacy policy', NULL, NULL, NULL),
  ('terms', 'Terms of Service', '## Use of Service
By using 233Plug, you agree to these terms. You must be 18+ to place orders.

## Orders
Prices are in GHS unless stated. We reserve the right to refuse orders.

## Returns
See our return policy on product pages. Unused items may be returned within 14 days.

## Liability
We are not liable for delays beyond our control or misuse of products.', '233Plug terms of service', NULL, NULL, NULL)
ON CONFLICT (slug) DO NOTHING;

-- Seed FAQs (only when empty)
INSERT INTO faqs (question, answer, sort_order)
SELECT 'How do I place an order?', 'Browse the shop, add items to cart, and proceed to checkout. Sign in or create an account to complete your order.', 0
WHERE NOT EXISTS (SELECT 1 FROM faqs LIMIT 1)
UNION ALL SELECT 'Can I request items not in the shop?', 'Yes! Use our Request page to describe what you need. We''ll source it and send you a quote.', 1
WHERE NOT EXISTS (SELECT 1 FROM faqs LIMIT 1)
UNION ALL SELECT 'What payment methods do you accept?', 'We accept Paystack (GHS), Stripe (USD), and wallet payments. Your payment is secure.', 2
WHERE NOT EXISTS (SELECT 1 FROM faqs LIMIT 1)
UNION ALL SELECT 'How long does delivery take?', 'Delivery within Ghana typically takes 5–10 business days. International shipping is available on request.', 3
WHERE NOT EXISTS (SELECT 1 FROM faqs LIMIT 1)
UNION ALL SELECT 'What is your return policy?', 'Unused items may be returned within 14 days. Contact support to initiate a return.', 4
WHERE NOT EXISTS (SELECT 1 FROM faqs LIMIT 1);
