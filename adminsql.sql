-- ============================================================
-- Admin DB Schema Setup (Reports Table)
-- Save this file as adminsql.sql in the project root.
-- ============================================================

-- 1. Create table for user reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own reports" ON public.reports;
DROP POLICY IF EXISTS "Admin can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admin can update reports" ON public.reports;

-- RLS Policies
CREATE POLICY "Users can insert their own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Note: Admin runs with service-role (supabaseAdmin) which bypasses RLS entirely.
-- We can add select policy for admin just for SQL editor convenience:
CREATE POLICY "Admin can view all reports" ON public.reports
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );
