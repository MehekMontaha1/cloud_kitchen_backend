import { useState, useRef, useEffect } from 'react';
import { Card, Button, Badge } from '../common';
import { botSuggestions, botResponses } from '../../data/customerData';

const SupportChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 0,
      from: 'bot',
      text: 'Hi there! I\'m your CloudKitchen assistant. How can I help you today?',
      suggestions: botSuggestions.map(s => s.question),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAsk = (question) => {
    setIsTyping(true);

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), from: 'user', text: question },
    ]);

    setTimeout(() => {
      setIsTyping(false);
      const response = botResponses[question];

      if (response) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            from: 'bot',
            text: response.answer,
            suggestions: response.suggestions,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            from: 'bot',
            text: 'I\'m not sure I understand. Here are some things I can help with:',
            suggestions: botSuggestions.map(s => s.question),
          },
        ]);
      }
    }, 1200);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'order-status':
        handleAsk('Where is my order?');
        break;
      case 'restaurants':
        handleAsk('Nearby restaurants?');
        break;
      case 'discount':
        handleAsk('Apply discount?');
        break;
      default:
        break;
    }
  };

  return (
    <Card padding="none">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Support Assistant</h2>
            <p className="text-sm text-slate-500">Always here to help</p>
          </div>
        </div>
      </div>

      <div className="h-72 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.from === 'user'
                  ? 'bg-slate-900 text-white rounded-br-md'
                  : 'bg-slate-100 text-slate-700 rounded-bl-md'
              }`}
            >
              {message.from === 'bot' && (
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-slate-500">CloudBot</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-line">{message.text}</p>

              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion) => {
                    const suggestionObj = botSuggestions.find(s => s.question === suggestion);
                    return (
                      <button
                        key={suggestion}
                        onClick={() => handleAsk(suggestion)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
                      >
                        {suggestionObj?.icon && <span>{suggestionObj.icon}</span>}
                        {suggestion}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 p-4">
        <p className="text-xs text-slate-400 text-center mb-3">Quick Actions</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleQuickAction('order-status')}>
            📍 Track Order
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleQuickAction('restaurants')}>
            🍽️ Find Food
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleQuickAction('discount')}>
            🎟️ Get Discount
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SupportChatbot;
