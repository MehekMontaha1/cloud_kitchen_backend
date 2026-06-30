import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/app/lib/auth';
import type { RegisterPayload } from '@/app/types';

export async function POST(request: NextRequest) {
  try {
    const body: RegisterPayload = await request.json();

    // Basic validation
    if (!body.email || !body.password || !body.full_name || !body.phone || !body.role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, full_name, phone, role' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Phone validation (basic)
    if (body.phone.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    const result = await registerUser(body);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('[v0] Register route error:', error);

    // Handle specific Supabase errors
    if (error.message?.includes('duplicate') || error.message?.includes('already been registered') || error.message?.includes('already exists')) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    if (error.message?.includes('super_admin')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
