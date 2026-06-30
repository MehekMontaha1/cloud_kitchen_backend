-- ============================================================
-- Sellers DB Schema Setup
-- Save this file as sellersql.sql in the supabase directory.
-- ============================================================

-- 1. Create table for menu items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Food',
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 50 CHECK (stock >= 0),
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'paused')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Sellers can manage their own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;

-- Policies for menu_items
CREATE POLICY "Sellers can manage their own menu items" ON public.menu_items
  FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Anyone can view menu items" ON public.menu_items
  FOR SELECT USING (true);


-- 2. Create table for orders (linking customer and seller)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Regular' CHECK (type IN ('Regular', 'Custom')),
  eta TEXT NOT NULL DEFAULT '20 min',
  status TEXT NOT NULL DEFAULT 'Preparing' CHECK (status IN ('Pending', 'Preparing', 'Ready', 'Quoted', 'Delivered', 'Cancelled')),
  value NUMERIC(10, 2) NOT NULL CHECK (value >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Sellers can manage their own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;

-- Policies for orders
CREATE POLICY "Sellers can manage their own orders" ON public.orders
  FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Customers can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = customer_id);


-- 3. Create table for flash offers
CREATE TABLE IF NOT EXISTS public.flash_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  discount INTEGER NOT NULL CHECK (discount >= 0 AND discount <= 100),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.flash_offers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Sellers can manage their own flash offers" ON public.flash_offers;
DROP POLICY IF EXISTS "Anyone can view flash offers" ON public.flash_offers;

-- Policies for flash_offers
CREATE POLICY "Sellers can manage their own flash offers" ON public.flash_offers
  FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Anyone can view flash offers" ON public.flash_offers
  FOR SELECT USING (true);


-- 4. Create table for messages between customers and sellers
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  unread BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage messages they sent or received" ON public.messages;

-- Policies for messages
CREATE POLICY "Users can manage messages they sent or received" ON public.messages
  FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);


-- 5. Create storage bucket for menu item images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu_image', 'menu_image', true) 
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if any
DROP POLICY IF EXISTS "Allow public select on menu_image" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated operations on menu_image" ON storage.objects;

-- Create policies for storage.objects on the menu_image bucket
CREATE POLICY "Allow public select on menu_image" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu_image');

CREATE POLICY "Allow authenticated operations on menu_image" ON storage.objects
  FOR ALL USING (bucket_id = 'menu_image');
