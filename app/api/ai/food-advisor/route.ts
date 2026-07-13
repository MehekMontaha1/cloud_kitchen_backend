import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import { getRandomPriorChatContext, saveAiChatMessage } from '@/app/lib/ai-chat-history';

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
    const priorChat = await getRandomPriorChatContext(user.id, 'food_advisor');
    const foodItemName = foodItem?.name || null;

    await saveAiChatMessage({
      userId: user.id,
      conversationType: 'food_advisor',
      role: 'user',
      message: prompt,
      foodItemName,
      metadata: {
        source: 'gemini_food_assistant',
        foodItem: foodItem || null,
      },
    });

    let foodContext = '';
    if (foodItem) {
      foodContext = `\n[Food Item Details]\nName: ${foodItem.name}\nSeller/Kitchen: ${foodItem.seller || 'Cloud Kitchen'}\nPrice: ৳${foodItem.price}\nDescription & Ingredients: ${foodItem.description || 'Not specified'}\n`;
    }

    const systemPrompt = `You are an expert AI Food & Health Assistant for CloudKitchen.
Your mission is to evaluate food items, ingredient lists, dietary health, and suitability based on user requests.

CRITICAL INSTRUCTIONS:
1. KEEP YOUR ANSWERS SHORT AND CONCISE (maximum 2 to 3 sentences / 50 words). Do not write big paragraphs or long bulleted lists.
2. DO NOT default to recommending the item for "lunch" unless the user specifically asks about lunch. Focus on its general health suitability instead.
3. ANSWER LOGICALLY: If the user asks whether they should eat a food item (e.g., a burger, pizza, salad, etc.):
   - Read the item's description/ingredients. If specific protein or calories are mentioned in the description, use those figures.
   - If protein/calories are NOT mentioned, estimate them based on normal/typical nutritional values for that food type (e.g., a standard burger has roughly 450 calories and 22g of protein, standard pizza slice has 280 calories, salad has 120 calories, etc.).
   - Give a direct, logical recommendation (Yes or No with a brief reason) based on those estimated or provided calories/protein and the user's question.

${foodContext}
${priorChat.context ? `
[Occasional Previous Food Chat Context]
Use this only if it helps answer the current food or health question. Do not force it into the answer.
${priorChat.context}
` : ''}
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
        console.warn('[Gemini AI Advisor] Direct API call error, using smart fallback advisor:', geminiErr);
      }
    }

    // Fallback intelligent health advisor response if Gemini API key is not configured or fails
    if (!aiResponseText) {
      const lowerPrompt = prompt.toLowerCase();
      const itemName = (foodItem?.name || 'this food item').toLowerCase();
      const description = foodItem?.description || '';
      const lowerDesc = description.toLowerCase();

      // Helper to extract or estimate calories and protein
      let calories = 0;
      let protein = 0;
      let isEstimated = true;

      // Check if description has calorie info
      const calMatch = lowerDesc.match(/(\d+)\s*(?:kcal|calories)/);
      if (calMatch) {
        calories = parseInt(calMatch[1]);
        isEstimated = false;
      }
      
      // Check if description has protein info
      const protMatch = lowerDesc.match(/(\d+)\s*g\s*(?:of\s*)?protein/);
      if (protMatch) {
        protein = parseInt(protMatch[1]);
        isEstimated = false;
      }

      // Default estimates based on item name
      if (calories === 0 || protein === 0) {
        if (itemName.includes('burger')) {
          if (calories === 0) calories = 450;
          if (protein === 0) protein = 22;
        } else if (itemName.includes('pizza')) {
          if (calories === 0) calories = 280;
          if (protein === 0) protein = 11;
        } else if (itemName.includes('salad')) {
          if (calories === 0) calories = 120;
          if (protein === 0) protein = 5;
        } else if (itemName.includes('chicken') || itemName.includes('meat') || itemName.includes('beef') || itemName.includes('steak')) {
          if (calories === 0) calories = 350;
          if (protein === 0) protein = 28;
        } else if (itemName.includes('rice') || itemName.includes('biryani') || itemName.includes('pulao')) {
          if (calories === 0) calories = 550;
          if (protein === 0) protein = 15;
        } else {
          if (calories === 0) calories = 320;
          if (protein === 0) protein = 10;
        }
      }

      // Determine recommendation logic
      let recommendation = '';
      if (lowerPrompt.includes('diet') || lowerPrompt.includes('weight loss') || lowerPrompt.includes('lose weight') || lowerPrompt.includes('fat loss')) {
        if (calories > 400) {
          recommendation = `This ${itemName} contains around ${calories} kcal and ${protein}g protein. Since it is relatively high in calories, you should eat it in moderation if you are trying to lose weight.`;
        } else {
          recommendation = `Yes, you can eat this ${itemName}! It has only around ${calories} kcal and ${protein}g protein, making it suitable for a weight loss diet.`;
        }
      } else if (lowerPrompt.includes('protein') || lowerPrompt.includes('workout') || lowerPrompt.includes('exercise') || lowerPrompt.includes('gym')) {
        if (protein >= 18) {
          recommendation = `Yes! With about ${protein}g of protein and ${calories} kcal, this ${itemName} is a great choice to fuel or recover from your workout.`;
        } else {
          recommendation = `It provides about ${protein}g of protein and ${calories} kcal. You might want to pair it with a higher protein source for post-workout recovery.`;
        }
      } else {
        recommendation = `Yes, this ${itemName} is a reasonable choice! It contains about ${calories} kcal and ${protein}g protein. ${calories > 400 ? 'Enjoy it in moderation.' : 'It fits well into a balanced diet.'}`;
      }

      aiResponseText = recommendation;
    }

    await saveAiChatMessage({
      userId: user.id,
      conversationType: 'food_advisor',
      role: 'ai',
      message: aiResponseText,
      foodItemName,
      metadata: {
        source: 'gemini_food_assistant',
        usedPreviousChat: priorChat.usedMemory,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        text: aiResponseText,
        foodItem: foodItem || null,
        usedPreviousChat: priorChat.usedMemory,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('[API Food Advisor POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze food health' }, { status: 500 });
  }
}
