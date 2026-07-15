import { useState, useEffect, useMemo } from 'react';
import { Clock, Edit3, MapPin, Megaphone, MessageSquare, Plus, ReceiptText, Save } from 'lucide-react';
import { Badge, Button, Card, Input, MapPicker } from '../common';
import InboxMessaging from '../customer/InboxMessaging';


const SellerPanel = () => {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [earnings, setEarnings] = useState([
    { label: 'Today', value: '৳0.00', delta: '+0%' },
    { label: 'This Week', value: '৳0.00', delta: '+0%' },
    { label: 'Custom Orders', value: '৳0.00', delta: '+0%' },
    { label: 'Total Sales', value: '৳0.00', delta: '+0%' }
  ]);

  const [draft, setDraft] = useState({ name: '', price: '', stock: '', description: '', category: 'Food' });
  const [offer, setOffer] = useState({ title: 'Lunch Rush Deal', discount: '20', duration: '45' });
  const [selectedDealItems, setSelectedDealItems] = useState([]);
  const [applyToAll, setApplyToAll] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: '', price: '', stock: '', description: '', category: 'Food' });
  const [editImageFile, setEditImageFile] = useState(null);
  const [updatingItem, setUpdatingItem] = useState(false);
  const [kitchenLocation, setKitchenLocation] = useState({
    lat: 23.8103,
    lng: 90.4125,
    address: '',
  });
  const [activeOffers, setActiveOffers] = useState([]);
  const [editingOffer, setEditingOffer] = useState(null);
  const [customOrders, setCustomOrders] = useState([]);
  const [ordersTab, setOrdersTab] = useState('active');
  const [customOrdersTab, setCustomOrdersTab] = useState('active');

  const activeSellerOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  }, [orders]);

  const pastSellerOrders = useMemo(() => {
    return orders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled');
  }, [orders]);

  const activeSellerCustomOrders = useMemo(() => {
    return customOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  }, [customOrders]);

  const pastSellerCustomOrders = useMemo(() => {
    return customOrders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled');
  }, [customOrders]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch('/api/seller/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        loadEarnings();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating seller order status:', err);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/users/profile');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          const lat = result.data.latitude ? Number(result.data.latitude) : 23.8103;
          const lng = result.data.longitude ? Number(result.data.longitude) : 90.4125;
          setKitchenLocation({
            lat,
            lng,
            address: result.data.location || '',
          });
        }
      }
    } catch (err) {
      console.error('Error loading seller profile location:', err);
    }
  };

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

  const loadActiveOffers = async () => {
    try {
      const res = await fetch('/api/seller/offers');
      if (res.ok) {
        const result = await res.json();
        if (result.success) setActiveOffers((result.data || []).filter(o => o.isActive));
      }
    } catch (err) {
      console.error('Error loading active offers:', err);
    }
  };

  const loadCustomOrders = async () => {
    try {
      const res = await fetch('/api/seller/custom-orders');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          const customs = result.data.map((order) => ({
            id: order.id,
            customer: order.customer ? order.customer.full_name : 'Customer',
            item: order.item_name,
            value: Number(order.budget ?? order.value ?? 0),
            status: order.status,
            details: order.details || order.items?.[0] || {},
            createdAt: order.created_at,
          }));
          setCustomOrders(customs);
        }
      }
    } catch (err) {
      console.error('Error loading custom orders:', err);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([loadProfile(), loadMenu(), loadOrders(), loadEarnings(), loadActiveOffers(), loadCustomOrders()]);
      setLoading(false);
    };
    fetchAllData();
  }, []);


  // 2. Add menu item handler (supports image file upload and description/ingredients)
  const addItem = async (event) => {
    event.preventDefault();
    if (!draft.name || !draft.price) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', draft.name);
      formData.append('price', draft.price);
      formData.append('stock', draft.stock || '50');
      formData.append('description', draft.description || '');
      formData.append('category', draft.category || 'Food');
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
          setDraft({ name: '', price: '', stock: '', description: '', category: 'Food' });
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

  // 3.7 Editing menu items handler
  const startEdit = (item) => {
    setEditingItem(item.id);
    setEditDraft({
      name: item.name,
      price: item.price.toString(),
      stock: item.stock.toString(),
      description: item.description || '',
      category: item.category || 'Food'
    });
    setEditImageFile(null);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditDraft({ name: '', price: '', stock: '', description: '', category: 'Food' });
    setEditImageFile(null);
  };

  const handleUpdateItem = async (event) => {
    event.preventDefault();
    if (!editDraft.name || !editDraft.price) return;
    setUpdatingItem(true);
    try {
      const formData = new FormData();
      formData.append('name', editDraft.name);
      formData.append('price', editDraft.price);
      formData.append('stock', editDraft.stock || '50');
      formData.append('description', editDraft.description || '');
      formData.append('category', editDraft.category || 'Food');
      if (editImageFile) {
        formData.append('file', editImageFile);
      }

      const res = await fetch(`/api/seller/menu/${editingItem}`, {
        method: 'PUT',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setMenu((prev) =>
            prev.map((item) => (item.id === editingItem ? result.data : item))
          );
          cancelEdit();
          loadEarnings();
        }
      } else {
        const errorData = await res.json();
        alert('Failed to update menu item: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating menu item:', err);
    } finally {
      setUpdatingItem(false);
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
          item_ids: applyToAll ? null : selectedDealItems,
        }),
      });
      if (res.ok) {
        alert('Flash offer published successfully!');
        setOffer({ title: '', discount: '', duration: '' });
        setSelectedDealItems([]);
        setApplyToAll(true);
        await loadActiveOffers();
      } else {
        const errorData = await res.json();
        alert('Failed to publish offer: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error publishing flash offer:', err);
    }
  };

  // 4b. Delete an active flash offer
  const deleteOffer = async (offerId) => {
    if (!confirm('Delete this flash offer? It will no longer appear to customers.')) return;
    try {
      const res = await fetch(`/api/seller/offers?id=${offerId}`, { method: 'DELETE' });
      if (res.ok) {
        setActiveOffers(prev => prev.filter(o => o.id !== offerId));
      } else {
        const errData = await res.json();
        alert('Failed to delete: ' + (errData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting offer:', err);
    }
  };

  // 4c. Save edits to an active flash offer
  const saveEditOffer = async () => {
    if (!editingOffer) return;
    try {
      const res = await fetch('/api/seller/offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingOffer.id,
          title: editingOffer.title,
          discount: Number(editingOffer.discount),
          duration: Number(editingOffer.duration_minutes),
        }),
      });
      if (res.ok) {
        alert('Offer updated! Timer has been reset.');
        setEditingOffer(null);
        await loadActiveOffers();
      } else {
        const errData = await res.json();
        alert('Failed to update: ' + (errData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error editing offer:', err);
    }
  };

  // 4d. Accept / reject a custom order
  const handleCustomOrderAction = async (orderId, newStatus) => {
    try {
      const res = await fetch('/api/seller/custom-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (res.ok) {
        setCustomOrders(prev =>
          prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
        );
        await loadCustomOrders();
        loadEarnings();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update custom order');
      }
    } catch (err) {
      console.error('Error updating custom order:', err);
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
            <div className="grid gap-3 sm:grid-cols-4">
              <Input placeholder="Item name" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Stock" type="number" value={draft.stock} onChange={(e) => setDraft((p) => ({ ...p, stock: e.target.value }))} />
              <Input placeholder="Price" value={draft.price} onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))} />
              <select
                value={draft.category}
                onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              >
                <option value="Food">Food (Other)</option>
                <option value="Rice">Rice</option>
                <option value="Fast Food">Fast Food</option>
                <option value="Curry">Curry</option>
                <option value="Cake">Cake & Desserts</option>
                <option value="Drinks">Drinks</option>
              </select>
            </div>
            <div>
              <textarea
                placeholder="Description & Ingredients (e.g. Fresh Atlantic salmon fillet, avocado, quinoa, sesame oil, citrus dressing)"
                value={draft.description}
                onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 resize-none"
              />
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
              menu.map((item) => {
                if (editingItem === item.id) {
                  return (
                    <form key={item.id} onSubmit={handleUpdateItem} className="rounded-xl border border-orange-300 bg-orange-50/20 p-4 space-y-4">
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Item Name</label>
                          <Input placeholder="Item name" value={editDraft.name} onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Stock</label>
                          <Input placeholder="Stock" type="number" value={editDraft.stock} onChange={(e) => setEditDraft((p) => ({ ...p, stock: e.target.value }))} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Price (৳)</label>
                          <Input placeholder="Price" value={editDraft.price} onChange={(e) => setEditDraft((p) => ({ ...p, price: e.target.value }))} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Category</label>
                          <select
                            value={editDraft.category}
                            onChange={(e) => setEditDraft((p) => ({ ...p, category: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                          >
                            <option value="Food">Food (Other)</option>
                            <option value="Rice">Rice</option>
                            <option value="Fast Food">Fast Food</option>
                            <option value="Curry">Curry</option>
                            <option value="Cake">Cake & Desserts</option>
                            <option value="Drinks">Drinks</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Description & Ingredients</label>
                        <textarea
                          placeholder="Description & Ingredients"
                          value={editDraft.description}
                          onChange={(e) => setEditDraft((p) => ({ ...p, description: e.target.value }))}
                          rows={2}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 resize-none"
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-semibold text-slate-500">Update Image (Optional)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                            className="text-xs text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="secondary" size="sm" onClick={cancelEdit}>
                            Cancel
                          </Button>
                          <Button type="submit" size="sm" disabled={updatingItem}>
                            {updatingItem ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </div>
                    </form>
                  );
                }

                return (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start gap-4">
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
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <Badge variant="info" size="sm">
                            {item.category || 'Food'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">৳{Number(item.price).toFixed(2)} / Stock {item.stock}</p>
                        {item.description && (
                          <p className="mt-1 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 max-w-md">
                            <strong>Ingredients/Details:</strong> {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.status === 'live' ? 'success' : 'warning'}>{item.status}</Badge>
                      <Button variant="secondary" size="sm" onClick={() => startEdit(item)}>
                        Edit
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => toggleStatus(item.id)}>
                        {item.status === 'live' ? 'Pause' : 'Resume'}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => deleteItem(item.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 mb-5 gap-4">
            <div className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-slate-500" />
              <h3 className="text-xl font-semibold text-slate-900">Order Management</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setOrdersTab('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  ordersTab === 'active'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Active ({activeSellerOrders.length})
              </button>
              <button
                onClick={() => setOrdersTab('past')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  ordersTab === 'past'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Done ({pastSellerOrders.length})
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {ordersTab === 'active' ? (
              activeSellerOrders.length === 0 ? (
                <p className="text-center py-4 text-sm text-slate-400">No active orders.</p>
              ) : (
                activeSellerOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{order.customer}</p>
                        <p className="text-xs text-slate-400 font-mono">ID: {order.id}</p>
                        <p className="mt-1 text-sm text-slate-700 font-medium">{order.item}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={order.type === 'Regular' ? 'success' : 'warning'}>{order.type}</Badge>
                        <Badge variant={
                          order.status === 'Pending' ? 'warning' :
                            order.status === 'Preparing' ? 'primary' :
                              order.status === 'Ready' ? 'info' : 'success'
                        } size="sm">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-sm">
                      <span className="font-semibold text-slate-900">৳{order.value.toFixed(2)}</span>

                      <div className="flex flex-wrap items-center gap-2">
                        {order.status === 'Pending' && (
                          <>
                            <Button size="sm" onClick={() => handleUpdateOrderStatus(order.id, 'Preparing')}>
                              Confirm & Cook
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleUpdateOrderStatus(order.id, 'Cancelled')}>
                              Cancel
                            </Button>
                          </>
                        )}

                        {order.status === 'Preparing' && (
                          <Button size="sm" variant="success" onClick={() => handleUpdateOrderStatus(order.id, 'Ready')}>
                            Pass to Delivery Man
                          </Button>
                        )}

                        {order.status === 'Ready' && (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            Passed for Delivery (Awaiting Rider)
                          </span>
                        )}

                        {order.status === 'Accepted' && (
                          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                            Delivery Rider Assigned
                          </span>
                        )}

                        {order.status === 'Picked Up' && (
                          <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                            On The Way to Customer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              pastSellerOrders.length === 0 ? (
                <p className="text-center py-4 text-sm text-slate-400">No past orders.</p>
              ) : (
                pastSellerOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800">{order.customer}</p>
                        <p className="text-xs text-slate-400 font-mono">ID: {order.id}</p>
                        <p className="mt-1 text-sm text-slate-600 font-medium">{order.item}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={order.type === 'Regular' ? 'success' : 'warning'}>{order.type}</Badge>
                        <Badge variant={order.status === 'Cancelled' ? 'danger' : 'success'} size="sm">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-sm">
                      <span className="font-semibold text-slate-700">৳{order.value.toFixed(2)}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                        order.status === 'Cancelled' ? 'text-rose-600 bg-rose-50 border border-rose-200' : 'text-slate-500 bg-slate-100'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              )
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

          <div className="mt-4 space-y-2">
            <label className="block text-xs font-bold text-slate-700">Apply Offer To:</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                <input
                  type="radio"
                  name="applyTo"
                  checked={applyToAll}
                  onChange={() => setApplyToAll(true)}
                  className="accent-indigo-600"
                />
                All Menu Items
              </label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                <input
                  type="radio"
                  name="applyTo"
                  checked={!applyToAll}
                  onChange={() => setApplyToAll(false)}
                  className="accent-indigo-600"
                />
                Specific Items (Select 1 or 2)
              </label>
            </div>

            {!applyToAll && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 grid gap-2 max-h-36 overflow-y-auto mt-2">
                {menu.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">No menu items found. Create items first.</p>
                ) : (
                  menu.map((item) => {
                    const isChecked = selectedDealItems.includes(item.id);
                    return (
                      <label key={item.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (selectedDealItems.length >= 2) {
                                alert("You can select up to 2 items for this flash sale.");
                                return;
                              }
                              setSelectedDealItems([...selectedDealItems, item.id]);
                            } else {
                              setSelectedDealItems(selectedDealItems.filter(id => id !== item.id));
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                        />
                        <span>{item.name} (৳{Number(item.price).toFixed(2)})</span>
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
            <Clock className="inline h-4 w-4 text-orange-600" />
            <span className="ml-2 text-sm font-medium text-orange-800">
              {offer.title ? `${offer.title}: ${offer.discount}% off for ${offer.duration} minutes (${applyToAll ? 'All items' : `${selectedDealItems.length} items selected`})` : 'Preview offer details above'}
            </span>
          </div>
          <Button className="mt-4" icon={<Save className="h-4 w-4" />} onClick={publishOffer}>Publish Offer</Button>
        </Card>

        <InboxMessaging userRole="seller" />
      </section>

      {/* ── Active Flash Offers ── */}
      {activeOffers.length > 0 && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-orange-500" />
            <h3 className="text-xl font-semibold text-slate-900">Active Flash Offers</h3>
            <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
              {activeOffers.length} Live
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeOffers.map(activeOff => {
              const minsLeft = Math.floor(activeOff.timeLeft / 60);
              const secsLeft = activeOff.timeLeft % 60;
              const isEditing = editingOffer?.id === activeOff.id;
              return (
                <div key={activeOff.id} className="rounded-xl border border-orange-200 bg-orange-50/40 p-4 space-y-3">
                  {isEditing ? (
                    <>
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                        value={editingOffer.title}
                        onChange={e => setEditingOffer(p => ({ ...p, title: e.target.value }))}
                        placeholder="Offer title"
                      />
                      <div className="flex gap-2">
                        <input
                          className="w-1/2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                          value={editingOffer.discount}
                          onChange={e => setEditingOffer(p => ({ ...p, discount: e.target.value }))}
                          placeholder="Discount %"
                          type="number"
                        />
                        <input
                          className="w-1/2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                          value={editingOffer.duration_minutes}
                          onChange={e => setEditingOffer(p => ({ ...p, duration_minutes: e.target.value }))}
                          placeholder="Minutes"
                          type="number"
                        />
                      </div>
                      <p className="text-[10px] text-amber-700 italic">Saving will reset the countdown timer.</p>
                      <div className="flex gap-2">
                        <button onClick={saveEditOffer} className="flex-1 rounded-lg bg-emerald-600 text-white text-xs font-bold py-1.5 hover:bg-emerald-700 transition-colors">Save</button>
                        <button onClick={() => setEditingOffer(null)} className="flex-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold py-1.5 hover:bg-slate-300 transition-colors">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{activeOff.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{activeOff.discount}% OFF · {activeOff.item_ids ? `${(activeOff.item_ids || []).length} specific items` : 'All items'}</p>
                        </div>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full shrink-0 animate-pulse">
                          {minsLeft}m {secsLeft}s left
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingOffer({ ...activeOff })}
                          className="flex-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold py-1.5 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit3 className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => deleteOffer(activeOff.id)}
                          className="flex-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold py-1.5 hover:bg-rose-100 transition-colors"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Custom Order Requests ── */}
      <Card>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-600">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Custom Order Requests</h3>
              <p className="mt-1 text-sm text-slate-500">
                Accept a request, prepare it, then mark it ready to hand off to a rider. Custom orders are delivered cash on delivery.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setCustomOrdersTab('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  customOrdersTab === 'active'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Active ({activeSellerCustomOrders.length})
              </button>
              <button
                onClick={() => setCustomOrdersTab('past')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  customOrdersTab === 'past'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                History ({pastSellerCustomOrders.length})
              </button>
            </div>
          </div>
        </div>

        {customOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
            <ReceiptText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-500">No custom order requests yet.</p>
            <p className="text-xs text-slate-400 mt-1">New requests will appear here with action buttons and delivery handoff status.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {customOrdersTab === 'active' ? (
              activeSellerCustomOrders.length === 0 ? (
                <p className="text-center py-4 text-sm text-slate-400">No active custom requests.</p>
              ) : (
                activeSellerCustomOrders.map((co) => {
                  const isPending = co.status === 'Pending';
                  const isActive = co.status === 'Preparing' || co.status === 'Ready';

                  return (
                    <div key={co.id} className={`rounded-2xl border p-4 shadow-sm ${
                      isPending ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-white' : 'border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white'
                    }`}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-900 text-sm">{co.item || 'Custom Food Request'}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {co.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-slate-500">
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-1">From {co.customer}</span>
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-1">COD</span>
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-1">৳{Number(co.value || 0).toFixed(2)}</span>
                          </div>

                          {co.details?.description && (
                            <p className="text-xs text-slate-600 leading-5 line-clamp-2">{co.details.description}</p>
                          )}

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 font-medium">
                            <span>Urgency: {co.details?.urgency || 'standard'}</span>
                            <span>{isPending ? 'Waiting for kitchen approval' : 'Kitchen is preparing this order'}</span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCustomOrderAction(co.id, 'Preparing')}
                                className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
                              >
                                Accept Request
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCustomOrderAction(co.id, 'Cancelled')}
                                className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-50"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isActive && co.status !== 'Ready' && (
                            <button
                              type="button"
                              onClick={() => handleCustomOrderAction(co.id, 'Ready')}
                              className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
                            >
                              Pass to Delivery Man
                            </button>
                          )}

                          {co.status === 'Ready' && (
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                              Awaiting Rider Pickup
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              pastSellerCustomOrders.length === 0 ? (
                <p className="text-center py-4 text-sm text-slate-400">No custom order history.</p>
              ) : (
                pastSellerCustomOrders.map((co) => {
                  const isRejected = co.status === 'Cancelled';
                  return (
                    <div key={co.id} className={`rounded-2xl border p-4 shadow-sm bg-slate-50/40 ${
                      isRejected ? 'border-rose-100' : 'border-emerald-100'
                    }`}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-800 text-sm">{co.item || 'Custom Food Request'}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isRejected ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {co.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-slate-500">
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-1">From {co.customer}</span>
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-1">COD</span>
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-1">৳{Number(co.value || 0).toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          {isRejected ? (
                            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                              Rejected
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                              Delivered
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        )}
      </Card>

      {/* Cloud Kitchen Physical Location Map */}
      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-500" />
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Cloud Kitchen Location Map</h3>
              <p className="text-xs text-slate-500">Pin your physical kitchen location in Bangladesh so local customers within your 30-min radius can find you.</p>
            </div>
          </div>
          <Badge variant="success">Active in Bangladesh</Badge>
        </div>

        <MapPicker
          initialLat={kitchenLocation.lat}
          initialLng={kitchenLocation.lng}
          radiusMeters={7000} // 7km kitchen coverage radius
          circleColor="#ef4444" // RED circle for Seller Operation Area
          showSaveButton={true}
          height="350px"
          onLocationChange={(loc) => {
            setKitchenLocation(loc);
          }}
        />
      </Card>


    </div>
  );
};


export default SellerPanel;
