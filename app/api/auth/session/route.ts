import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
        profile: user.profile,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[v0] Session route error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
