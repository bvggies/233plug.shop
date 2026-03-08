-- Add Shipping Policy page (editable in admin)
INSERT INTO site_pages (slug, title, content, meta_description)
VALUES (
  'shipping',
  'Shipping Policy',
  '## Delivery within Ghana

We ship to all regions in Ghana. Orders are typically processed within 1–2 business days after payment confirmation.

- **Standard delivery**: 5–10 business days
- **Free shipping** on orders over GHS 500
- Orders below GHS 500 may incur a delivery fee at checkout

You will receive tracking updates (where available) so you can follow your order.

## International shipping

International shipping is available on request. Contact us before placing your order so we can confirm availability and provide a shipping quote for your location.

## Shipping address

Please ensure your delivery address and contact number are correct at checkout. We are not responsible for failed or delayed delivery due to incorrect or incomplete address details.

## Lost or damaged items

If your order arrives damaged or does not arrive within the expected timeframe, contact us with your order number and we will work to resolve the issue.

## Changes

We may update this shipping policy from time to time. The current version is always available on this page.',
  '233Plug shipping and delivery policy – Ghana and international'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_description = EXCLUDED.meta_description,
  updated_at = NOW();
