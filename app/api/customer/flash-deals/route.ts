import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data: offers, error } = await supabaseAdmin
      .from('flash_offers')
      .select(`
        *,
        seller:profiles!seller_id(full_name, shop_name, location, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (offers || [])
      .filter((offer: any) => {
        // Only show still-active offers
        const createdAt = new Date(offer.created_at).getTime();
        const totalSeconds = (offer.duration_minutes || 30) * 60;
        const elapsedSeconds = Math.floor((Date.now() - createdAt) / 1000);
        return elapsedSeconds < totalSeconds;
      })
      .map((offer: any) => {
        const createdAt = new Date(offer.created_at).getTime();
        const elapsedSeconds = Math.floor((Date.now() - createdAt) / 1000);
        const totalSeconds = (offer.duration_minutes || 30) * 60;
        const timeLeft = Math.max(0, totalSeconds - elapsedSeconds);

        return {
          id: offer.id,
          title: offer.title,
          seller: offer.seller?.shop_name || offer.seller?.full_name || 'Cloud Kitchen',
          sellerAvatar: offer.seller?.avatar_url || null,
          sellerId: offer.seller_id,
          discount: offer.discount,
          durationMinutes: offer.duration_minutes,
          timeLeft,
          itemIds: offer.item_ids || null,
          description: `${offer.discount}% OFF - Limited Time Offer`,
        };
      });

    return NextResponse.json({ success: true, data: mapped }, { status: 200 });
  } catch (error: any) {
    console.error('[API Customer Flash Deals GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch flash deals' }, { status: 500 });
  }
}
