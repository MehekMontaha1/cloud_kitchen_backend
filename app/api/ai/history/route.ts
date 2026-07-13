import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { getAiChatHistory, type AiConversationType } from '@/app/lib/ai-chat-history';

const VALID_CONVERSATION_TYPES: AiConversationType[] = ['food_advisor', 'support'];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationType = (searchParams.get('conversation_type') || 'food_advisor') as AiConversationType;
    const requestedLimit = Number(searchParams.get('limit') || 50);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 50;

    if (!VALID_CONVERSATION_TYPES.includes(conversationType)) {
      return NextResponse.json({ error: 'Invalid conversation_type' }, { status: 400 });
    }

    const history = await getAiChatHistory(user.id, conversationType, limit);

    return NextResponse.json({
      success: true,
      data: history.map((item) => ({
        id: item.id,
        from: item.role === 'user' ? 'user' : 'ai',
        text: item.message,
        foodItemName: item.food_item_name,
        metadata: item.metadata || {},
        createdAt: item.created_at,
      })),
    }, { status: 200 });
  } catch (error: any) {
    console.error('[API AI History GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch AI chat history' }, { status: 500 });
  }
}
