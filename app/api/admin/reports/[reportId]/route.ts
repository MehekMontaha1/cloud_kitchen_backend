import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { updateReportStatus } from '@/app/lib/admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied. Admin only.' }, { status: 403 });
    }

    const { reportId } = await params;
    const body = await request.json();

    if (!body.status || !['open', 'investigating', 'resolved'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid or missing status value' }, { status: 400 });
    }

    const updated = await updateReportStatus(reportId, body.status);

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error: any) {
    console.error('[API Admin Report PUT] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update report status' }, { status: 500 });
  }
}
