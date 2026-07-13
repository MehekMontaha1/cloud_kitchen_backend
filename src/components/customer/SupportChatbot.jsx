import { useState, useRef, useEffect } from 'react';
import { Card, Button } from '../common';
import { Send, Sparkles, MessageSquare } from 'lucide-react';

const welcomeMessage = {
  id: 0,
  from: 'bot',
  text: "Hi there! I'm CloudBot, your CloudKitchen customer support assistant. How can I help you today?",
};

const SupportChatbot = () => {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch('/api/ai/history?conversation_type=support&limit=50');
        if (!res.ok) return;

        const result = await res.json();
        const savedMessages = (result.data || []).map((item) => ({
          id: item.id,
          from: item.from === 'ai' ? 'bot' : 'user',
          text: item.text,
        }));

        if (savedMessages.length > 0) {
          setMessages(savedMessages);
        }
      } catch (err) {
        console.warn('Unable to load support chat history:', err);
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleAsk = async (question) => {
    if (isTyping) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), from: 'user', text: question },
    ]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: question }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              from: 'bot',
              text: result.data.text,
            },
          ]);
        }
      }
    } catch (err) {
      console.error('Error asking support chatbot:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const textToSend = input.trim();
    setInput('');

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), from: 'user', text: textToSend },
    ]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              from: 'bot',
              text: result.data.text,
            },
          ]);
        }
      }
    } catch (err) {
      console.error('Error sending message to support chatbot:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'order-status':
        handleAsk('Where is my order?');
        break;
      case 'restaurants':
        handleAsk('Are there nearby kitchens?');
        break;
      case 'discount':
        handleAsk('How do I apply a discount?');
        break;
      default:
        break;
    }
  };

  return (
    <Card padding="none" className="overflow-hidden border border-slate-200 shadow-sm flex flex-col h-full min-h-[460px]">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Support Assistant</h2>
            <p className="text-xs text-slate-500">Live AI support bot for orders, menus & coupon help</p>
          </div>
        </div>
      </div>

      {/* Messages scrollable area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20 max-h-[300px]">
        {messages.map((message, idx) => {
          const isUser = message.from === 'user';
          return (
            <div
              key={message.id || idx}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`group relative max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-br-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-1 pb-0.5 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> CloudBot Support
                    </span>
                  </div>
                )}
                <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-xs bg-white border border-slate-200 px-3.5 py-2.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Questions buttons (horizontal grid) */}
      <div className="bg-slate-50 border-t border-slate-100 p-2.5 flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => handleQuickAction('order-status')}
          className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] text-slate-700 font-semibold hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-800 transition-all shadow-2xs"
        >
          📍 Track Order
        </button>
        <button
          onClick={() => handleQuickAction('restaurants')}
          className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] text-slate-700 font-semibold hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-800 transition-all shadow-2xs"
        >
          🍽️ Find Food
        </button>
        <button
          onClick={() => handleQuickAction('discount')}
          className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] text-slate-700 font-semibold hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-800 transition-all shadow-2xs"
        >
          🎟️ Get Discount
        </button>
      </div>

      {/* Input area footer */}
      <div className="border-t border-slate-200 p-3 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask anything..."
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            icon={<Send className="h-3.5 w-3.5" />}
          >
            {isTyping ? 'Thinking...' : 'Send'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SupportChatbot;
