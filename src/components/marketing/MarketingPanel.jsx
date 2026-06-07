import { BellRing, MapPinned, Percent, TimerReset } from 'lucide-react';
import { Badge, Button, Card, Input } from '../common';
import { nearbyNotificationsData } from '../../data/platformData';

const MarketingPanel = ({ deals }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Marketing Features</h2>
        <p className="mt-1 text-slate-500">Promo redemption, flash countdowns, and nearby deal notifications based on customer location.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card padding="sm">
          <Percent className="h-5 w-5 text-emerald-600" />
          <p className="mt-3 text-sm text-slate-500">Promo Code</p>
          <p className="text-2xl font-semibold text-slate-900">FIRSTORDER10</p>
        </Card>
        <Card padding="sm">
          <TimerReset className="h-5 w-5 text-orange-600" />
          <p className="mt-3 text-sm text-slate-500">Live Flash Deals</p>
          <p className="text-2xl font-semibold text-slate-900">{deals.length}</p>
        </Card>
        <Card padding="sm">
          <MapPinned className="h-5 w-5 text-sky-600" />
          <p className="mt-3 text-sm text-slate-500">Location Targeting</p>
          <p className="text-2xl font-semibold text-slate-900">30 min</p>
        </Card>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h3 className="mb-4 text-xl font-semibold text-slate-900">Promo Redemption</h3>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <Input label="Campaign code" value="FIRSTORDER10" readOnly />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Discount</p><p className="font-semibold">10% off</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Uses</p><p className="font-semibold">1,204</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Conversion</p><p className="font-semibold">18.6%</p></div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <BellRing className="h-5 w-5 text-slate-500" />
            <h3 className="text-xl font-semibold text-slate-900">Nearby Deal Notifications</h3>
          </div>
          <div className="space-y-3">
            {nearbyNotificationsData.map((notification) => (
              <div key={notification.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <p className="font-semibold text-slate-900">{notification.title}</p>
                  <p className="text-sm text-slate-500">{notification.radius} / {notification.sent}</p>
                </div>
                <Badge variant={notification.status === 'Live' ? 'success' : 'warning'}>{notification.status}</Badge>
              </div>
            ))}
          </div>
          <Button className="mt-5" icon={<BellRing className="h-4 w-4" />}>Send Location Campaign</Button>
        </Card>
      </section>
    </div>
  );
};

export default MarketingPanel;
