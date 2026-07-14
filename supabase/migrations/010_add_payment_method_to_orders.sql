-- Migration: Add payment_method field to public.orders table
-- This stores whether an order is paid by Stripe or cash on delivery.

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe'
CHECK (payment_method IN ('stripe', 'cash_on_delivery'));

-- Existing orders can keep the default Stripe method unless updated elsewhere.