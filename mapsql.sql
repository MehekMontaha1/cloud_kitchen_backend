-- ============================================================
-- Map Coordinates Optional Database Schema Update for Supabase
-- Save this file or run these commands in Supabase SQL Editor
-- ============================================================

-- 1. Add latitude and longitude to user profiles (sellers, customers, riders)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 2. Add latitude and longitude to orders table for custom delivery locations
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_latitude DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_longitude DOUBLE PRECISION;

-- 3. Create index for fast spatial lookup
CREATE INDEX IF NOT EXISTS idx_profiles_lat_lng ON public.profiles(latitude, longitude);
