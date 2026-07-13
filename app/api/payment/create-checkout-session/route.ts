import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCurrentUser } from '@/app/lib/auth';

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
    if (!body.order_id || !body.value || !body.item_name) {
      return NextResponse.json(
        { error: 'Missing required session parameters: order_id, value, item_name' },
        { status: 400 }
      );
    }

    const origin = body.origin || new URL(request.url).origin;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd', // Standard currency for Stripe test cards
            product_data: {
              name: body.item_name,
              description: `Order ID: ${body.order_id}`,
            },
            unit_amount: Math.round(Number(body.value) * 100), // in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}&order_id=${body.order_id}`,
      cancel_url: `${origin}/?payment=cancel&order_id=${body.order_id}`,
      metadata: {
        order_id: body.order_id,
        customer_id: user.id,
      },
    });

    return NextResponse.json({ success: true, url: session.url }, { status: 200 });
  } catch (error: any) {
    console.error('[API Create Checkout Session] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
