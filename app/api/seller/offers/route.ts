import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { publishFlashOffer } from '@/app/lib/seller';
import { supabaseAdmin } from '@/app/lib/supabase';

// GET: fetch all active flash offers for this seller
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (user.profile.role !== 'seller') return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from('flash_offers')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Annotate each offer with timeLeft
    const now = Date.now();
    const mapped = (data || []).map((offer: any) => {
      const createdMs = new Date(offer.created_at).getTime();
      const totalSec = (offer.duration_minutes || 30) * 60;
      const elapsedSec = Math.floor((now - createdMs) / 1000);
      const timeLeft = Math.max(0, totalSec - elapsedSec);
      return { ...offer, timeLeft, isActive: timeLeft > 0 };
    });

    return NextResponse.json({ success: true, data: mapped }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch offers' }, { status: 500 });
  }
}

// POST: publish new flash offer
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (user.profile.role !== 'seller') return NextResponse.json({ error: 'Access denied. Only sellers can publish flash offers.' }, { status: 403 });

    const body = await request.json();
    if (!body.title || body.discount === undefined || body.duration === undefined) {
      return NextResponse.json({ error: 'Missing required fields: title, discount, duration' }, { status: 400 });
    }

    const discount = Number(body.discount);
    const duration = Number(body.duration);

    if (isNaN(discount) || discount < 0 || discount > 100) {
      return NextResponse.json({ error: 'Invalid discount percentage' }, { status: 400 });
    }
    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json({ error: 'Invalid duration minutes' }, { status: 400 });
    }

    const newOffer = await publishFlashOffer(user.id, {
      title: body.title,
      discount: discount,
      duration: duration,
      item_ids: body.item_ids || null,
    });

    return NextResponse.json({ success: true, data: newOffer }, { status: 201 });
  } catch (error: any) {
    console.error('[API Offers POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to publish flash offer' }, { status: 500 });
  }
}

// PATCH: edit an existing flash offer
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (user.profile.role !== 'seller') return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: 'Offer id is required' }, { status: 400 });

    const updates: any = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.discount !== undefined) updates.discount = Number(body.discount);
    if (body.duration !== undefined) {
      updates.duration_minutes = Number(body.duration);
      // Reset created_at to extend the offer from now
      updates.created_at = new Date().toISOString();
    }
    if (body.item_ids !== undefined) updates.item_ids = body.item_ids;

    const { data, error } = await supabaseAdmin
      .from('flash_offers')
      .update(updates)
      .eq('id', body.id)
      .eq('seller_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to edit offer' }, { status: 500 });
  }
}

// DELETE: remove a flash offer
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (user.profile.role !== 'seller') return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Offer id is required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('flash_offers')
      .delete()
      .eq('id', id)
      .eq('seller_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete offer' }, { status: 500 });
  }
}

