import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { getAllUsers } from '@/app/lib/admin';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Check if user is authenticated and is super_admin
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (user.profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Access denied. Only super admin can view all users.' },
        { status: 403 }
      );
    }

    const users = await getAllUsers();

    return NextResponse.json(
      {
        success: true,
        data: users,
        total: users.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[v0] Get all users route error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
