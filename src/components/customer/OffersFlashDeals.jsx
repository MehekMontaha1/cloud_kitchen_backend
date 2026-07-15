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

const OffersFlashDeals = ({ deals, onClaimDeal }) => {
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

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Offers & Flash Deals</h2>
        <p className="mt-1 text-sm text-slate-500">
          Grab limited-time flash deals before they expire.
        </p>
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
            const percentOff = deal.discount ?? (deal.originalPrice && deal.dealPrice ? Math.round(((deal.originalPrice - deal.dealPrice) / deal.originalPrice) * 100) : 0);
            const remaining = timeLeft[deal.id] ?? deal.timeLeft;
            const isUrgent = remaining < 600;

            return (
              <div
                key={deal.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col"
              >
                {/* ── Avatar hero area (no food image) ── */}
                <div className="relative flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 py-7">
                  {/* Discount badge */}
                  <span className="absolute top-3 left-3 rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow">
                    {percentOff}% OFF
                  </span>
                  {deal.itemsLeft !== undefined && deal.itemsLeft <= 10 && (
                    <span className="absolute top-3 right-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                      Only {deal.itemsLeft} left
                    </span>
                  )}

                  {/* Seller avatar – large, centred */}
                  {deal.sellerAvatar ? (
                    <img
                      src={deal.sellerAvatar}
                      alt={deal.seller}
                      className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-orange-500 ring-4 ring-white shadow-lg flex items-center justify-center text-3xl font-extrabold text-white select-none transition-transform duration-300 group-hover:scale-105">
                      {deal.seller.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* ── Card body ── */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{deal.title}</h4>
                    <span className="text-[11px] font-semibold text-orange-600">{deal.seller}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-1">{deal.description}</p>

                  <div className="mt-2 flex items-center gap-2">
                    {deal.dealPrice !== undefined && deal.dealPrice > 0 ? (
                      <>
                        <span className="text-lg font-semibold text-slate-900">৳{deal.dealPrice}</span>
                        <span className="text-sm text-slate-400 line-through">৳{deal.originalPrice?.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        🎉 Kitchen-wide discount active!
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <div className={`flex items-center gap-1 text-sm ${isUrgent ? 'text-rose-500' : 'text-slate-500'}`}>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={`font-medium ${isUrgent ? 'animate-pulse' : ''}`}>
                        {formatTime(remaining)}
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (onClaimDeal) onClaimDeal(deal);
                        alert(`🎉 Flash Offer Claimed!\nEnjoy ${percentOff}% off on ${deal.itemIds ? 'selected items' : 'all items'} from ${deal.seller}.`);
                      }}
                    >
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
