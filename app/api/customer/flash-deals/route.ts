import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data: offers, error } = await supabaseAdmin
      .from('flash_offers')
      .select(`
        *,
        seller:profiles!seller_id(full_name, shop_name, location)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (offers || []).map((offer: any) => {
      const createdAt = new Date(offer.created_at).getTime();
      const durationMs = (offer.duration_minutes || 30) * 60 * 1000;
      const elapsedSeconds = Math.floor((Date.now() - createdAt) / 1000);
      const totalSeconds = (offer.duration_minutes || 30) * 60;
      const timeLeft = Math.max(0, totalSeconds - elapsedSeconds);

      return {
        id: offer.id,
        title: offer.title,
        seller: offer.seller?.shop_name || offer.seller?.full_name || 'Cloud Kitchen',
        discount: offer.discount,
        durationMinutes: offer.duration_minutes,
        timeLeft,
        description: `${offer.discount}% OFF - Limited Time Offer`,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      };
    });

    return NextResponse.json({ success: true, data: mapped }, { status: 200 });
  } catch (error: any) {
    console.error('[API Customer Flash Deals GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch flash deals' }, { status: 500 });
  }
}
