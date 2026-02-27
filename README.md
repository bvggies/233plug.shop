# 233Plug - Premium E-Commerce Platform

Full-stack e-commerce with Request-to-Buy, bi-weekly shipments, wallet, referrals, and Paystack/Stripe payments.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Paystack (GHS), Stripe (USD)
- **Deployment**: Vercel

## Setup

1. **Clone and install**
   ```bash
   npm install
   ```

2. **Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Run migrations in `supabase/migrations/` via SQL Editor
   - Enable Email auth in Authentication > Providers

3. **Environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase URL and anon key
   - Add Paystack/Stripe keys for payments

4. **Run**
   ```bash
   npm run dev
   ```

## Database Migrations

Run in Supabase SQL Editor (in order):
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_seed_data.sql`

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Features

- Homepage with hero, categories, featured products, countdown
- Shop with filters and product cards
- Product detail with image carousel
- Request-to-Buy multi-step form
- Cart and checkout (Paystack, Stripe, Wallet)
- User dashboard: Orders, Requests, Wallet, Referrals, Profile
- Admin dashboard: Products, Requests, Shipments, Coupons
- Glass FAB mobile nav, responsive design
