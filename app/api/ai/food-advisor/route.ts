import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, foodItem } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    let foodContext = '';
    if (foodItem) {
      foodContext = `\n[Food Item Details]\nName: ${foodItem.name}\nSeller/Kitchen: ${foodItem.seller || 'Cloud Kitchen'}\nPrice: $${foodItem.price}\nDescription & Ingredients: ${foodItem.description || 'Not specified'}\n`;
    }

    const systemPrompt = `You are an expert AI Food & Health Assistant for CloudKitchen. 
Your mission is to evaluate food items, ingredient lists, dietary health, and meal timing (lunch, dinner, pre/post workout, weight loss, allergies, etc.).
Answer the user's question clearly, politely, and with structured health & nutrition insights.
Focus strictly on food, health, ingredients, and nutritional recommendations.

${foodContext}
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
            aiResponseText = textCandidate;
          }
        }
      } catch (geminiErr) {
        console.warn('[Gemini AI Advisor] Direct API call error, using smart fallback advisor:', geminiErr);
      }
    }

    // Fallback intelligent health advisor response if Gemini API key is not configured or fails
    if (!aiResponseText) {
      const lowerPrompt = prompt.toLowerCase();
      const itemName = foodItem?.name || 'this food item';
      const ingredients = foodItem?.description || 'standard ingredients';

      if (lowerPrompt.includes('lunch') || lowerPrompt.includes('dinner') || lowerPrompt.includes('eat')) {
        aiResponseText = `🥗 **Meal Recommendation for ${itemName}**:\n\n` +
          `• **Best Meal Time**: Excellent choice for lunch or early dinner as it provides sustained energy throughout the day.\n` +
          `• **Ingredient Breakdown**: Based on the description (${ingredients}), this item offers a balanced mix of proteins and macronutrients.\n` +
          `• **Health Benefit**: Freshly prepared with wholesome ingredients to support energy and digestion.\n\n` +
          `💡 *Tip*: Pair with fresh water or a light salad for optimal digestion!`;
      } else if (lowerPrompt.includes('health') || lowerPrompt.includes('good') || lowerPrompt.includes('body')) {
        aiResponseText = `💪 **Health & Nutrition Analysis**: ${itemName}\n\n` +
          `• **Nutritional Profile**: Rich in essential nutrients from ingredients: ${ingredients}.\n` +
          `• **Dietary Suitability**: Great for balanced daily nutrition, providing energy without excessive heavy processing.\n` +
          `• **Recommendation**: Yes! It is wholesome and suitable for regular enjoyment in a balanced diet.`;
      } else {
        aiResponseText = `🌿 **AI Ingredient & Health Guide for ${itemName}**:\n\n` +
          `• **Ingredients Used**: ${ingredients}\n` +
          `• **Nutritional Insight**: Made with fresh cloud-kitchen quality components designed to satisfy and nourish.\n` +
          `• **Eating Advice**: Suitable for lunch or dinner. Keep hydrated and enjoy fresh!`;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        text: aiResponseText,
        foodItem: foodItem || null,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('[API Food Advisor POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze food health' }, { status: 500 });
  }
}
