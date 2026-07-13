import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCurrentUser } from '@/app/lib/auth';
import { confirmPayment } from '@/app/lib/orders';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia' as any,
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.session_id || !body.order_id) {
      return NextResponse.json(
        { error: 'Missing required parameters: session_id, order_id' },
        { status: 400 }
      );
    }

    // Retrieve the Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(body.session_id);

    if (session.payment_status === 'paid') {
      // Update the database order(s) to 'paid'
      const orderIds = body.order_id.split(',');
      let lastUpdatedOrder = null;
      for (const id of orderIds) {
        if (id.trim()) {
          lastUpdatedOrder = await confirmPayment(id.trim(), body.session_id);
        }
      }
      return NextResponse.json({ success: true, data: lastUpdatedOrder }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: `Payment status is ${session.payment_status}. Order not completed.` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('[API Confirm Payment] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
