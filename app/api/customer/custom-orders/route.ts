import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { getCustomerCustomOrders } from '@/app/lib/orders';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const orders = await getCustomerCustomOrders(user.id);

    return NextResponse.json({ success: true, data: orders }, { status: 200 });
  } catch (error: any) {
    console.error('[API Customer Custom Orders GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch custom orders' }, { status: 500 });
  }
}