-- ============================================================
-- Customer DB Schema & Spatial Setup for Cloud Kitchen
-- Save this file as customersql.sql in the project root.
-- ============================================================

-- 1. Ensure latitude and longitude exist on user profiles (customers, sellers, riders)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- 2. Add delivery location coordinates & tracking fields to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_latitude DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_longitude DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rider_latitude DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rider_longitude DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 25;

-- 3. Create indexes for fast spatial coordinate queries
CREATE INDEX IF NOT EXISTS idx_profiles_lat_lng ON public.profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 4. Set RLS Policies for orders (Customer view & tracking)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view and track their own orders" ON public.orders;
CREATE POLICY "Customers can view and track their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can place orders" ON public.orders;
CREATE POLICY "Customers can place orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);
