-- Create enum types for role and status
CREATE TYPE user_role AS ENUM ('customer', 'seller', 'delivery_partner', 'super_admin');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Create profiles table linked to auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  status approval_status NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_documents table for seller and delivery partner licenses
CREATE TABLE user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'license', 'id_proof', etc.
  document_url TEXT NOT NULL, -- Stored in Supabase Storage
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, document_type)
);

-- Create indexes for faster queries
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_user_documents_user_id ON user_documents(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
-- NOTE: Admin operations use service-role key (supabaseAdmin) which bypasses RLS.
-- Only user-facing policies are needed here.

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (needed during registration)
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_documents table

-- Users can view their own documents
CREATE POLICY "Users can view their own documents" ON user_documents
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own documents
CREATE POLICY "Users can insert their own documents" ON user_documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for profiles.updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- NOTE: Profile creation is handled by the backend API (app/lib/auth.ts)
-- using supabaseAdmin.auth.admin.createUser() + supabaseAdmin.from('profiles').upsert()
-- Do NOT add triggers on auth.users.
