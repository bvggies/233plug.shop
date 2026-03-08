-- Add Refunds & Returns page (editable in admin)
INSERT INTO site_pages (slug, title, content, meta_description)
VALUES (
  'refunds',
  'Refunds & Returns',
  '## Overview

At 233Plug we want you to be satisfied with your purchase. Please read this policy carefully so you understand when refunds and returns are possible.

## Items that have been shipped

**Once an item has been shipped, we do not offer refunds** unless we are able to find another buyer for the same item. In that case we may, at our discretion, process a refund after the item is returned to us and resold. Contact us with your order number if you believe this may apply to your situation.

## Requested / custom-sourced items

**Items that were requested through our Request-to-Buy service are not eligible for refunds or returns.** These are sourced specifically for you based on your request. By placing a request and accepting a quote, you agree that requested items are final sale.

## Before shipment

If you need to cancel or change your order before it has been shipped, contact us as soon as possible. We will do our best to accommodate you depending on order status.

## Damaged or incorrect items

If you receive an item that is damaged or not what you ordered, contact us with your order number and photos. We will work with you to resolve the issue, which may include replacement or a refund where appropriate.

## How to contact us

For any refund or return enquiry, use our Contact page with your order number and details. We will respond as quickly as we can.',
  '233Plug refunds and returns policy – shipped items, requested items, and exceptions'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_description = EXCLUDED.meta_description,
  updated_at = NOW();
