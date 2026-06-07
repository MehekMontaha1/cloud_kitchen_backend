import { useState } from 'react';
import { Clock, Edit3, Megaphone, MessageSquare, Plus, ReceiptText, Save } from 'lucide-react';
import { Badge, Button, Card, Input, Select, Textarea } from '../common';
import { sellerEarningsData, sellerMenuData, sellerMessagesData, sellerOrdersData } from '../../data/platformData';

const SellerPanel = () => {
  const [menu, setMenu] = useState(sellerMenuData);
  const [draft, setDraft] = useState({ name: '', category: 'Bowls', price: '', stock: '' });
  const [offer, setOffer] = useState({ title: 'Lunch Rush Deal', discount: '20', duration: '45' });

  const addItem = (event) => {
    event.preventDefault();
    if (!draft.name || !draft.price) return;
    setMenu((prev) => [
      ...prev,
      { id: `MN-${Date.now()}`, name: draft.name, category: draft.category, price: Number(draft.price), stock: Number(draft.stock || 0), status: 'live' },
    ]);
    setDraft({ name: '', category: 'Bowls', price: '', stock: '' });
  };

  const toggleStatus = (id) => {
    setMenu((prev) => prev.map((item) => item.id === id ? { ...item, status: item.status === 'live' ? 'paused' : 'live' } : item));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Seller Dashboard</h2>
        <p className="mt-1 text-slate-500">Manage menu, regular and custom orders, customer messages, flash offers, and earnings.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {sellerEarningsData.map((metric) => (
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

          <form onSubmit={addItem} className="mb-5 grid gap-3 md:grid-cols-4">
            <Input placeholder="Item name" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
            <Select options={[{ value: 'Bowls', label: 'Bowls' }, { value: 'Pasta', label: 'Pasta' }, { value: 'Sides', label: 'Sides' }]} value={draft.category} onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))} />
            <Input placeholder="Price" value={draft.price} onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))} />
            <Button type="submit" icon={<Plus className="h-4 w-4" />}>Add</Button>
          </form>

          <div className="space-y-3">
            {menu.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.category} / ${item.price.toFixed(2)} / Stock {item.stock}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.status === 'live' ? 'success' : 'warning'}>{item.status}</Badge>
                  <Button variant="secondary" size="sm" onClick={() => toggleStatus(item.id)}>
                    {item.status === 'live' ? 'Pause' : 'Resume'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-5 flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-slate-500" />
            <h3 className="text-xl font-semibold text-slate-900">Order Management</h3>
          </div>
          <div className="space-y-3">
            {sellerOrdersData.map((order) => (
              <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{order.id} / {order.customer}</p>
                    <p className="text-sm text-slate-500">{order.item}</p>
                  </div>
                  <Badge variant={order.type === 'Regular' ? 'success' : 'warning'}>{order.type}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">{order.status} / {order.eta}</span>
                  <span className="font-semibold text-slate-900">${order.value.toFixed(2)}</span>
                </div>
              </div>
            ))}
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
            <span className="ml-2 text-sm font-medium text-orange-800">{offer.title}: {offer.discount}% off for {offer.duration} minutes</span>
          </div>
          <Button className="mt-4" icon={<Save className="h-4 w-4" />}>Publish Offer</Button>
        </Card>

        <Card>
          <div className="mb-5 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-slate-500" />
            <h3 className="text-xl font-semibold text-slate-900">Inbox</h3>
          </div>
          <div className="space-y-3">
            {sellerMessagesData.map((message) => (
              <div key={message.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{message.from}</p>
                  {message.unread && <Badge variant="danger" size="sm">Unread</Badge>}
                </div>
                <p className="mt-2 text-sm text-slate-600">{message.text}</p>
                <p className="mt-2 text-xs text-slate-400">{message.time}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
};

export default SellerPanel;
