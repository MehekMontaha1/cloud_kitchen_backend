import { useState, useEffect } from 'react';
import { Bike, CheckCircle2, MapPin, PackageCheck, Route, MessageSquare, ShoppingBag } from 'lucide-react';
import { Badge, Button, Card } from '../common';

const statusFlow = ['Accepted', 'Picked Up', 'Delivered'];

const DeliveryPanel = () => {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [riderLocation, setRiderLocation] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Fetch available orders, accepted orders, messages and rider location
  const fetchDeliveryData = async () => {
    try {
      setLoading(true);
      // Fetch rider profile to get location
      const profileRes = await fetch('/api/users/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.success && profileData.data) {
          setRiderLocation(profileData.data.location || '');
        }
      }

      // Fetch available orders
      const availRes = await fetch('/api/delivery/available');
      if (availRes.ok) {
        const availData = await availRes.json();
        if (availData.success) {
          setAvailableOrders(availData.data || []);
        }
      }

      // Fetch accepted orders
      const acceptedRes = await fetch('/api/delivery/accepted');
      if (acceptedRes.ok) {
        const acceptedData = await acceptedRes.json();
        if (acceptedData.success) {
          setAcceptedOrders(acceptedData.data || []);
        }
      }

      // Fetch messages
      const msgRes = await fetch('/api/delivery/messages');
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        if (msgData.success && msgData.data) {
          const mapped = msgData.data.map(m => ({
            id: m.id,
            from: m.sender?.full_name || 'Kitchen',
            text: m.text,
            unread: m.unread,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setMessages(mapped);
        }
      }
    } catch (err) {
      console.error('Error fetching delivery dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryData();
  }, []);

  // 2. Accept an order
  const handleAcceptOrder = async (orderId) => {
    try {
      const res = await fetch('/api/delivery/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (res.ok) {
        alert('Order accepted successfully!');
        fetchDeliveryData(); // Refresh all lists including messages
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to accept order.');
      }
    } catch (err) {
      console.error('Error accepting order:', err);
    }
  };

  // 3. Update delivery progress status
  const handleUpdateStatus = async (orderId, currentStatus) => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === statusFlow.length - 1) return;

    const nextStatus = statusFlow[currentIndex + 1];

    try {
      const res = await fetch('/api/delivery/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: nextStatus }),
      });

      if (res.ok) {
        setAcceptedOrders((prev) =>
          prev.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order))
        );
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update status.');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  // Calculate dynamic stats
  const activeTasks = acceptedOrders.filter((o) => o.status !== 'Delivered').length;
  const completedCount = acceptedOrders.filter((o) => o.status === 'Delivered').length;

  // Render setup view if rider hasn't set their location
  if (!riderLocation) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <MapPin className="mx-auto h-12 w-12 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-900">Set Operating Location</h2>
        <p className="text-slate-500">
          Please update your operating location in your profile panel first so we can match you with available orders from kitchens in your area.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Delivery Partner Panel</h2>
          <p className="mt-1 text-slate-500">
            Matching area: <span className="font-semibold text-slate-800">{riderLocation}</span>. Showing available orders from matching seller locations.
          </p>
        </div>
        <Badge variant="success" size="lg" dot>{riderLocation} active</Badge>
      </div>

      {/* Dynamic Stats Grid */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card padding="sm">
          <Bike className="h-5 w-5 text-indigo-500" />
          <p className="mt-3 text-sm text-slate-500">Active Tasks</p>
          <p className="text-2xl font-semibold text-slate-900">{activeTasks}</p>
        </Card>
        <Card padding="sm">
          <ShoppingBag className="h-5 w-5 text-orange-500" />
          <p className="mt-3 text-sm text-slate-500">Available Nearby</p>
          <p className="text-2xl font-semibold text-slate-900">{availableOrders.length}</p>
        </Card>
        <Card padding="sm">
          <PackageCheck className="h-5 w-5 text-emerald-500" />
          <p className="mt-3 text-sm text-slate-500">Completed Deliveries</p>
          <p className="text-2xl font-semibold text-slate-900">{completedCount}</p>
        </Card>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Accepted Orders (Rider's own list) */}
        <Card>
          <h3 className="mb-5 text-xl font-semibold text-slate-900">My Accepted Deliveries</h3>
          <div className="space-y-4">
            {acceptedOrders.length === 0 ? (
              <p className="text-center py-6 text-sm text-slate-400">You haven't accepted any delivery tasks yet.</p>
            ) : (
              acceptedOrders.map((order) => (
                <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-400 font-mono">ID: {order.id}</p>
                      <p className="font-semibold text-slate-900 mt-1">Item: {order.item_name}</p>
                      <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 mt-0.5 text-slate-400" />
                        <span>Pickup: <strong>{order.seller?.full_name || 'Kitchen'}</strong> ({order.seller?.location || 'Unknown'})</span>
                      </p>
                      <p className="mt-1 flex items-start gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 mt-0.5 text-slate-400" />
                        <span>Dropoff: {order.customer?.full_name || 'Customer'}</span>
                      </p>
                    </div>
                    <Badge variant={order.status === 'Delivered' ? 'success' : 'warning'}>{order.status}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <p className="text-sm text-slate-500">{order.eta} / {order.type} / Value: ${Number(order.value).toFixed(2)}</p>
                    <Button
                      size="sm"
                      variant={order.status === 'Delivered' ? 'secondary' : 'primary'}
                      disabled={order.status === 'Delivered'}
                      onClick={() => handleUpdateStatus(order.id, order.status)}
                      icon={<CheckCircle2 className="h-4 w-4" />}
                    >
                      {order.status === 'Delivered' ? 'Completed' : `Mark as ${statusFlow[statusFlow.indexOf(order.status) + 1]}`}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-8">
          {/* Available Nearby Orders (Location matching) */}
          <Card>
            <div className="mb-5 flex items-center gap-2">
              <Route className="h-5 w-5 text-orange-500" />
              <h3 className="text-xl font-semibold text-slate-900">Available Orders Nearby</h3>
            </div>
            <div className="space-y-4">
              {availableOrders.length === 0 ? (
                <p className="text-center py-6 text-sm text-slate-400">No new orders ready for pickup in {riderLocation} area.</p>
              ) : (
                availableOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{order.item_name}</p>
                        <p className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                          <MapPin className="h-4 w-4 text-orange-400" /> Pickup: {order.seller?.full_name || 'Kitchen'}
                        </p>
                      </div>
                      <Badge variant="warning">{order.status}</Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-orange-100 pt-3">
                      <span className="text-xs text-slate-500">{order.eta} / {order.type} / Value: ${Number(order.value).toFixed(2)}</span>
                      <Button size="sm" onClick={() => handleAcceptOrder(order.id)}>
                        Accept Task
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Kitchen Messages */}
          <Card>
            <div className="mb-5 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-slate-500" />
              <h3 className="text-xl font-semibold text-slate-900">Kitchen Messages</h3>
            </div>
            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-center py-6 text-sm text-slate-400">No messages from active order kitchens.</p>
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
        </div>
      </section>
    </div>
  );
};

export default DeliveryPanel;
