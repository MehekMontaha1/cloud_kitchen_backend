import { useState, useEffect } from 'react';
import { Clock, Edit3, Megaphone, MessageSquare, Plus, ReceiptText, Save } from 'lucide-react';
import { Badge, Button, Card, Input } from '../common';

const SellerPanel = () => {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [earnings, setEarnings] = useState([
    { label: 'Today', value: '$0.00', delta: '+0%' },
    { label: 'This Week', value: '$0.00', delta: '+0%' },
    { label: 'Custom Orders', value: '$0.00', delta: '+0%' },
    { label: 'Total Sales', value: '$0.00', delta: '+0%' }
  ]);

  const [draft, setDraft] = useState({ name: '', price: '', stock: '' });
  const [offer, setOffer] = useState({ title: 'Lunch Rush Deal', discount: '20', duration: '45' });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch all seller panel data on mount
  const loadMenu = async () => {
    try {
      const res = await fetch('/api/seller/menu');
      if (res.ok) {
        const result = await res.json();
        if (result.success) setMenu(result.data);
      }
    } catch (err) {
      console.error('Error loading menu:', err);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/seller/orders');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          const mappedOrders = result.data.map((order) => ({
            id: order.id,
            customer: order.customer ? order.customer.full_name : 'Customer',
            type: order.type,
            item: order.item_name,
            eta: order.eta,
            status: order.status,
            value: Number(order.value),
          }));
          setOrders(mappedOrders);
        }
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await fetch('/api/seller/messages');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          const mappedMessages = result.data.map((msg) => ({
            id: msg.id,
            from: msg.sender ? msg.sender.full_name : 'User',
            text: msg.text,
            unread: msg.unread,
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          setMessages(mappedMessages);
        }
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const loadEarnings = async () => {
    try {
      const res = await fetch('/api/seller/earnings');
      if (res.ok) {
        const result = await res.json();
        if (result.success) setEarnings(result.data);
      }
    } catch (err) {
      console.error('Error loading earnings:', err);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([loadMenu(), loadOrders(), loadMessages(), loadEarnings()]);
      setLoading(false);
    };
    fetchAllData();
  }, []);

  // 2. Add menu item handler (supports image file upload)
  const addItem = async (event) => {
    event.preventDefault();
    if (!draft.name || !draft.price) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', draft.name);
      formData.append('price', draft.price);
      formData.append('stock', draft.stock || '50');
      if (imageFile) {
        formData.append('file', imageFile);
      }

      const res = await fetch('/api/seller/menu', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setMenu((prev) => [result.data, ...prev]);
          setDraft({ name: '', price: '', stock: '' });
          setImageFile(null);
          const fileInput = document.getElementById('menu-item-image');
          if (fileInput) fileInput.value = '';
          loadEarnings();
        }
      } else {
        const errorData = await res.json();
        alert('Failed to add menu item: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error adding menu item:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Toggle status live/paused handler
  const toggleStatus = async (id) => {
    try {
      const res = await fetch(`/api/seller/menu/${id}`, {
        method: 'PUT',
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setMenu((prev) =>
            prev.map((item) => (item.id === id ? result.data : item))
          );
        }
      } else {
        const errorData = await res.json();
        alert('Failed to toggle status: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error toggling menu item status:', err);
    }
  };

  // 3.5 Delete menu item handler
  const deleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const res = await fetch(`/api/seller/menu/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMenu((prev) => prev.filter((item) => item.id !== id));
        loadEarnings();
      } else {
        const errorData = await res.json();
        alert('Failed to delete item: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting menu item:', err);
    }
  };

  // 4. Publish flash offer handler
  const publishOffer = async () => {
    if (!offer.title || !offer.discount || !offer.duration) return;
    try {
      const res = await fetch('/api/seller/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: offer.title,
          discount: Number(offer.discount),
          duration: Number(offer.duration),
        }),
      });
      if (res.ok) {
        alert('Flash offer published successfully!');
        setOffer({ title: '', discount: '', duration: '' });
      } else {
        const errorData = await res.json();
        alert('Failed to publish offer: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error publishing flash offer:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Seller Dashboard</h2>
        <p className="mt-1 text-slate-500">Manage menu, regular and custom orders, customer messages, flash offers, and earnings.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {earnings.map((metric) => (
          <Card key={metric.label} className="rounded-xl" padding="sm">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
            <Badge variant="success" size="sm" className="mt-3">{metric.delta}</Badge>
          </Card>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Menu Management</h3>
              <p className="text-sm text-slate-500">Add, edit, price, pause, or restock menu items.</p>
            </div>
            <Edit3 className="h-5 w-5 text-slate-400" />
          </div>

          <form onSubmit={addItem} className="mb-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Input placeholder="Item name" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Stock" type="number" value={draft.stock} onChange={(e) => setDraft((p) => ({ ...p, stock: e.target.value }))} />
              <Input placeholder="Price" value={draft.price} onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">Item Image</span>
                <input
                  id="menu-item-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
              </div>
              <Button type="submit" icon={<Plus className="h-4 w-4" />} disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Item'}
              </Button>
            </div>
          </form>

          <div className="space-y-3">
            {menu.length === 0 ? (
              <p className="text-center py-4 text-sm text-slate-400">No menu items found. Add your first item above.</p>
            ) : (
              menu.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-4">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-12 w-12 rounded-xl object-cover border border-slate-100" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">${Number(item.price).toFixed(2)} / Stock {item.stock}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.status === 'live' ? 'success' : 'warning'}>{item.status}</Badge>
                    <Button variant="secondary" size="sm" onClick={() => toggleStatus(item.id)}>
                      {item.status === 'live' ? 'Pause' : 'Resume'}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => deleteItem(item.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-5 flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-slate-500" />
            <h3 className="text-xl font-semibold text-slate-900">Order Management</h3>
          </div>
          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-center py-4 text-sm text-slate-400">No orders found.</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{order.customer}</p>
                      <p className="text-xs text-slate-400">ID: {order.id}</p>
                      <p className="mt-1 text-sm text-slate-500">{order.item}</p>
                    </div>
                    <Badge variant={order.type === 'Regular' ? 'success' : 'warning'}>{order.type}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500">{order.status} / {order.eta}</span>
                    <span className="font-semibold text-slate-900">${order.value.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-orange-500" />
            <h3 className="text-xl font-semibold text-slate-900">Create Flash Offer</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Offer title" value={offer.title} onChange={(e) => setOffer((p) => ({ ...p, title: e.target.value }))} />
            <Input label="Discount %" value={offer.discount} onChange={(e) => setOffer((p) => ({ ...p, discount: e.target.value }))} />
            <Input label="Minutes" value={offer.duration} onChange={(e) => setOffer((p) => ({ ...p, duration: e.target.value }))} />
          </div>
          <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
            <Clock className="inline h-4 w-4 text-orange-600" />
            <span className="ml-2 text-sm font-medium text-orange-800">
              {offer.title ? `${offer.title}: ${offer.discount}% off for ${offer.duration} minutes` : 'Preview offer details above'}
            </span>
          </div>
          <Button className="mt-4" icon={<Save className="h-4 w-4" />} onClick={publishOffer}>Publish Offer</Button>
        </Card>

        <Card>
          <div className="mb-5 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-slate-500" />
            <h3 className="text-xl font-semibold text-slate-900">Inbox</h3>
          </div>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-center py-4 text-sm text-slate-400">No messages in inbox.</p>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{message.from}</p>
                    {message.unread && <Badge variant="danger" size="sm">Unread</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{message.text}</p>
                  <p className="mt-2 text-xs text-slate-400">{message.time}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
};

export default SellerPanel;
