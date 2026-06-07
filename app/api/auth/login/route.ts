import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/app/lib/auth';
import type { LoginPayload } from '@/app/types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginPayload = await request.json();

    // Basic validation
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password' },
        { status: 400 }
      );
    }

    const result = await loginUser(body);

    // Create response with user data
    const response = NextResponse.json(
      {
        success: true,
        user: result.user,
        profile: result.profile,
        message: result.profile.status === 'approved' 
          ? 'Login successful' 
          : 'Login successful. Your account is pending approval.',
      },
      { status: 200 }
    );

    return response;
  } catch (error: any) {
    console.error('[v0] Login route error:', error);

    // Handle specific errors
    if (error.message?.includes('Invalid login credentials')) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (error.message?.includes('user_not_found')) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
