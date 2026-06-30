import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { getSellerEarnings } from '@/app/lib/seller';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.profile.role !== 'seller') {
      return NextResponse.json({ error: 'Access denied. Only sellers can view their earnings.' }, { status: 403 });
    }

    const earnings = await getSellerEarnings(user.id);

    return NextResponse.json({ success: true, data: earnings }, { status: 200 });
  } catch (error: any) {
    console.error('[API Earnings GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch earnings metrics' }, { status: 500 });
  }
}
