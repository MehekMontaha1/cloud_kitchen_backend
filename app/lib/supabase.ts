import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    const val = process.env[key] || process.env[`VITE_${key}`] || process.env[`NEXT_PUBLIC_${key}`];
    if (val) return val;
  }
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv) {
      return metaEnv[key] || metaEnv[`VITE_${key}`] || metaEnv[`NEXT_PUBLIC_${key}`] || '';
    }
  } catch {}
  return '';
};

export const supabaseUrl = getEnv('SUPABASE_URL');
export const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');
const supabaseServiceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Anon client - for client-side and regular server operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

// Admin client - for server-side admin operations (requires service role key)
// If the service role key is not provided, export a safe stub that throws
// clear errors when admin operations are attempted. This avoids runtime
// crashes during registration rollbacks or admin routes when the key
// is missing in local/dev environments.
export const supabaseAdmin: any = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : {
      auth: {
        admin: {
          createUser: async () => {
            throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set; admin createUser unavailable');
          },
          deleteUser: async () => {
            throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set; admin deleteUser unavailable');
          },
        },
      },
      from: () => {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set; admin DB access unavailable');
      },
    };

// Helper function to get user from JWT token
export async function getUserFromToken(token: string) {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return data.user;
  } catch (error) {
    return null;
  }
}

// Helper function to get user profile with role and status
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[v0] Error fetching user profile:', error);
    return null;
  }
}

// Helper function to get user profile as admin (with service role)
export async function getUserProfileAsAdmin(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[v0] Error fetching user profile as admin:', error);
    return null;
  }
}

// Helper function to get user documents
export async function getUserDocuments(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[v0] Error fetching user documents:', error);
    return [];
  }
}

// Helper function to check if user is super admin
export async function isUserSuperAdmin(userId: string) {
  try {
    const profile = await getUserProfile(userId);
    return profile?.role === 'super_admin';
  } catch (error) {
    return false;
  }
}

// Helper function to check if user has approved status
export async function isUserApproved(userId: string) {
  try {
    const profile = await getUserProfile(userId);
    return profile?.status === 'approved';
  } catch (error) {
    return false;
  }
}

// Helper function to validate role
export function isValidRole(role: string): role is 'customer' | 'seller' | 'delivery_partner' {
  return ['customer', 'seller', 'delivery_partner'].includes(role);
}

// Helper function to check if user can register (prevent super_admin registration)
export function canRegisterWithRole(role: string): boolean {
  return isValidRole(role) && role !== 'super_admin';
}

// Helper function to get default status for role
export function getDefaultStatusForRole(role: string): 'pending' | 'approved' {
  if (role === 'customer') return 'approved'; // Customers auto-approved
  if (role === 'seller' || role === 'delivery_partner') return 'pending'; // Need approval
  return 'approved';
}
