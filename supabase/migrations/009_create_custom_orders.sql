-- Migration: Create dedicated custom orders table for seller review

CREATE TABLE IF NOT EXISTS public.custom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT NOT NULL,
  note TEXT,
  cuisine TEXT NOT NULL DEFAULT 'any',
  urgency TEXT NOT NULL DEFAULT 'standard',
  budget NUMERIC(10, 2) NOT NULL CHECK (budget >= 0),
  delivery_address TEXT NOT NULL,
  delivery_latitude DOUBLE PRECISION NOT NULL,
  delivery_longitude DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Preparing', 'Ready', 'Cancelled')),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_orders_customer_id ON public.custom_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_seller_id ON public.custom_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON public.custom_orders(status);

ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view their own custom orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Customers can place custom orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Sellers can manage their own custom orders" ON public.custom_orders;

CREATE POLICY "Customers can view their own custom orders" ON public.custom_orders
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can place custom orders" ON public.custom_orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Sellers can manage their own custom orders" ON public.custom_orders
  FOR ALL USING (auth.uid() = seller_id);

DROP TRIGGER IF EXISTS update_custom_orders_updated_at ON public.custom_orders;
CREATE TRIGGER update_custom_orders_updated_at
BEFORE UPDATE ON public.custom_orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();