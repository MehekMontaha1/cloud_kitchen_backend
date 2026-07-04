import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { getOrderTrackingDetails } from '@/app/lib/orders';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: orderId } = await params;
    const trackingData = await getOrderTrackingDetails(orderId, user.id);

    return NextResponse.json({ success: true, data: trackingData }, { status: 200 });
  } catch (error: any) {
    console.error('[API Order Track GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch order tracking' }, { status: 500 });
  }
}
