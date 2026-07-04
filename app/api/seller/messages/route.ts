import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { getSellerMessages, sendSellerMessage } from '@/app/lib/seller';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.profile.role !== 'seller') {
      return NextResponse.json({ error: 'Access denied. Only sellers can view their messages.' }, { status: 403 });
    }

    const messages = await getSellerMessages(user.id);

    return NextResponse.json({ success: true, data: messages }, { status: 200 });
  } catch (error: any) {
    console.error('[API Messages GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.profile.role !== 'seller') {
      return NextResponse.json({ error: 'Access denied. Sellers only.' }, { status: 403 });
    }

    const body = await request.json();
    const { receiver_id, text } = body;

    if (!text) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const message = await sendSellerMessage(user.id, receiver_id || user.id, text);

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error: any) {
    console.error('[API Seller Messages POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}

