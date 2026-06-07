import { useState, useRef, useEffect } from 'react';
import { Card, Button, Badge } from '../common';

const InboxMessaging = ({ messages, onSend }) => {
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState(messages);
  const [isTyping, setIsTyping] = useState(false);
  const messagesListRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesListRef.current) {
      messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
    }
  }, [localMessages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      from: 'customer',
      sender: 'You',
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setLocalMessages((prev) => [...prev, newMessage]);
    setInput('');
    onSend(input.trim());
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setLocalMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          from: 'seller',
          sender: 'Golden Spoon Kitchen',
          text: 'Thanks for your message! We\'ll get back to you shortly.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card padding="none">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Inbox Messaging</h2>
            <p className="mt-1 text-sm text-slate-500">Chat with sellers about your orders.</p>
          </div>
          <Badge variant="success" size="md" dot>
            Active Chat
          </Badge>
        </div>
      </div>

      <div ref={messagesListRef} className="h-80 overflow-y-auto p-4 space-y-4">
        {localMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.from === 'customer' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.from === 'customer'
                  ? 'bg-slate-900 text-white rounded-br-md'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md'
              }`}
            >
              {message.from !== 'customer' && (
                <p className="text-xs font-medium text-slate-400 mb-1">{message.sender}</p>
              )}
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${message.from === 'customer' ? 'text-slate-400' : 'text-slate-400'}`}>
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-white border border-slate-200 px-4 py-3">
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
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!input.trim()}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            }
          >
            Send
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Messages are encrypted for your privacy
        </div>
      </div>
    </Card>
  );
};

export default InboxMessaging;
