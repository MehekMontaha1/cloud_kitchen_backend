import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { approveUser, rejectUser } from '@/app/lib/admin';

type RouteParams = {
  params: Promise<{ userId: string; action: string }>;
};

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, action } = await params;
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
        { error: 'Access denied. Only super admin can approve/reject users.' },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    let updatedUser;

    if (action === 'approve') {
      updatedUser = await approveUser(userId);
    } else if (action === 'reject') {
      updatedUser = await rejectUser(userId);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use approve or reject.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `User ${action}d successfully`,
        data: updatedUser,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[v0] User approval route error:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process approval' },
      { status: 500 }
    );
  }
}
