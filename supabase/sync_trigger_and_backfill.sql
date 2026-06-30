-- ============================================================
-- Run this in Supabase Dashboard > SQL Editor > New Query
-- Fixes the infinite-recursion RLS policies and cleans up
-- ============================================================

-- 1. DROP the broken trigger (if it still exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Fix profiles RLS policies (drop the ones that cause infinite recursion)

-- Drop ALL existing policies on profiles (clean slate)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admin can update any profile" ON profiles;
DROP POLICY IF EXISTS "Super admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admin can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Drop ALL existing policies on user_documents
DROP POLICY IF EXISTS "Users can view their own documents" ON user_documents;
DROP POLICY IF EXISTS "Super admin can view all documents" ON user_documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON user_documents;
DROP POLICY IF EXISTS "Super admin can insert documents for any user" ON user_documents;

-- 3. Recreate profiles RLS policies WITHOUT self-referencing subqueries
--    Instead of querying profiles to check admin role, we use auth.jwt() metadata

-- Users can always read their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (needed during registration)
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Recreate user_documents RLS policies WITHOUT self-referencing subqueries

-- Users can view their own documents
CREATE POLICY "Users can view their own documents" ON user_documents
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own documents
CREATE POLICY "Users can insert their own documents" ON user_documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 5. Backfill: create profile rows for any auth.users missing from profiles
INSERT INTO public.profiles (id, email, full_name, phone, role, status)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', ''),
  COALESCE(u.raw_user_meta_data->>'phone', ''),
  CASE 
    WHEN (u.raw_user_meta_data->>'role') = 'delivery' THEN 'delivery_partner'::user_role
    WHEN (u.raw_user_meta_data->>'role') = 'delivery_partner' THEN 'delivery_partner'::user_role
    WHEN (u.raw_user_meta_data->>'role') = 'admin' THEN 'super_admin'::user_role
    WHEN (u.raw_user_meta_data->>'role') = 'super_admin' THEN 'super_admin'::user_role
    WHEN (u.raw_user_meta_data->>'role') = 'seller' THEN 'seller'::user_role
    ELSE 'customer'::user_role
  END,
  CASE 
    WHEN (u.raw_user_meta_data->>'role') IN ('seller', 'delivery', 'delivery_partner') THEN 'pending'::approval_status
    ELSE 'approved'::approval_status
  END
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- NOTE: All admin operations (view all profiles, approve/reject users, etc.)
-- are handled by the backend using the service-role key (supabaseAdmin),
-- which bypasses RLS entirely. No admin RLS policies needed.
