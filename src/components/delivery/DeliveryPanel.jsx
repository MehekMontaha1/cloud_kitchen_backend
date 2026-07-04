import { useState, useEffect } from 'react';
import { Bike, CheckCircle2, MapPin, PackageCheck, Route, MessageSquare, ShoppingBag } from 'lucide-react';
import { Badge, Button, Card, DeliveryRouteMap, MapPicker } from '../common';
import InboxMessaging from '../customer/InboxMessaging';

const statusFlow = ['Accepted', 'Picked Up', 'Delivered'];

const DeliveryPanel = () => {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [riderLocation, setRiderLocation] = useState('');
  const [riderCoords, setRiderCoords] = useState({ lat: 23.8103, lng: 90.4125 });
  const [loading, setLoading] = useState(true);

  // 1. Fetch available orders, accepted orders, messages and rider location
  const fetchDeliveryData = async () => {
    try {
      setLoading(true);
      // Fetch rider profile to get location & coordinates
      const profileRes = await fetch('/api/users/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.success && profileData.data) {
          setRiderLocation(profileData.data.location || '');
          if (profileData.data.latitude && profileData.data.longitude) {
            setRiderCoords({
              lat: Number(profileData.data.latitude),
              lng: Number(profileData.data.longitude),
            });
          }
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
    let nextStatus = 'Picked Up';
    if (currentStatus === 'Accepted' || currentStatus === 'Ready') {
      nextStatus = 'Picked Up';
    } else if (currentStatus === 'Picked Up') {
      nextStatus = 'Delivered';
    } else {
      return;
    }

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

  const handleSendRiderReply = async () => {
    if (!replyText.trim()) return;
    setSendingMsg(true);
    try {
      const res = await fetch('/api/delivery/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText.trim() }),
      });

      if (res.ok) {
        setReplyText('');
        fetchDeliveryData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to send message.');
      }
    } catch (err) {
      console.error('Error sending rider message:', err);
    } finally {
      setSendingMsg(false);
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

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Delivery Partner Panel</h2>
          <p className="mt-1 text-slate-500">
            Matching area: <span className="font-semibold text-slate-800">{riderLocation || 'Not Set'}</span>. Showing available orders from matching seller locations.
          </p>
        </div>
        <Badge variant={riderLocation ? 'success' : 'warning'} size="lg" dot>
          {riderLocation ? `${riderLocation} active` : 'Set location on map below'}
        </Badge>
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

      {/* Delivery Rider Operating Area Map */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-500" />
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Rider Operating Zone Map</h3>
              <p className="text-xs text-slate-500">
                Pin your active operating location in Bangladesh to match orders from kitchens inside your red coverage circle.
              </p>
            </div>
          </div>
          <Badge variant="success">Red Circle: Operating Zone</Badge>
        </div>

        <MapPicker
          initialLat={riderCoords.lat}
          initialLng={riderCoords.lng}
          radiusMeters={7000} // 7km coverage circle
          circleColor="#ef4444" // RED circle for Rider Operating Zone
          showSaveButton={true}
          height="320px"
          onLocationChange={(loc) => {
            setRiderLocation(loc.address || 'Location Set');
            setRiderCoords({ lat: loc.lat, lng: loc.lng });
          }}
        />
      </Card>

      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Accepted Orders (Rider's own list) */}
        <Card>
          <h3 className="mb-5 text-xl font-semibold text-slate-900">My Accepted Deliveries</h3>
          <div className="space-y-4">
            {acceptedOrders.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Bike className="mx-auto h-10 w-10 text-slate-300" />
                <p className="text-sm text-slate-400">You haven't accepted any delivery tasks yet.</p>
              </div>
            ) : (
              acceptedOrders.map((order) => (
                <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-400 font-mono">ID: {order.id}</p>
                      <p className="font-semibold text-slate-900 mt-1">Item: {order.item_name}</p>
                      <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 mt-0.5 text-slate-400" />
                        <span>Pickup: <strong>{order.seller?.full_name || 'Kitchen'}</strong> ({order.seller?.location || 'Dhaka'})</span>
                      </p>
                      <p className="mt-1 flex items-start gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 mt-0.5 text-slate-400" />
                        <span>Dropoff: {order.customer?.full_name || 'Customer'}</span>
                      </p>
                    </div>
                    <Badge variant={order.status === 'Delivered' ? 'success' : 'warning'}>{order.status}</Badge>
                  </div>

                  {/* Real Route Map connecting Pickup and Dropoff */}
                  <DeliveryRouteMap
                    pickup={{
                      lat: order.seller?.latitude || riderCoords.lat,
                      lng: order.seller?.longitude || riderCoords.lng,
                      name: `${order.seller?.full_name || 'Cloud Kitchen'} (${order.seller?.location || 'Dhaka'})`,
                    }}
                    dropoff={{
                      lat: order.customer?.latitude || riderCoords.lat - 0.02,
                      lng: order.customer?.longitude || riderCoords.lng + 0.02,
                      name: `${order.customer?.full_name || 'Customer'}`,
                    }}
                    height="220px"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
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
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Available Orders Nearby</h3>
                <p className="text-xs text-slate-500">Preview kitchen pickup & customer dropoff locations on the map before accepting.</p>
              </div>
            </div>
            <div className="space-y-4">
              {availableOrders.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <ShoppingBag className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-400">No new orders ready for pickup in {riderLocation || 'your'} area.</p>
                </div>
              ) : (
                availableOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-orange-200 bg-white p-4 space-y-3 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 text-base">{order.item_name}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                          <span>Pickup: <strong>{order.seller?.shop_name || order.seller?.full_name || 'Kitchen'}</strong> ({order.seller?.location || 'Dhaka'})</span>
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span>Dropoff: <strong>{order.customer?.full_name || 'Customer'}</strong> ({order.delivery_address || 'Dhaka'})</span>
                        </p>
                      </div>
                      <Badge variant="warning">{order.status}</Badge>
                    </div>

                    {/* Preview map displaying BOTH Seller (Pickup) and Customer (Dropoff) before acceptance */}
                    <DeliveryRouteMap
                      pickup={{
                        lat: order.seller?.latitude || riderCoords.lat,
                        lng: order.seller?.longitude || riderCoords.lng,
                        name: `Pickup: ${order.seller?.shop_name || order.seller?.full_name || 'Kitchen'}`,
                      }}
                      dropoff={{
                        lat: order.delivery_latitude || order.customer?.latitude || riderCoords.lat - 0.015,
                        lng: order.delivery_longitude || order.customer?.longitude || riderCoords.lng + 0.015,
                        name: `Dropoff: ${order.customer?.full_name || 'Customer'}`,
                      }}
                      height="180px"
                    />

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
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

          <InboxMessaging userRole="delivery" />
        </div>
      </section>
    </div>
  );
};

export default DeliveryPanel;
