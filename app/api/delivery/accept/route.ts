import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { acceptOrderForRider } from '@/app/lib/delivery';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.profile.role !== 'delivery_partner') {
      return NextResponse.json({ error: 'Access denied. Riders only.' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.orderId) {
      return NextResponse.json({ error: 'Missing required field: orderId' }, { status: 400 });
    }

    const updatedOrder = await acceptOrderForRider(user.id, body.orderId);

    return NextResponse.json({
      success: true,
      message: 'Order accepted successfully',
      data: updatedOrder
    }, { status: 200 });
  } catch (error: any) {
    console.error('[API Delivery Accept POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to accept order' }, { status: 500 });
  }
}
