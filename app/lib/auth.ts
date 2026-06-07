import { cookies } from 'next/headers';
import { supabase, supabaseAdmin, getUserProfile, getDefaultStatusForRole } from './supabase';
import type { RegisterPayload, LoginPayload, AuthResponse } from '@/app/types';

const AUTH_COOKIE_NAME = 'cloud-kitchen-auth';
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

// Register a new user
export async function registerUser(payload: RegisterPayload) {
  try {
    // Validate payload
    if (!payload.email || !payload.password || !payload.full_name || !payload.phone) {
      throw new Error('Missing required fields');
    }

    if (payload.role === 'super_admin') {
      throw new Error('Cannot register as super_admin');
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create auth user');

    // Create profile with status based on role
    const defaultStatus = getDefaultStatusForRole(payload.role);

    // Prefer admin client for profile creation (bypass RLS); fall back to anon client
    const dbClient: any = supabaseAdmin && supabaseAdmin.from ? supabaseAdmin : supabase;

    const { data: profileData, error: profileError } = await dbClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: payload.email,
        full_name: payload.full_name,
        phone: payload.phone,
        role: payload.role,
        status: defaultStatus,
      })
      .select()
      .single();

    if (profileError) {
      // Rollback - delete the auth user (best-effort)
      try {
        if (supabaseAdmin?.auth?.admin?.deleteUser) {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        } else {
          console.warn('[v0] supabaseAdmin.deleteUser not available, skipping rollback');
        }
      } catch (rbError) {
        console.error('[v0] Rollback deleteUser failed:', rbError);
      }
      throw profileError;
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
      },
      profile: profileData,
      message: defaultStatus === 'pending' ? 'Registration successful. Awaiting admin approval.' : 'Registration successful!',
    };
  } catch (error) {
    console.error('[v0] Register error:', error);
    throw error;
  }
}

// Login a user
export async function loginUser(payload: LoginPayload) {
  try {
    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (authError) throw authError;
    if (!authData.user || !authData.session) throw new Error('Failed to login');

    // Get user profile
    const profile = await getUserProfile(authData.user.id);
    if (!profile) throw new Error('User profile not found');

    // Store JWT in secure httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, authData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: '/',
    });

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
      },
      profile,
      token: authData.session.access_token,
    };
  } catch (error) {
    console.error('[v0] Login error:', error);
    throw error;
  }
}

// Get current user from cookie
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) return null;

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;

    // Get profile
    const profile = await getUserProfile(data.user.id);
    if (!profile) return null;

    return {
      id: data.user.id,
      email: data.user.email,
      profile,
    };
  } catch (error) {
    console.error('[v0] Get current user error:', error);
    return null;
  }
}

// Logout user
export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
    return { success: true };
  } catch (error) {
    console.error('[v0] Logout error:', error);
    throw error;
  }
}

// Get token from cookie (for route handlers)
export async function getTokenFromCookie() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE_NAME)?.value || null;
  } catch (error) {
    console.error('[v0] Get token error:', error);
    return null;
  }
}
