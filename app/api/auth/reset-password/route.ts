import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAnonKey, supabaseUrl } from '@/app/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accessToken = String(body.access_token || '').trim();
    const refreshToken = String(body.refresh_token || '').trim();
    const password = String(body.password || '');

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Reset link is missing or expired. Please request a new password reset email.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const recoveryClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { error: sessionError } = await recoveryClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      return NextResponse.json(
        { error: 'Reset link is invalid or expired. Please request a new password reset email.' },
        { status: 400 }
      );
    }

    const { error: updateError } = await recoveryClient.auth.updateUser({
      password,
    });

    if (updateError) throw updateError;

    await recoveryClient.auth.signOut().catch(() => null);

    return NextResponse.json({
      success: true,
      message: 'Password updated. You can now log in with your new password.',
    }, { status: 200 });
  } catch (error: any) {
    console.error('[API Reset Password POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}
