import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, DeliveryRouteMap } from '../common';
import { Bike, Clock, MapPin, Phone, CheckCircle, Store, ShoppingBag, X } from 'lucide-react';

const orderSteps = [
  { id: 'Pending', label: 'Order Placed', desc: 'Received by kitchen' },
  { id: 'Preparing', label: 'Kitchen Preparing', desc: 'Chef is cooking your meal' },
  { id: 'Ready', label: 'Ready for Pickup', desc: 'Waiting for delivery rider' },
  { id: 'Accepted', label: 'Rider Assigned', desc: 'Rider heading to kitchen' },
  { id: 'Picked Up', label: 'On The Way', desc: 'Out for delivery' },
  { id: 'Delivered', label: 'Delivered', desc: 'Enjoy your meal!' },
];

const OrderTracking = ({ orderId, onClose }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulatedEta, setSimulatedEta] = useState(18);

  const fetchTracking = async () => {
    try {
      if (orderId && orderId !== 'mock') {
        const res = await fetch(`/api/orders/${orderId}/track`);
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            setTrackingData(result.data);
            setSimulatedEta(result.data.etaMinutes || 18);
            return;
          }
        }
      }

      // Mock fallback data for demonstration if no live DB order ID
      setTrackingData({
        orderId: orderId || 'ORD-8942',
        status: 'Picked Up',
        itemName: 'Citrus Salmon Bowl & Truffle Ramen',
        value: 32.5,
        etaMinutes: 14,
        customer: {
          address: 'Dhanmondi Road 27, Dhaka',
          lat: 23.7461,
          lng: 90.3742,
        },
        kitchen: {
          name: 'Ocean & Co. Kitchen',
          location: 'Banani, Dhaka',
          lat: 23.7925,
          lng: 90.4078,
          phone: '+880 1711-223344',
        },
        rider: {
          name: 'Rahim Ahmed (Rider)',
          phone: '+880 1819-556677',
          lat: 23.7700,
          lng: 90.3900,
        },
      });
    } catch (err) {
      console.error('Error fetching tracking data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(() => {
      setSimulatedEta((prev) => Math.max(1, prev - 1));
    }, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <Card>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      </Card>
    );
  }

  const currentStatusIndex = orderSteps.findIndex((s) => s.id === trackingData?.status);
  const activeStep = currentStatusIndex !== -1 ? currentStatusIndex : 4;

  return (
    <Card className="relative overflow-hidden border border-orange-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Live Order Tracking</h2>
            <Badge variant="success" size="sm" dot>Live GPS</Badge>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-0.5">Order ID: {trackingData?.orderId}</p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Left: Map & Progress */}
        <div className="space-y-5">
          {/* Live Map Route */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Live Courier & Route Map</span>
              {trackingData?.status === 'Cancelled' ? (
                <span className="text-xs font-medium text-rose-600 flex items-center gap-1">
                  <X className="h-3.5 w-3.5" /> Cancelled
                </span>
              ) : trackingData?.status === 'Delivered' ? (
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Delivered
                </span>
              ) : (
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Est. Arrival: ~{simulatedEta} mins
                </span>
              )}
            </div>

            <DeliveryRouteMap
              pickup={{
                lat: trackingData?.kitchen?.lat || 23.7925,
                lng: trackingData?.kitchen?.lng || 90.4078,
                name: trackingData?.kitchen?.name || 'Cloud Kitchen',
              }}
              dropoff={{
                lat: trackingData?.customer?.lat || 23.7461,
                lng: trackingData?.customer?.lng || 90.3742,
                name: 'Delivery Address',
              }}
              height="280px"
            />
          </div>

          {/* Status Step Progress Timeline */}
          {trackingData?.status === 'Cancelled' ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-center">
              <h4 className="text-xs font-semibold text-rose-800 uppercase tracking-wider mb-2">Order Progress</h4>
              <p className="text-xs text-rose-700">This order was cancelled. No delivery progress is active.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">Order Progress</h4>
              <div className="relative flex items-center justify-between">
                {/* Progress Line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
                <div
                  className="absolute top-1/2 left-0 h-1 bg-orange-500 -translate-y-1/2 z-0 transition-all duration-500"
                  style={{ width: `${(activeStep / (orderSteps.length - 1)) * 100}%` }}
                />

                {orderSteps.map((step, idx) => {
                  const isPassed = idx <= activeStep;
                  const isCurrent = idx === activeStep;
                  return (
                    <div key={step.id} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-orange-500 text-white ring-4 ring-orange-100 scale-110'
                            : isPassed
                            ? 'bg-orange-500 text-white'
                            : 'bg-white border-2 border-slate-300 text-slate-400'
                        }`}
                      >
                        {isPassed ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                      </div>
                      <span className={`mt-2 text-[10px] font-medium text-center max-w-[60px] ${isCurrent ? 'text-orange-600 font-bold' : 'text-slate-500'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Details & Courier Info */}
        <div className="space-y-4">
          {/* Estimated Time Card */}
          {trackingData?.status === 'Cancelled' ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">Estimated Delivery</span>
                <Badge variant="danger">Cancelled</Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-rose-600">-</span>
                <span className="text-sm font-medium text-rose-800">order cancelled</span>
              </div>
              <p className="text-xs text-rose-700">
                This order has been cancelled. No delivery is scheduled.
              </p>
            </div>
          ) : trackingData?.status === 'Delivered' ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Estimated Delivery</span>
                <Badge variant="success">Delivered</Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-600">0</span>
                <span className="text-sm font-medium text-emerald-800">minutes remaining</span>
              </div>
              <p className="text-xs text-emerald-700">
                Your order has been successfully delivered! Thank you for ordering.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-orange-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-orange-800">Estimated Delivery</span>
                <Badge variant="warning">{trackingData?.status || 'On The Way'}</Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-orange-600">{simulatedEta}</span>
                <span className="text-sm font-medium text-orange-800">minutes remaining</span>
              </div>
              <p className="text-xs text-orange-700">
                Rider is currently on route to your location. Please keep your phone reachable.
              </p>
            </div>
          )}

          {/* Delivery Rider Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Assigned Delivery Rider</span>
            {trackingData?.rider ? (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Bike className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{trackingData.rider.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" /> {trackingData.rider.phone}
                    </p>
                  </div>
                </div>
                <a
                  href={`tel:${trackingData.rider.phone}`}
                  className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  Call Rider
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2">Assigning nearest rider in your area...</p>
            )}
          </div>

          {/* Kitchen Info */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Preparing Cloud Kitchen</span>
            <div className="flex items-center gap-2 pt-1 text-sm text-slate-800 font-medium">
              <Store className="h-4 w-4 text-orange-500 shrink-0" />
              <span>{trackingData?.kitchen?.name} ({trackingData?.kitchen?.location})</span>
            </div>
          </div>

          {/* Order Item Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Order Items</span>
            <div className="flex items-center justify-between text-sm pt-1">
              <span className="text-slate-800 font-medium">{trackingData?.itemName}</span>
              <span className="font-semibold text-slate-900">৳{trackingData?.value?.toFixed(2)}</span>
            </div>
            <div className="text-xs text-slate-500 flex items-start gap-1 pt-1 border-t border-slate-100 mt-2">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>Deliver to: <strong>{trackingData?.customer?.address}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default OrderTracking;
