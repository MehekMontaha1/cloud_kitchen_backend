import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { getAcceptedOrdersForRider } from '@/app/lib/delivery';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.profile.role !== 'delivery_partner') {
      return NextResponse.json({ error: 'Access denied. Riders only.' }, { status: 403 });
    }

    const orders = await getAcceptedOrdersForRider(user.id);

    return NextResponse.json({ success: true, data: orders }, { status: 200 });
  } catch (error: any) {
    console.error('[API Delivery Accepted GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch accepted orders' }, { status: 500 });
  }
}
