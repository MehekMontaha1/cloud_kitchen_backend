import { useState } from 'react';
import { Bike, CheckCircle2, MapPin, PackageCheck, Route, XCircle } from 'lucide-react';
import { Badge, Button, Card } from '../common';
import { deliveryOrdersData, excludedCustomOrdersData } from '../../data/platformData';

const statusFlow = ['Assigned', 'Accepted', 'Picked Up', 'Delivered'];

const DeliveryPanel = () => {
  const [orders, setOrders] = useState(deliveryOrdersData);

  const advance = (id) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== id) return order;
        const currentIndex = statusFlow.indexOf(order.status);
        return { ...order, status: statusFlow[Math.min(currentIndex + 1, statusFlow.length - 1)] };
      })
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Delivery Partner Panel</h2>
          <p className="mt-1 text-slate-500">Regular nearby deliveries only. Custom distant orders are excluded from regular riders.</p>
        </div>
        <Badge variant="success" size="lg" dot>30-min radius active</Badge>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card padding="sm"><Bike className="h-5 w-5 text-slate-500" /><p className="mt-3 text-sm text-slate-500">Assigned</p><p className="text-2xl font-semibold text-slate-900">{orders.length}</p></Card>
        <Card padding="sm"><Route className="h-5 w-5 text-slate-500" /><p className="mt-3 text-sm text-slate-500">Avg route</p><p className="text-2xl font-semibold text-slate-900">5.4 km</p></Card>
        <Card padding="sm"><PackageCheck className="h-5 w-5 text-slate-500" /><p className="mt-3 text-sm text-slate-500">Completed</p><p className="text-2xl font-semibold text-slate-900">17</p></Card>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h3 className="mb-5 text-xl font-semibold text-slate-900">Assigned Order List</h3>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{order.id}</p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4" /> Pickup: {order.pickup}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4" /> Dropoff: {order.dropoff}</p>
                  </div>
                  <Badge variant={order.status === 'Delivered' ? 'success' : 'warning'}>{order.status}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">{order.distance} / {order.eta} / {order.type}</p>
                  <Button
                    size="sm"
                    variant={order.status === 'Delivered' ? 'secondary' : 'primary'}
                    disabled={order.status === 'Delivered'}
                    onClick={() => advance(order.id)}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    {order.status === 'Delivered' ? 'Completed' : 'Update Status'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-5 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-rose-500" />
            <h3 className="text-xl font-semibold text-slate-900">Custom Orders Excluded</h3>
          </div>
          <div className="space-y-3">
            {excludedCustomOrdersData.map((order) => (
              <div key={order.id} className="rounded-xl border border-rose-100 bg-rose-50 p-4">
                <p className="font-semibold text-rose-900">{order.id} / {order.seller}</p>
                <p className="mt-1 text-sm text-rose-700">{order.reason}</p>
                <p className="mt-2 text-xs text-rose-500">Estimated: {order.eta}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
};

export default DeliveryPanel;
