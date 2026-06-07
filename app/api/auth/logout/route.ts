import { NextRequest, NextResponse } from 'next/server';
import { logoutUser } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await logoutUser();

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[v0] Logout route error:', error);

    return NextResponse.json(
      { error: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}
