import { useState, useRef, useEffect } from 'react';
import { Card, Button, Badge } from '../common';
import { MessageSquare, Send, CheckCircle2, User, Store, Bike, Clock, CheckCheck } from 'lucide-react';

const InboxMessaging = ({ userRole = 'customer' }) => {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'done'
  const [activeContacts, setActiveContacts] = useState([]);
  const [doneContacts, setDoneContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesListRef = useRef(null);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          const { activeContacts: active, doneContacts: done, messages: msgs } = result.data;
          setActiveContacts(active || []);
          setDoneContacts(done || []);
          setMessages(msgs || []);

          // Auto select first contact if none selected
          if (!selectedContact) {
            if (active && active.length > 0) {
              setSelectedContact(active[0]);
            } else if (done && done.length > 0) {
              setSelectedContact(done[0]);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching chat data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 5000); // 5s live polling
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messagesListRef.current) {
      messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
    }
  }, [messages, selectedContact]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const contactsList = tab === 'active' ? activeContacts : doneContacts;
    if (contactsList.length > 0) {
      setSelectedContact(contactsList[0]);
    } else {
      setSelectedContact(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedContact) return;

    const textToSend = input.trim();
    const receiverId = selectedContact.id;
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: receiverId,
          text: textToSend,
        }),
      });

      if (res.ok) {
        await fetchChats();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to send message.');
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentContacts = activeTab === 'active' ? activeContacts : doneContacts;

  // Filter messages between current user and selected contact
  const conversationMessages = selectedContact
    ? messages.filter(
        (m) =>
          (m.senderId === selectedContact.id) ||
          (m.receiverId === selectedContact.id)
      )
    : [];

  const getRoleIcon = (role) => {
    if (role === 'seller') return <Store className="h-4 w-4 text-orange-500" />;
    if (role === 'delivery_partner') return <Bike className="h-4 w-4 text-indigo-500" />;
    return <User className="h-4 w-4 text-emerald-500" />;
  };

  const getRoleBadgeLabel = (role) => {
    if (role === 'seller') return 'Kitchen Seller';
    if (role === 'delivery_partner') return 'Delivery Rider';
    return 'Customer';
  };

  if (loading) {
    return (
      <Card>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden border border-slate-200 shadow-sm">
      {/* Top Header & Active / Done Tabs */}
      <div className="border-b border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-orange-500" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Order Chat System</h2>
              <p className="text-xs text-slate-500">Real-time messaging between Customer, Kitchen Seller, and Delivery Partner.</p>
            </div>
          </div>

          {/* Active vs Done Toggle Buttons */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => handleTabChange('active')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'active'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Active Chats</span>
              {activeContacts.length > 0 && (
                <span className="ml-1 rounded-full bg-orange-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {activeContacts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('done')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'done'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Done Chats</span>
              {doneContacts.length > 0 && (
                <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
                  {doneContacts.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_1.8fr] min-h-[380px]">
        {/* Left Column: Profile Contact List */}
        <div className="border-r border-slate-200 bg-slate-50/50 p-3 space-y-2 overflow-y-auto max-h-[420px]">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
            {activeTab === 'active' ? 'Active Order Partners' : 'Completed Order History'}
          </span>

          {currentContacts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-1">
              <MessageSquare className="mx-auto h-6 w-6 text-slate-300" />
              <p>No {activeTab} order contacts found.</p>
            </div>
          ) : (
            currentContacts.map((contact) => {
              const isSelected = selectedContact?.id === contact.id && selectedContact?.orderId === contact.orderId;
              return (
                <button
                  key={`${contact.id}_${contact.orderId}`}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full text-left rounded-xl p-3 transition-all border ${
                    isSelected
                      ? 'bg-white border-orange-300 ring-2 ring-orange-100 shadow-sm'
                      : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        {getRoleIcon(contact.role)}
                      </div>
                      <p className="font-semibold text-slate-900 text-xs truncate max-w-[110px]">
                        {contact.name}
                      </p>
                    </div>
                    <Badge variant={activeTab === 'active' ? 'warning' : 'default'} size="sm">
                      {contact.orderStatus}
                    </Badge>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
                    <span className="truncate max-w-[130px] font-medium text-slate-700">{contact.itemName}</span>
                    <span className="text-[10px] text-slate-400">{getRoleBadgeLabel(contact.role)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Column: Chat Conversation */}
        <div className="flex flex-col bg-white">
          {selectedContact ? (
            <>
              {/* Selected Contact Header */}
              <div className="border-b border-slate-100 p-3 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedContact.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-sm">{selectedContact.name}</p>
                      <Badge variant="secondary" size="sm">
                        {getRoleBadgeLabel(selectedContact.role)}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Order: <strong className="text-slate-700">{selectedContact.itemName}</strong> ({selectedContact.orderStatus})
                    </p>
                  </div>
                </div>

                <Badge variant={activeTab === 'active' ? 'success' : 'secondary'} size="sm" dot>
                  {activeTab === 'active' ? 'Active Order' : 'Done'}
                </Badge>
              </div>

              {/* Message History */}
              <div ref={messagesListRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px] bg-slate-50/20">
                {conversationMessages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No messages yet with {selectedContact.name}. Start the conversation below!
                  </div>
                ) : (
                  conversationMessages.map((msg) => {
                    const isMe = msg.senderName === 'You';
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs ${
                            isMe
                              ? 'bg-slate-900 text-white rounded-br-xs'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                          }`}
                        >
                          {!isMe && (
                            <p className="text-[10px] font-semibold text-orange-600 mb-0.5">{msg.senderName}</p>
                          )}
                          <p className="leading-relaxed">{msg.text}</p>
                          <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>
                            {msg.timestamp}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Footer */}
              <div className="border-t border-slate-200 p-3 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={`Message ${selectedContact.name}...`}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    icon={<Send className="h-3.5 w-3.5" />}
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-700">Select an order partner to start chatting</p>
              <p className="text-xs mt-1">Switch between Active Chats and Done Chats to view conversations.</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default InboxMessaging;
