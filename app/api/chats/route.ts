import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { getUserOrderChatData, sendChatMessage } from '@/app/lib/chats';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const chatData = await getUserOrderChatData(user.id);
    return NextResponse.json({ success: true, data: chatData }, { status: 200 });
  } catch (error: any) {
    console.error('[API Chats GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch chats' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { receiver_id, text } = body;

    if (!text || !receiver_id) {
      return NextResponse.json({ error: 'receiver_id and text are required' }, { status: 400 });
    }

    const message = await sendChatMessage(user.id, receiver_id, text);

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error: any) {
    console.error('[API Chats POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}
