import { useState, useRef, useEffect } from 'react';
import { Card, Button, Badge } from '../common';
import { Sparkles, HeartPulse, Utensils, Send, Copy, Check, Info, AlertCircle, RefreshCw } from 'lucide-react';

const GeminiFoodAssistant = ({ activeFoodItem, onClearActiveFood }) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: 'ai',
      text: "👋 Hi! I'm your Gemini AI Food & Health Assistant. Paste or ask me about any food item's ingredients, health benefits, meal suitability (lunch/dinner), or dietary advice!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (activeFoodItem) {
      setPrompt(`Should I eat ${activeFoodItem.name}? Is it healthy based on the description: ${activeFoodItem.description || 'not specified'}?`);
    }
  }, [activeFoodItem]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleAskAI = async (customPrompt) => {
    const queryText = customPrompt || prompt;
    if (!queryText.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      from: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/food-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryText,
          foodItem: activeFoodItem || null,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          const aiMsg = {
            id: Date.now() + 1,
            from: 'ai',
            text: result.data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, aiMsg]);
        }
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to get AI response');
      }
    } catch (err) {
      console.error('Error asking Gemini AI:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const quickPrompts = [
    'Should I eat this item?',
    'Is this food healthy to eat?',
    'What ingredients are used in this item?',
    'Is this item high protein or good for workout?',
  ];

  return (
    <Card padding="none" className="overflow-hidden border border-emerald-200 shadow-md">
      {/* Header */}
      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Sparkles className="h-5 w-5 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Gemini AI Food & Health Assistant</h3>
                <Badge variant="success" size="sm" className="bg-emerald-700/80 text-white border-none">
                  Gemini 2.5 AI
                </Badge>
              </div>
              <p className="text-xs text-emerald-100">Ask about food ingredients, meal suitability (lunch/dinner), and health advice.</p>
            </div>
          </div>
          <HeartPulse className="h-6 w-6 text-emerald-200 animate-pulse hidden sm:block" />
        </div>
      </div>

      {/* Selected Food Item Preview Banner */}
      {activeFoodItem && (
        <div className="flex items-center justify-between gap-3 bg-emerald-50 border-b border-emerald-200 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs text-emerald-950 font-medium">
            <Utensils className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Analyzing: <strong>{activeFoodItem.name}</strong> (৳{activeFoodItem.price}) — <em>{activeFoodItem.description}</em>
            </span>
          </div>
          <button
            onClick={onClearActiveFood}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline shrink-0"
          >
            Clear item
          </button>
        </div>
      )}

      {/* Quick Prompt Suggestions */}
      <div className="bg-slate-50 border-b border-slate-200 p-3 flex flex-wrap gap-2">
        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
          <Info className="h-3.5 w-3.5 text-emerald-600" /> Quick Questions:
        </span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleAskAI(qp)}
            className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs text-slate-700 font-medium hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 transition-all shadow-2xs"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollContainerRef} className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {messages.map((msg, idx) => {
          const isUser = msg.from === 'user';
          return (
            <div key={msg.id || idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`group relative max-w-[85%] rounded-2xl px-4 py-3 shadow-2xs text-xs sm:text-sm ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-br-xs'
                    : 'bg-white border border-emerald-200 text-slate-800 rounded-bl-xs'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-emerald-100">
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-emerald-500" /> Gemini AI Health Advisor
                    </span>
                    <button
                      onClick={() => handleCopyText(msg.text, idx)}
                      className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[10px]"
                      title="Copy text"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                )}
                <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
                <p className={`text-[10px] mt-1.5 text-right ${isUser ? 'text-slate-400' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-xs bg-white border border-emerald-200 px-4 py-3 shadow-2xs">
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Gemini AI is analyzing ingredients & health suitability...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAskAI();
              }
            }}
            placeholder="Ask Gemini AI about food ingredients, health benefits, or meal timing..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            style={{ minHeight: '44px', maxHeight: '100px' }}
          />
          <Button
            variant="success"
            size="md"
            onClick={() => handleAskAI()}
            disabled={!prompt.trim() || loading}
            icon={<Send className="h-4 w-4" />}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Ask AI
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default GeminiFoodAssistant;
