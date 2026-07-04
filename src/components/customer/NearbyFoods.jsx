import { useState, useMemo } from 'react';
import { Card, Button, Badge, Toggle } from '../common';
import { MapPin, Sparkles } from 'lucide-react';

const formatPrice = (price) => `$${price.toFixed(2)}`;

// Distance calculation helper (Haversine formula in KM)
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

const NearbyFoods = ({ foods, showNearbyOnly, onToggle, onOrder, onAskAI, userLocation }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('eta');

  // Compute items with dynamic distance & ETA relative to customer's active location
  const processedFoods = useMemo(() => {
    if (!foods || foods.length === 0) return [];

    return foods.map((item) => {
      let dist = item.distance !== undefined ? item.distance : 1.5;

      // Recalculate real distance if item has seller coordinates and user has active coordinates
      if (userLocation && userLocation.lat && userLocation.lng && item.sellerLat && item.sellerLng) {
        dist = calculateDistanceKm(userLocation.lat, userLocation.lng, item.sellerLat, item.sellerLng);
      }

      const estimatedEta = Math.max(12, Math.round(dist * 3 + 10));

      return {
        ...item,
        distance: dist,
        eta: estimatedEta,
      };
    });
  }, [foods, userLocation]);

  const categories = useMemo(() => {
    const cats = ['all', ...new Set(processedFoods.map((f) => f.category))];
    return cats;
  }, [processedFoods]);

  const filteredAndSortedFoods = useMemo(() => {
    let result = [...processedFoods];

    // IF 30-min radius toggle is ON, filter items within 7km or 30-min ETA
    if (showNearbyOnly) {
      result = result.filter((f) => f.distance <= 7.0 || f.eta <= 30);
    }
    // IF 30-min radius toggle is OFF, show ALL items from all sellers!

    if (selectedCategory !== 'all') {
      result = result.filter((f) => f.category === selectedCategory);
    }

    if (sortBy === 'eta') {
      result.sort((a, b) => a.eta - b.eta);
    } else if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [processedFoods, showNearbyOnly, selectedCategory, sortBy]);

  const nearbyCount = processedFoods.filter((f) => f.distance <= 7.0 || f.eta <= 30).length;

  return (
    <Card>
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Nearby Foods</h2>
            <p className="mt-1 text-sm text-slate-500">
              Discover meals delivered within 30 minutes.{' '}
              <span className="text-emerald-600 font-semibold">{nearbyCount} items available in 30-min radius</span>
            </p>
          </div>
          <Toggle
            checked={showNearbyOnly}
            onChange={onToggle}
            label="30-min radius"
            size="md"
          />
        </div>

        {/* Dynamic location indicator banner */}
        {userLocation && userLocation.address && (
          <div className="rounded-lg bg-orange-50/70 border border-orange-200 px-3 py-2 text-xs text-orange-900 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-500 shrink-0" />
            <span>Showing restaurants relative to selected address: <strong className="text-orange-950">{userLocation.address}</strong></span>
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        <select
          className="ml-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="eta">Fastest Delivery</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredAndSortedFoods.map((item) => (
          <div
            key={item.id}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg hover:-translate-y-1"
          >
            <div className="relative h-40 overflow-hidden bg-slate-100">
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  e.target.src = `https://via.placeholder.com/400x200/f1f5f9/94a3b8?text=${encodeURIComponent(item.name)}`;
                }}
              />
              <div className="absolute top-2 left-2 flex gap-2">
                <Badge variant={item.eta <= 30 ? 'success' : 'warning'} size="sm">
                  {item.eta} min
                </Badge>
              </div>
              <div className="absolute top-2 right-2">
                <Badge variant="default" size="sm">
                  {item.distance} km
                </Badge>
              </div>
            </div>

            <div className="p-4 flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">{item.seller}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium text-slate-700">{item.rating}</span>
                  </div>
                </div>

                <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 p-2">
                  <p className="text-[11px] font-semibold text-slate-700">Ingredients & Details:</p>
                  <p className="line-clamp-2 text-xs text-slate-500">{item.description}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <span className="text-lg font-semibold text-slate-900">{formatPrice(item.price)}</span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onAskAI && onAskAI(item)}
                    icon={<Sparkles className="h-3.5 w-3.5 text-emerald-600" />}
                    className="text-xs border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                  >
                    Ask AI
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onOrder(item)}
                  >
                    Order
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedFoods.length === 0 && (
        <div className="py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-4 text-sm text-slate-500">No foods match your current filters or selected location.</p>
        </div>
      )}
    </Card>
  );
};

export default NearbyFoods;
