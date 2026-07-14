import React, { useState, useMemo } from 'react';
import { Card, Button, Badge } from '../common';
import { Store, Star, MapPin, Clock, ArrowLeft, AlertCircle, ShoppingCart, Sparkles } from 'lucide-react';

const NearbyKitchens = ({ foods, onOrder, onAskAI, hasLocation = true }) => {
  const [selectedKitchenId, setSelectedKitchenId] = useState(null);

  // Extract unique kitchens from the nearby foods list
  const kitchens = useMemo(() => {
    const map = {};
    foods.forEach((food) => {
      const sId = food.sellerId;
      if (sId && !map[sId]) {
        map[sId] = {
          id: sId,
          name: food.seller,
          location: food.sellerLocation || 'Dhaka',
          distance: food.distance,
          eta: food.eta,
          rating: food.rating,
          avatar: food.sellerAvatar || null,
          itemCount: 0,
        };
      }
      if (sId) {
        map[sId].itemCount += 1;
      }
    });
    return Object.values(map);
  }, [foods]);

  // Find the selected kitchen details
  const selectedKitchen = useMemo(() => {
    return kitchens.find((k) => k.id === selectedKitchenId) || null;
  }, [kitchens, selectedKitchenId]);

  // Filter food items belonging to the selected kitchen
  const kitchenItems = useMemo(() => {
    if (!selectedKitchenId) return [];
    return foods.filter((f) => f.sellerId === selectedKitchenId);
  }, [foods, selectedKitchenId]);

  // Rank all kitchen items by popularity, then pick the next available in-stock item for each sold-out card.
  const rankedItems = useMemo(() => {
    return [...kitchenItems].sort((a, b) => {
      const reviewDiff = (b.reviews || 0) - (a.reviews || 0);
      if (reviewDiff !== 0) return reviewDiff;

      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;

      return (a.name || '').localeCompare(b.name || '');
    });
  }, [kitchenItems]);

  // Assign one unique in-stock alternative per sold-out item so the same item is not reused.
  const alternativeMap = useMemo(() => {
    const usedAlternativeIds = new Set();

    return kitchenItems.reduce((acc, item) => {
      if (item.stock > 0) return acc;

      const alternative = rankedItems.find(
        (candidate) =>
          candidate.stock > 0 &&
          !usedAlternativeIds.has(candidate.id) &&
          candidate.id !== item.id
      ) || null;

      if (alternative) {
        usedAlternativeIds.add(alternative.id);
      }

      acc[item.id] = alternative;
      return acc;
    }, {});
  }, [kitchenItems, rankedItems]);

  if (!hasLocation) {
    return (
      <Card className="border border-slate-200">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-bold text-slate-900">Nearby Kitchens</h2>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
              0 Available
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Select your delivery location on the map to view nearby kitchens.</p>
        </div>

        <div className="py-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
          <p className="text-xs text-slate-500">No kitchens are shown until a customer delivery location is selected.</p>
        </div>
      </Card>
    );
  }

  if (selectedKitchen) {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Kitchen Detail Header */}
        <Card className="border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedKitchenId(null)}
                className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              {/* Seller avatar */}
              <div className="relative shrink-0">
                {selectedKitchen.avatar ? (
                  <img src={selectedKitchen.avatar} alt={selectedKitchen.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-orange-300 shadow" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-orange-100 ring-2 ring-orange-300 flex items-center justify-center text-lg font-bold text-orange-600 select-none">
                    {selectedKitchen.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{selectedKitchen.name}</h2>
                  <Badge variant="primary" size="sm">
                    {selectedKitchen.itemCount} Items
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {selectedKitchen.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" /> {selectedKitchen.eta} mins
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> {selectedKitchen.rating || '0.0'} average rating
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedKitchenId(null)}
            >
              Back to Kitchens list
            </Button>
          </div>
        </Card>

        {/* Menu Items Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kitchenItems.map((item) => {
            const isOutOfStock = item.stock <= 0;
            const alternative = isOutOfStock ? alternativeMap[item.id] : null;

            return (
              <div
                key={item.id}
                className={`group flex flex-col justify-between overflow-hidden rounded-2xl border transition-all bg-white hover:shadow-lg ${isOutOfStock ? 'border-rose-100 bg-rose-50/5' : 'border-slate-200'
                  }`}
              >
                {/* Food Image */}
                <div className="relative h-36 overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/400x200/f1f5f9/94a3b8?text=${encodeURIComponent(item.name)}`;
                    }}
                  />
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center">
                      <span className="bg-rose-600 text-white font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        Not Available
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">{item.name}</h3>
                      <div className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 shrink-0">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {item.rating || '0.0'}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>

                    {/* Stock Status Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {item.category || 'Food'}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.stock > 0 ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                        {item.stock > 0 ? `Stock: ${item.stock}` : 'Out of Stock'}
                      </span>
                    </div>

                    {/* Out of Stock Notice & Alternative Suggestion */}
                    {isOutOfStock && (
                      <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-2.5 mt-2 space-y-1.5 animate-pulse">
                        <p className="text-[10px] font-bold text-rose-700 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                          This item is currently not available.
                        </p>
                        {alternative ? (
                          <div className="text-[10px] text-slate-600 space-y-1 border-t border-rose-100/50 pt-1.5">
                            <span className="font-semibold text-slate-700">💡 Best-selling alternative:</span>
                            <div className="flex items-center justify-between gap-2 bg-white rounded border border-slate-100 p-1.5 mt-1 shadow-2xs">
                              <span className="font-bold text-slate-800 truncate max-w-22.5">{alternative.name}</span>
                              <button
                                onClick={() => onOrder(alternative)}
                                className="text-[9px] font-bold text-orange-600 hover:text-white bg-orange-50 hover:bg-orange-600 px-2 py-0.5 rounded transition-all flex items-center gap-0.5"
                              >
                                <ShoppingCart className="h-2 w-2" /> Order Instead
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[9px] text-slate-400 italic">No in-stock alternatives available in this kitchen.</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-50 pt-3">
                    <div className="flex flex-col">
                      {item.originalPrice && (
                        <span className="text-[9px] text-slate-400 line-through">
                          ৳{item.originalPrice.toFixed(2)}
                        </span>
                      )}
                      <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
                        ৳{item.price.toFixed(2)}
                        {item.flashDiscount && (
                          <span className="text-[8px] font-bold text-rose-600 bg-rose-50 px-1 rounded animate-pulse shrink-0">
                            {item.flashDiscount}% OFF
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onAskAI && onAskAI(item)}
                        icon={<Sparkles className="h-3 w-3 text-emerald-600" />}
                        className="text-[10px] px-2 py-1 border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                      >
                        Ask AI
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onOrder(item)}
                        disabled={isOutOfStock}
                        className="text-[10px] px-3.5 py-1"
                      >
                        {isOutOfStock ? 'Sold Out' : 'Order'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Card className="border border-slate-200">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-bold text-slate-900">Nearby Kitchens</h2>
          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-bold">
            {kitchens.length} Available
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Browse our partner kitchens in your delivery radius and explore their complete menus.</p>
      </div>

      {kitchens.length === 0 ? (
        <div className="py-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
          <p className="text-xs text-slate-500">No partner kitchens available in your location.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {kitchens.map((kitchen) => (
            <div
              key={kitchen.id}
              onClick={() => setSelectedKitchenId(kitchen.id)}
              className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between h-36"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  {/* Seller avatar */}
                  {kitchen.avatar ? (
                    <img src={kitchen.avatar} alt={kitchen.name} className="h-9 w-9 rounded-full object-cover ring-2 ring-orange-200 shrink-0" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-orange-50 ring-2 ring-orange-200 flex items-center justify-center text-sm font-bold text-orange-500 shrink-0 select-none">
                      {kitchen.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-orange-600 transition-colors truncate">
                    {kitchen.name}
                  </h3>
                  <div className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 shrink-0 ml-auto">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {kitchen.rating || '0.0'}
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-1">
                  <MapPin className="h-3 w-3 shrink-0" /> {kitchen.location}
                </p>
              </div>

              <div className="border-t border-slate-50 pt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3 text-slate-400" /> {kitchen.eta} mins
                </span>
                <span className="text-orange-600 hover:underline">View Menu →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default NearbyKitchens;
