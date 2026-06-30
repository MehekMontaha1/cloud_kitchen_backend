import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { updateDeliveryStatus } from '@/app/lib/delivery';

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.profile.role !== 'delivery_partner') {
      return NextResponse.json({ error: 'Access denied. Riders only.' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.orderId || !body.status) {
      return NextResponse.json({ error: 'Missing required fields: orderId, status' }, { status: 400 });
    }

    const updatedOrder = await updateDeliveryStatus(user.id, body.orderId, body.status);

    return NextResponse.json({
      success: true,
      message: 'Delivery status updated successfully',
      data: updatedOrder
    }, { status: 200 });
  } catch (error: any) {
    console.error('[API Delivery Status PUT] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update delivery status' }, { status: 500 });
  }
}
