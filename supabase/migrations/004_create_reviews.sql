-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_name TEXT,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow public read access to reviews" ON public.reviews;
CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow customers to insert reviews" ON public.reviews;
CREATE POLICY "Allow customers to insert reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
