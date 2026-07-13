import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('seller_id');

    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 });
    }

    // Fetch reviews for the seller
    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: reviews || [] }, { status: 200 });
  } catch (error: any) {
    console.error('[API Reviews GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { seller_id, rating, comment } = body;

    if (!seller_id || !rating) {
      return NextResponse.json({ error: 'Seller ID and rating are required' }, { status: 400 });
    }

    // 1. Antifake Verification Check:
    // Verify that this customer has at least one paid and delivered order from this kitchen
    const { data: verifiedOrders, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('customer_id', user.id)
      .eq('seller_id', seller_id)
      .eq('status', 'Delivered')
      .eq('payment_status', 'paid')
      .limit(1);

    if (orderError) throw orderError;

    if (!verifiedOrders || verifiedOrders.length === 0) {
      return NextResponse.json(
        { error: 'Verification failed: You can only review kitchens where you have a completed delivery.' },
        { status: 403 }
      );
    }

    // 2. Fetch customer's name from profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const customerName = profile?.full_name || 'Anonymous Customer';

    // 3. Insert review
    const { data: newReview, error: insertError } = await supabaseAdmin
      .from('reviews')
      .insert({
        customer_id: user.id,
        customer_name: customerName,
        seller_id,
        rating: Number(rating),
        comment: comment || '',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, data: newReview }, { status: 201 });
  } catch (error: any) {
    console.error('[API Reviews POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to post review' }, { status: 500 });
  }
}
