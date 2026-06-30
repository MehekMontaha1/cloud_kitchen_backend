import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { publishFlashOffer } from '@/app/lib/seller';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.profile.role !== 'seller') {
      return NextResponse.json({ error: 'Access denied. Only sellers can publish flash offers.' }, { status: 403 });
    }

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
    });

    return NextResponse.json({ success: true, data: newOffer }, { status: 201 });
  } catch (error: any) {
    console.error('[API Offers POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to publish flash offer' }, { status: 500 });
  }
}
