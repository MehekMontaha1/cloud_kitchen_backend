import { supabaseAdmin } from './supabase';

export type AiConversationType = 'food_advisor' | 'support';
export type AiChatRole = 'user' | 'ai';

export interface AiChatHistoryRow {
  id: string;
  user_id: string;
  conversation_type: AiConversationType;
  role: AiChatRole;
  message: string;
  food_item_name: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

const MEMORY_REUSE_PROBABILITY = 0.35;
const MEMORY_HISTORY_LIMIT = 12;
const MAX_MEMORY_MESSAGE_CHARS = 240;

function truncateForPrompt(value: string, maxLength = MAX_MEMORY_MESSAGE_CHARS) {
  const cleanValue = value.replace(/\s+/g, ' ').trim();
  if (cleanValue.length <= maxLength) return cleanValue;
  return `${cleanValue.slice(0, maxLength - 3)}...`;
}

export async function saveAiChatMessage(input: {
  userId: string;
  conversationType: AiConversationType;
  role: AiChatRole;
  message: string;
  foodItemName?: string | null;
  metadata?: Record<string, any>;
}) {
  const message = input.message?.trim();
  if (!message) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from('ai_chat_history')
      .insert({
        user_id: input.userId,
        conversation_type: input.conversationType,
        role: input.role,
        message,
        food_item_name: input.foodItemName || null,
        metadata: input.metadata || {},
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as AiChatHistoryRow;
  } catch (error) {
    console.warn('[AI Chat History] Failed to save message:', error);
    return null;
  }
}

export async function getAiChatHistory(
  userId: string,
  conversationType: AiConversationType,
  limit = 50
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_chat_history')
      .select('*')
      .eq('user_id', userId)
      .eq('conversation_type', conversationType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return ((data || []) as AiChatHistoryRow[]).reverse();
  } catch (error) {
    console.warn('[AI Chat History] Failed to load history:', error);
    return [];
  }
}

export async function getRandomPriorChatContext(
  userId: string,
  conversationType: AiConversationType
) {
  if (Math.random() > MEMORY_REUSE_PROBABILITY) {
    return { usedMemory: false, context: '' };
  }

  const history = await getAiChatHistory(userId, conversationType, MEMORY_HISTORY_LIMIT);
  if (history.length < 2) {
    return { usedMemory: false, context: '' };
  }

  const context = history
    .map((item) => {
      const speaker = item.role === 'user' ? 'User' : 'AI';
      return `${speaker}: ${truncateForPrompt(item.message)}`;
    })
    .join('\n');

  return {
    usedMemory: Boolean(context),
    context,
  };
}
