import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { createCustomerOrder, getCustomerOrders } from '@/app/lib/orders';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const orders = await getCustomerOrders(user.id);
    return NextResponse.json({ success: true, data: orders }, { status: 200 });
  } catch (error: any) {
    console.error('[API Orders GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.item_name || !body.value) {
      return NextResponse.json({ error: 'Missing required order details: item_name, value' }, { status: 400 });
    }

    const deliveryLatitude = Number(body.delivery_latitude);
    const deliveryLongitude = Number(body.delivery_longitude);

    if (!body.delivery_address || !Number.isFinite(deliveryLatitude) || !Number.isFinite(deliveryLongitude)) {
      return NextResponse.json(
        { error: 'Please select a valid delivery location before placing an order' },
        { status: 400 }
      );
    }

    const order = await createCustomerOrder(user.id, {
      seller_id: body.seller_id || user.id, // Fallback seller ID if dummy item
      item_name: body.item_name,
      value: Number(body.value),
      delivery_address: body.delivery_address,
      delivery_latitude: deliveryLatitude,
      delivery_longitude: deliveryLongitude,
      type: body.type || 'Regular',
      items: body.items || null,
      payment_method: body.payment_method || 'stripe',
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error: any) {
    console.error('[API Orders POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to place order' }, { status: 500 });
  }
}
