import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';
import { getRandomPriorChatContext, saveAiChatMessage } from '@/app/lib/ai-chat-history';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const priorChat = await getRandomPriorChatContext(user.id, 'support');

    await saveAiChatMessage({
      userId: user.id,
      conversationType: 'support',
      role: 'user',
      message: prompt,
      metadata: { source: 'support_chatbot' },
    });

    // Fetch active paid orders for this customer
    const { data: activeOrders } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        seller:profiles!seller_id(shop_name)
      `)
      .eq('customer_id', user.id)
      .or('payment_status.eq.paid,payment_method.eq.cash_on_delivery')
      .not('status', 'in', '("Delivered","Cancelled")');

    let activeOrdersContext = 'The user currently has no active orders in preparation or delivery.';
    if (activeOrders && activeOrders.length > 0) {
      activeOrdersContext = activeOrders
        .map(
          (o) =>
            `- Order ID: ${o.id}, Kitchen: ${o.seller?.shop_name || 'Cloud Kitchen'}, Items: ${
              o.item_name
            }, Status: ${o.status}, ETA: ${o.eta || '25 mins'}`
        )
        .join('\n');
    }

    const systemPrompt = `You are CloudBot, the official Customer Support Assistant for CloudKitchen.
Your mission is to resolve customer issues politely, helpfully, and very concisely (maximum 2 sentences or 35 words).

[Current Customer Active Orders Context]
${activeOrdersContext}
${priorChat.context ? `
[Occasional Previous Support Chat Context]
Use this only if it helps answer the current query. Do not mention it unless relevant.
${priorChat.context}
` : ''}

Instructions:
1. If the user asks about their order status (e.g. "where is my order", "track order", etc.), use the active orders context above to tell them the kitchen, items, status, and ETA. If they have no active orders, inform them.
2. If they ask about cancelation, explain that orders can only be canceled if they are still 'Pending' (not 'Preparing' or 'Ready').
3. Keep answers extremely short. Friendly and professional.

User Query: "${prompt}"`;

    let aiResponseText = '';

    if (apiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const textCandidate = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textCandidate) {
            aiResponseText = textCandidate.trim();
          }
        }
      } catch (geminiErr) {
        console.warn('[Gemini Support Bot] Direct API call error, using fallback:', geminiErr);
      }
    }

    // Smart fallback if Gemini is not configured or fails
    if (!aiResponseText) {
      const lowerPrompt = prompt.toLowerCase();
      if (
        lowerPrompt.includes('where') ||
        lowerPrompt.includes('status') ||
        lowerPrompt.includes('track') ||
        lowerPrompt.includes('order')
      ) {
        if (activeOrders && activeOrders.length > 0) {
          const first = activeOrders[0];
          aiResponseText = `Your order of "${first.item_name}" from ${
            first.seller?.shop_name || 'Cloud Kitchen'
          } is currently ${first.status}. It is estimated to arrive in ${first.eta || '25 mins'}.`;
        } else {
          aiResponseText = `You do not have any active orders right now. You can place a new order from the 'Nearby Foods' section on your dashboard.`;
        }
      } else if (lowerPrompt.includes('discount') || lowerPrompt.includes('coupon') || lowerPrompt.includes('promo')) {
        aiResponseText = `You can get a discount by using coupon codes like SAVE10 or WELCOME at the shopping cart checkout.`;
      } else if (lowerPrompt.includes('cancel')) {
        aiResponseText = `Orders can only be canceled if their status is 'Pending'. Once the kitchen starts 'Preparing' your food, cancellation is no longer possible.`;
      } else if (lowerPrompt.includes('contact') || lowerPrompt.includes('support') || lowerPrompt.includes('agent')) {
        aiResponseText = `You can contact our support team directly via email at support@cloudkitchen.com or phone at +880 1700-000000.`;
      } else {
        aiResponseText = `Hello! I'm CloudBot. How can I help you with your CloudKitchen order, menus, delivery status, or discounts today?`;
      }
    }

    await saveAiChatMessage({
      userId: user.id,
      conversationType: 'support',
      role: 'ai',
      message: aiResponseText,
      metadata: {
        source: 'support_chatbot',
        usedPreviousChat: priorChat.usedMemory,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        text: aiResponseText,
        usedPreviousChat: priorChat.usedMemory,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('[API Support Chat POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate support response' }, { status: 500 });
  }
}
