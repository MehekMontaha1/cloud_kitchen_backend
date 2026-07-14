import { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../common';

const formatPrice = (price) => `৳${price.toFixed(2)}`;

const ShoppingCart = ({ items, onRemove, onCheckout }) => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price, 0);
  }, [items]);

  const deliveryFee = items.length > 0 ? 2.99 : 0;
  const serviceFee = items.length > 0 ? subtotal * 0.05 : 0;
  const discount = promoApplied ? (promoApplied.type === 'percentage' ? subtotal * (promoApplied.discount / 100) : promoApplied.discount) : 0;
  const total = subtotal + deliveryFee + serviceFee - discount;

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'FIRSTORDER10') {
      setPromoApplied({ code: 'FIRSTORDER10', discount: 10, type: 'percentage' });
    } else if (promoCode.toUpperCase() === 'FLAVOR15') {
      setPromoApplied({ code: 'FLAVOR15', discount: 15, type: 'percentage' });
    } else if (promoCode.toUpperCase() === 'NEWUSER20') {
      setPromoApplied({ code: 'NEWUSER20', discount: 5, type: 'fixed' });
    } else {
      setPromoApplied({ code: promoCode, discount: 0, type: 'invalid' });
    }
  };

  const handleCheckout = () => {
    onCheckout(paymentMethod);
    setShowCheckout(false);
  };

  if (items.length === 0) {
    return (
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Shopping Cart</h2>
          <p className="mt-1 text-sm text-slate-500">Review your selected items before checkout.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-slate-100 p-6">
            <svg className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="mt-4 font-semibold text-slate-900">Your cart is empty</h3>
          <p className="mt-1 text-sm text-slate-500">Add some delicious items to get started!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Shopping Cart</h2>
          <p className="mt-1 text-sm text-slate-500">
            {items.length} item{items.length > 1 ? 's' : ''} in your cart
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => onRemove(null)}>
          Clear All
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
          >
            <img
              src={item.image}
              alt={item.name}
              className="h-16 w-16 rounded-lg object-cover"
              onError={(e) => {
                e.target.src = `https://via.placeholder.com/64/f1f5f9/94a3b8?text=${encodeURIComponent(item.name?.[0] || 'F')}`;
              }}
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900 truncate">{item.name}</h4>
              <p className="text-sm text-slate-500">{item.seller}</p>
              <Badge variant="default" size="sm" className="mt-1">
                {item.eta} min delivery
              </Badge>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900">{formatPrice(item.price)}</p>
              <button
                onClick={() => onRemove(item.id)}
                className="mt-1 text-xs text-rose-500 hover:text-rose-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 p-4">
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            placeholder="Promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <Button variant="secondary" size="sm" onClick={handleApplyPromo}>
            Apply
          </Button>
        </div>
        {promoApplied && (
          <div className={`text-sm ${promoApplied.discount > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {promoApplied.discount > 0
              ? `Code ${promoApplied.code} applied! You save ${formatPrice(discount)}`
              : `Invalid promo code: ${promoApplied.code}`}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-2 border-t border-slate-200 pt-4">
        <div className="flex justify-between text-sm text-slate-500">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-500">
          <span>Delivery Fee</span>
          <span>{formatPrice(deliveryFee)}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-500">
          <span>Service Fee</span>
          <span>{formatPrice(serviceFee)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-emerald-600">
            <span>Discount</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-semibold text-slate-900 pt-2 border-t border-slate-200">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <Button
        variant="primary"
        className="mt-6 w-full"
        size="lg"
        onClick={() => setShowCheckout(true)}
      >
        Proceed to Checkout
      </Button>

      <Modal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        title="Confirm Order"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <h4 className="font-medium text-slate-900">Order Summary</h4>
            <p className="mt-1 text-sm text-slate-500">{items.length} items</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Total: {formatPrice(total)}</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900">Payment Method</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className={`rounded-2xl border p-4 text-left transition-all ${paymentMethod === 'stripe'
                    ? 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">Stripe Card Payment</p>
                    <p className="mt-1 text-xs text-slate-500">Pay now by card and track the order after confirmation.</p>
                  </div>
                  <span className={`mt-0.5 h-4 w-4 rounded-full border-2 ${paymentMethod === 'stripe' ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`} />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash_on_delivery')}
                className={`rounded-2xl border p-4 text-left transition-all ${paymentMethod === 'cash_on_delivery'
                    ? 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">Cash on Delivery</p>
                    <p className="mt-1 text-xs text-slate-500">Pay the rider after the food is delivered.</p>
                  </div>
                  <span className={`mt-0.5 h-4 w-4 rounded-full border-2 ${paymentMethod === 'cash_on_delivery' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`} />
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-sm text-emerald-800">
              {paymentMethod === 'stripe'
                ? 'Your card payment is secure. You can track your order in real-time.'
                : 'Your order will be marked as paid after delivery is completed.'}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button variant="success" className="flex-1" onClick={handleCheckout}>
              {paymentMethod === 'stripe' ? 'Pay & Confirm Order' : 'Place Cash Order'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default ShoppingCart;
