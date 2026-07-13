import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

function getAppOrigin(request: NextRequest) {
  const origin =
    request.headers.get('origin') ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    request.nextUrl.origin ||
    'http://localhost:5173';

  return origin.replace(/\/$/, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const redirectTo = `${getAppOrigin(request)}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent.',
    }, { status: 200 });
  } catch (error: any) {
    console.error('[API Forgot Password POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send password reset email' },
      { status: 500 }
    );
  }
}
