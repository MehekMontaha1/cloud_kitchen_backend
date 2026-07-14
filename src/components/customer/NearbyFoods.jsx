import { useState, useMemo } from 'react';
import { Card, Button, Badge, Toggle, Modal } from '../common';
import { MapPin, Sparkles, Star, MessageSquare } from 'lucide-react';

const formatPrice = (price) => `৳${price.toFixed(2)}`;

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

const CATEGORY_MAPPING = {
  all: { label: 'All', emoji: '🍽️', keywords: [] },
  food: { label: 'Food', emoji: '🍲', keywords: [] },
  rice: { label: 'Rice', emoji: '🍚', keywords: ['rice', 'biryani', 'pulao', 'khichuri', 'nasi'] },
  curry: { label: 'Curry', emoji: '🍛', keywords: ['curry', 'masala', 'korma', 'gravy', 'jhol', 'bhuna', 'tarkari', 'dal'] },
  fastfood: { label: 'Fast Food', emoji: '🍔', keywords: ['burger', 'pizza', 'fries', 'sandwich', 'fastfood', 'fast food', 'pasta', 'shawarma', 'hotdog'] },
  cake: { label: 'Cake & Desserts', emoji: '🍰', keywords: ['cake', 'pastry', 'pudding', 'bakery', 'cupcake', 'muffin', 'waffle', 'dessert', 'sweet', 'ice cream', 'custard'] },
  drinks: { label: 'Drinks', emoji: '🥤', keywords: ['drink', 'beverage', 'juice', 'coffee', 'tea', 'shake', 'soda', 'cola', 'lassi'] }
};

const NearbyFoods = ({ foods, showNearbyOnly, onToggle, onOrder, onAskAI, userLocation, hasLocation = true }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('eta');

  // Review states
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [reviewsTargetSeller, setReviewsTargetSeller] = useState(null);
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Compute items with dynamic distance & ETA relative to customer's active location
  const processedFoods = useMemo(() => {
    if (!hasLocation) return [];
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
  }, [foods, userLocation, hasLocation]);

  const categoriesList = useMemo(() => {
    const predefinedKeys = Object.keys(CATEGORY_MAPPING);
    const otherCats = [...new Set(processedFoods.map((f) => (f.category || '').trim()))]
      .filter((cat) => {
        if (!cat) return false;
        const normalized = cat.toLowerCase().replace(/\s+/g, '');
        return normalized !== 'food' && normalized !== 'all' && !predefinedKeys.includes(normalized);
      });

    return [
      ...Object.entries(CATEGORY_MAPPING).map(([key, item]) => ({
        key,
        label: item.label,
        emoji: item.emoji,
        isPredefined: true
      })),
      ...otherCats.map((cat) => ({
        key: cat,
        label: cat,
        emoji: '🍱',
        isPredefined: false
      }))
    ];
  }, [processedFoods]);

  const filteredAndSortedFoods = useMemo(() => {
    let result = [...processedFoods];

    // IF 30-min radius toggle is ON, filter items within 7km or 30-min ETA
    if (showNearbyOnly) {
      result = result.filter((f) => f.distance <= 7.0 || f.eta <= 30);
    }

    if (selectedCategory !== 'all') {
      const mapping = CATEGORY_MAPPING[selectedCategory];
      if (mapping) {
        result = result.filter((f) => {
          const foodCat = (f.category || '').toLowerCase().replace(/\s+/g, '');
          const foodName = (f.name || '').toLowerCase();
          const foodDesc = (f.description || '').toLowerCase();

          if (foodCat === selectedCategory) return true;
          return mapping.keywords.some(kw => foodName.includes(kw) || foodDesc.includes(kw));
        });
      } else {
        result = result.filter((f) => (f.category || '').toLowerCase().trim() === selectedCategory.toLowerCase().trim());
      }
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

  const fetchReviews = async (sellerId) => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/reviews?seller_id=${sellerId}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setReviewsList(result.data || []);
        }
      }
    } catch (e) {
      console.error('Error fetching reviews:', e);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleOpenReviews = (item) => {
    setReviewsTargetSeller({
      id: item.sellerId,
      name: item.seller
    });
    setNewRating(5);
    setNewComment('');
    setSubmitError(null);
    setSubmitSuccess(false);
    setReviewsList([]);
    setIsReviewsOpen(true);
    fetchReviews(item.sellerId);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewsTargetSeller) return;
    setSubmittingReview(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: reviewsTargetSeller.id,
          rating: newRating,
          comment: newComment
        })
      });

      if (res.ok) {
        setNewComment('');
        setSubmitSuccess(true);
        fetchReviews(reviewsTargetSeller.id);
      } else {
        const errData = await res.json();
        setSubmitError(errData.error || 'Failed to submit review');
      }
    } catch (err) {
      setSubmitError('An error occurred. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!hasLocation) {
    return (
      <Card>
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Nearby Foods</h2>
              <p className="mt-1 text-sm text-slate-500">
                Select your delivery location on the map to discover foods within your delivery radius.
              </p>
            </div>
            <Toggle
              checked={showNearbyOnly}
              onChange={onToggle}
              label="30-min radius"
              size="md"
            />
          </div>
        </div>

        <div className="py-12 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
          <MapPin className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-sm font-semibold text-slate-700">No delivery location selected</p>
          <p className="mt-1 text-xs text-slate-500">Pick a point from the map below before browsing kitchens and food items.</p>
        </div>
      </Card>
    );
  }

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
          {categoriesList.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all hover:scale-105 ${isSelected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
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
            </div>

            <div className="p-4 flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{item.seller}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {item.category || 'Food'}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.stock > 0 ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                        {item.stock > 0 ? `Stock: ${item.stock}` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-slate-700">{item.rating}</span>
                    </div>
                    <button
                      onClick={() => handleOpenReviews(item)}
                      className="text-[10px] text-slate-400 hover:text-indigo-600 underline font-semibold flex items-center gap-0.5"
                    >
                      <MessageSquare className="h-2.5 w-2.5" /> Reviews
                    </button>
                  </div>
                </div>

                <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 p-2">
                  <p className="text-[11px] font-semibold text-slate-700">Ingredients & Details:</p>
                  <p className="line-clamp-2 text-xs text-slate-500">{item.description}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col">
                  {item.originalPrice && (
                    <span className="text-[10px] text-slate-400 line-through">
                      {formatPrice(item.originalPrice)}
                    </span>
                  )}
                  <span className="text-lg font-semibold text-slate-900 flex items-center gap-1">
                    {formatPrice(item.price)}
                    {item.flashDiscount && (
                      <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 rounded animate-pulse shrink-0">
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
                    icon={<Sparkles className="h-3.5 w-3.5 text-emerald-600" />}
                    className="text-xs border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                  >
                    Ask AI
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onOrder(item)}
                    disabled={item.stock <= 0}
                  >
                    {item.stock > 0 ? 'Order' : 'Out of Stock'}
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

      {/* Reviews Modal */}
      <Modal
        isOpen={isReviewsOpen}
        onClose={() => setIsReviewsOpen(false)}
        title={reviewsTargetSeller ? `${reviewsTargetSeller.name} - Verified Reviews` : 'Reviews'}
        size="lg"
      >
        <div className="space-y-6 sm:max-h-[500px] sm:overflow-y-auto sm:pr-1">
          {/* Reviews List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Feedback</h3>
            {reviewsLoading ? (
              <div className="py-4 text-center text-xs text-slate-500">Loading reviews...</div>
            ) : reviewsList.length === 0 ? (
              <div className="py-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                <p className="text-xs text-slate-500">No reviews yet for this kitchen.</p>
                <p className="text-[10px] text-slate-400 mt-1">Be the first to place a completed order and write a verified review!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviewsList.map((rev) => (
                  <div key={rev.id} className="border border-slate-100 bg-slate-50/50 rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{rev.customer_name}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {/* Rating stars display */}
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                        />
                      ))}
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded ml-1">
                        Verified Purchase
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review Submission Form */}
          <form onSubmit={handleSubmitReview} className="border-t border-slate-100 pt-5 space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Write a Verified Review</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Only customers with a completed order from this kitchen can post reviews.
              </p>
            </div>

            {submitError && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 font-medium">
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-medium">
                ✅ Review submitted successfully!
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((stars) => (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setNewRating(stars)}
                    className="p-0.5 rounded focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 transition-all ${stars <= newRating ? 'fill-amber-400 text-amber-400 scale-110' : 'text-slate-300'
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">Comments</label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience (e.g. food taste, preparation speed)..."
                rows={3}
                required
                className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="w-full rounded-xl py-2"
              disabled={submittingReview}
            >
              {submittingReview ? 'Verifying & Posting...' : 'Post Review'}
            </Button>
          </form>
        </div>
      </Modal>
    </Card>
  );
};

export default NearbyFoods;
