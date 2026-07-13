-- Migration: Add payment fields to public.orders table
-- Save this as 003_add_payment_fields_to_orders.sql in the migrations folder.

-- 1. Add payment_status field (unpaid, paid, refunded)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded'));

-- 2. Add stripe_session_id field to store Stripe session ID
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
