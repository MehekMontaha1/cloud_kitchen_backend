-- ============================================================
-- Delivery Partner (Rider) DB Schema Setup
-- Save this file as deliverymansql.sql in the project root.
-- ============================================================

-- 1. Add location column to profiles (for sellers and riders to match areas)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- 2. Add delivery_partner_id column to orders table to assign riders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Add index for faster query lookup
CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner_id ON public.orders(delivery_partner_id);

-- 4. Enable RLS and setup policies for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Delivery partners can manage orders they accepted" ON public.orders;
DROP POLICY IF EXISTS "Delivery partners can view available orders" ON public.orders;

-- Riders can view and update orders they have accepted
CREATE POLICY "Delivery partners can manage orders they accepted" ON public.orders
  FOR ALL USING (auth.uid() = delivery_partner_id);
