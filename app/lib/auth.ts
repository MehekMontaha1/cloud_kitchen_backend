import { cookies } from 'next/headers';
import { supabase, supabaseAdmin, getUserProfile, getUserProfileAsAdmin, getDefaultStatusForRole } from './supabase';
import type { RegisterPayload, LoginPayload, AuthResponse } from '@/app/types';

const AUTH_COOKIE_NAME = 'cloud-kitchen-auth';
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

// Register a new user (production-grade: uses admin API, no trigger dependency)
export async function registerUser(payload: RegisterPayload) {
  try {
    // Validate payload
    if (!payload.email || !payload.password || !payload.full_name || !payload.phone) {
      throw new Error('Missing required fields');
    }

    if (payload.role === 'super_admin') {
      throw new Error('Cannot register as super_admin');
    }

    const defaultStatus = getDefaultStatusForRole(payload.role);

    // Step 1: Create auth user via admin API (bypasses triggers and email confirmation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true, // auto-confirm for this app
      user_metadata: {
        name: payload.full_name,
        role: payload.role,
        phone: payload.phone,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create auth user');

    // Step 2: Create profile row using service-role client (bypasses RLS)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
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
      // Rollback: delete the auth user
      console.error('[Backend] Profile creation failed, rolling back auth user:', profileError);
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (rbError) {
        console.error('[Backend] Rollback deleteUser failed:', rbError);
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
      message: defaultStatus === 'pending'
        ? 'Registration successful. Awaiting admin approval.'
        : 'Registration successful!',
    };
  } catch (error) {
    console.error('[Backend] Register error:', error);
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

    // Get user profile (use admin client to bypass RLS for reliability)
    const profile = await getUserProfileAsAdmin(authData.user.id);
    if (!profile) throw new Error('User profile not found. Please contact support.');

    // For sellers and delivery partners, verify they are approved by the admin
    if ((profile.role === 'seller' || profile.role === 'delivery_partner') && profile.status !== 'approved') {
      await supabase.auth.signOut();
      if (profile.status === 'rejected') {
        throw new Error('Your registration has been rejected by the administrator.');
      }
      throw new Error('Your registration is pending approval by the administrator.');
    }

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
    console.error('[Backend] Login error:', error);
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

    // Get profile (use admin client for reliability)
    const profile = await getUserProfileAsAdmin(data.user.id);
    if (!profile) return null;

    return {
      id: data.user.id,
      email: data.user.email,
      profile,
    };
  } catch (error) {
    console.error('[Backend] Get current user error:', error);
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
    console.error('[Backend] Logout error:', error);
    throw error;
  }
}

// Get token from cookie (for route handlers)
export async function getTokenFromCookie() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE_NAME)?.value || null;
  } catch (error) {
    console.error('[Backend] Get token error:', error);
    return null;
  }
}
