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

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy 2: Super admin can view all profiles
CREATE POLICY "Super admin can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 3: Users can update their own profile (limited fields)
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Policy 4: Super admin can update any profile (including status)
CREATE POLICY "Super admin can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 5: Super admin can insert profiles (for manual customer creation)
CREATE POLICY "Super admin can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 6: Super admin can delete profiles (for customer deletion)
CREATE POLICY "Super admin can delete profiles" ON profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- RLS Policies for user_documents table

-- Policy 1: Users can view their own documents
CREATE POLICY "Users can view their own documents" ON user_documents
  FOR SELECT USING (
    user_id = (SELECT id FROM profiles WHERE id = auth.uid())
  );

-- Policy 2: Super admin can view all documents
CREATE POLICY "Super admin can view all documents" ON user_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 3: Users can insert their own documents
CREATE POLICY "Users can insert their own documents" ON user_documents
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM profiles WHERE id = auth.uid())
  );

-- Policy 4: Super admin can insert documents for any user
CREATE POLICY "Super admin can insert documents for any user" ON user_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

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
