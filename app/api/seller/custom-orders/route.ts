import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { getSellerCustomOrders, updateSellerCustomOrderStatus } from '@/app/lib/seller';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.profile.role !== 'seller') {
      return NextResponse.json({ error: 'Access denied. Only sellers can view custom orders.' }, { status: 403 });
    }

    const orders = await getSellerCustomOrders(user.id);

    return NextResponse.json({ success: true, data: orders }, { status: 200 });
  } catch (error: any) {
    console.error('[API Seller Custom Orders GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch custom orders' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.profile.role !== 'seller') {
      return NextResponse.json({ error: 'Access denied. Only sellers can update custom orders.' }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
    }

    const updated = await updateSellerCustomOrderStatus(user.id, orderId, status);

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error: any) {
    console.error('[API Seller Custom Orders PUT] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update custom order' }, { status: 500 });
  }
}