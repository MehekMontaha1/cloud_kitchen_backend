-- Migration: Add avatar_url to profiles and create profile-photos storage bucket

-- 1. Add avatar_url column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create storage bucket called "profile-photos" (run via Supabase dashboard or service role)
-- NOTE: Storage bucket creation must be done via Supabase dashboard or service role client.
-- Go to Supabase Dashboard > Storage > New Bucket > Name: profile-photos > Public: true
-- If using SQL (Supabase storage schema):
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS policies for profile-photos bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update/delete their own avatar
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to all profile photos
CREATE POLICY "Anyone can view profile photos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'profile-photos');
