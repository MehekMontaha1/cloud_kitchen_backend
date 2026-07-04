import { useState, useEffect } from 'react';
import { Card, Button, Badge, Input } from '../common';

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${secs}s`;
};

const OffersFlashDeals = ({ deals, promoCode, onPromoChange }) => {
  const [localPromo, setLocalPromo] = useState(promoCode);
  const [promoStatus, setPromoStatus] = useState(null);
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newState = {};
        deals.forEach((deal) => {
          newState[deal.id] = Math.max((prev[deal.id] ?? deal.timeLeft) - 1, 0);
        });
        return newState;
      });
    }, 1000);

    deals.forEach((deal) => {
      setTimeLeft((prev) => ({ ...prev, [deal.id]: deal.timeLeft }));
    });

    return () => clearInterval(interval);
  }, [deals]);

  const handleApplyPromo = () => {
    const code = localPromo.toUpperCase();
    onPromoChange(code);
    if (code === 'FIRSTORDER10') {
      setPromoStatus({ success: true, message: '10% first order discount applied!' });
    } else if (code === 'FLAVOR15') {
      setPromoStatus({ success: true, message: '15% discount applied!' });
    } else if (code === 'NEWUSER20') {
      setPromoStatus({ success: true, message: '৳5 off your order!' });
    } else if (code === 'FREEDELIVERY') {
      setPromoStatus({ success: true, message: 'Free delivery activated!' });
    } else {
      setPromoStatus({ success: false, message: 'Invalid promo code' });
    }

    setTimeout(() => {
      setPromoStatus(null);
    }, 3000);
  };

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Offers & Flash Deals</h2>
        <p className="mt-1 text-sm text-slate-500">
          Apply promos or grab limited-time flash deals before they expire.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Have a promo code?</h3>
        <div className="flex gap-3">
          <Input
            placeholder="Enter promo code"
            value={localPromo}
            onChange={(e) => {
              setLocalPromo(e.target.value.toUpperCase());
              setPromoStatus(null);
            }}
            className="flex-1"
          />
          <Button variant="primary" onClick={handleApplyPromo}>
            Apply
          </Button>
        </div>
        {promoStatus && (
          <div className={`mt-3 flex items-center gap-2 text-sm ${promoStatus.success ? 'text-emerald-600' : 'text-rose-500'}`}>
            {promoStatus.success ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {promoStatus.message}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
          <span>Try:</span>
          <button className="hover:text-slate-600 underline" onClick={() => setLocalPromo('FLAVOR15')}>FLAVOR15</button>
          <button className="hover:text-slate-600 underline" onClick={() => setLocalPromo('FIRSTORDER10')}>FIRSTORDER10</button>
          <button className="hover:text-slate-600 underline" onClick={() => setLocalPromo('NEWUSER20')}>NEWUSER20</button>
          <button className="hover:text-slate-600 underline" onClick={() => setLocalPromo('FREEDELIVERY')}>FREEDELIVERY</button>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-slate-900">Flash Deals</h3>
          <Badge variant="danger" size="md" className="animate-pulse">
            Limited Time
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => {
            const saving = deal.originalPrice - deal.dealPrice;
            const percentOff = Math.round((saving / deal.originalPrice) * 100);
            const remaining = timeLeft[deal.id] ?? deal.timeLeft;
            const isUrgent = remaining < 600;

            return (
              <div
                key={deal.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={deal.image}
                    alt={deal.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/400x200/f1f5f9/94a3b8?text=${encodeURIComponent(deal.title)}`;
                    }}
                  />
                  <div className="absolute top-2 left-2 flex flex-col gap-2">
                    <Badge variant="danger" size="sm">
                      {percentOff}% OFF
                    </Badge>
                    {deal.itemsLeft <= 10 && (
                      <Badge variant="warning" size="sm">
                        Only {deal.itemsLeft} left
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <h4 className="font-semibold text-slate-900">{deal.title}</h4>
                  <p className="mt-0.5 text-sm text-slate-500">{deal.description}</p>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-lg font-semibold text-slate-900">৳{deal.dealPrice}</span>
                    <span className="text-sm text-slate-400 line-through">৳{deal.originalPrice.toFixed(2)}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className={`flex items-center gap-1 text-sm ${isUrgent ? 'text-rose-500' : 'text-slate-500'}`}>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={`font-medium ${isUrgent ? 'animate-pulse' : ''}`}>
                        {formatTime(remaining)}
                      </span>
                    </div>
                    <Button variant="primary" size="sm">
                      Grab Deal
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default OffersFlashDeals;
