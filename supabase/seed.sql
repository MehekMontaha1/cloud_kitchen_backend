-- Seed file to create demo super_admin user
-- This is a reference file. To execute:
-- 1. Use Supabase CLI: supabase db seed seed
-- 2. Or manually run these SQL commands in Supabase SQL editor

-- Create a super_admin user with known credentials (for development only)
-- Email: admin@cloudkitchen.com
-- Password: Admin@123456 (must be set in Auth tab, or use Supabase CLI)

-- Insert into profiles table after the auth user is created manually
INSERT INTO profiles (id, email, full_name, phone, role, status) 
VALUES 
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Replace with actual UUID from auth.users
    'admin@cloudkitchen.com',
    'Cloud Kitchen Admin',
    '+1234567890',
    'super_admin',
    'approved'
  )
ON CONFLICT (id) DO NOTHING;

-- Instructions:
-- 1. Create a user in Supabase Auth with email: admin@cloudkitchen.com
-- 2. Copy the user ID from auth.users table
-- 3. Replace 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' with the actual user ID
-- 4. Update the password in the Auth tab
-- 5. Run this seed file or execute the INSERT manually
