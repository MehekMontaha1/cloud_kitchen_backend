import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Input, Textarea, Select } from '../common';

const urgency = [
  { value: 'standard', label: 'Standard (2 days)' },
  { value: 'express', label: 'Express (1 day)' },
  { value: 'asap', label: 'ASAP (1-5 hours)' },
];

const statusLabelMap = {
  Pending: 'Request sent',
  Preparing: 'Accepted by kitchen',
  Ready: 'Ready for delivery',
  Accepted: 'Rider Accepted',
  'Picked Up': 'Picked Up',
  Delivered: 'Delivered',
  Cancelled: 'Rejected',
};

const CustomOrders = ({ foods = [], customerLocation = null, onSubmit, customerOrders = [], onTrackOrder }) => {
  const hasDeliveryLocation = Boolean(customerLocation?.lat && customerLocation?.lng);

  // Extract unique kitchens from nearby foods to direct the custom order request
  const kitchens = useMemo(() => {
    const map = {};
    foods.forEach((food) => {
      const sId = food.sellerId;
      if (sId && !map[sId]) {
        map[sId] = {
          value: sId,
          label: food.seller,
        };
      }
    });
    return Object.values(map);
  }, [foods]);

  const [form, setForm] = useState({
    sellerId: '',
    name: '',
    description: '',
    location: '',
    note: '',
    urgency: 'standard',
    budget: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (customerLocation?.address && !form.location) {
      setForm((prev) => ({ ...prev, location: customerLocation.address }));
    }
  }, [customerLocation?.address, form.location]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
    setSubmitError(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.sellerId) newErrors.sellerId = 'Please select a kitchen';
    if (!form.name.trim()) newErrors.name = 'Food name is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!hasDeliveryLocation) {
      newErrors.location = 'Please select your delivery location on the map first';
    } else if (!form.location.trim()) {
      newErrors.location = 'Delivery location is required';
    }
    if (!form.budget.trim() || isNaN(Number(form.budget)) || Number(form.budget) <= 0) {
      newErrors.budget = 'Please enter a valid budget';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: form.sellerId,
          item_name: form.name,
          value: Number(form.budget),
          delivery_address: form.location || customerLocation.address,
          delivery_latitude: customerLocation.lat,
          delivery_longitude: customerLocation.lng,
          type: 'Custom',
          items: [{
            name: form.name,
            description: form.description,
            note: form.note,
            urgency: form.urgency,
            budget: Number(form.budget),
          }],
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setShowSuccess(true);
        if (onSubmit) onSubmit(result.data);

        setTimeout(() => {
          setShowSuccess(false);
          setForm({
            sellerId: '',
            name: '',
            description: '',
            location: '',
            note: '',
            urgency: 'standard',
            budget: '',
          });
        }, 2000);
      } else {
        const errData = await res.json();
        setSubmitError(errData.error || 'Failed to place custom order request');
      }
    } catch (err) {
      setSubmitError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <div className="mb-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Custom Orders</h2>
          <p className="mt-1 text-sm text-slate-500">
            Request a custom dish from nearby kitchens and track the request from accepted to ready for delivery.
          </p>
        </div>

        {customerOrders.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Your custom order updates</h3>
                <p className="text-xs text-slate-500">Accepted requests move from kitchen prep to delivery-ready automatically.</p>
              </div>
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
                {customerOrders.length} request{customerOrders.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {customerOrders.map((order) => {
                const linkedOrderId = order.details?.related_order_id || order.details?.linked_order_id || null;
                const friendlyStatus = statusLabelMap[order.status] || order.status;
                return (
                  <div key={order.id} className={`rounded-2xl border p-4 ${order.status === 'Cancelled'
                      ? 'border-rose-200 bg-rose-50/40'
                      : order.status === 'Ready'
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : order.status === 'Preparing'
                          ? 'border-indigo-200 bg-indigo-50/40'
                          : 'border-amber-200 bg-amber-50/40'
                    }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{order.item_name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{order.details?.description || order.description}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${order.status === 'Cancelled'
                          ? 'bg-rose-100 text-rose-700'
                          : order.status === 'Ready'
                            ? 'bg-emerald-100 text-emerald-700'
                            : order.status === 'Preparing'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}>
                        {friendlyStatus}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-500">
                      <span className="rounded-full bg-white px-2 py-1 border border-slate-200">Budget ৳{Number(order.budget || 0).toFixed(2)}</span>
                      <span className="rounded-full bg-white px-2 py-1 border border-slate-200">{order.urgency || order.details?.urgency || 'standard'}</span>
                      {linkedOrderId && (
                        <span className="rounded-full bg-white px-2 py-1 border border-slate-200">Delivery linked</span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-slate-500">
                        {order.status === 'Ready'
                          ? 'A rider can accept this now.'
                          : order.status === 'Accepted'
                          ? 'Rider is on the way to pick up your order.'
                          : order.status === 'Picked Up'
                          ? 'Rider is on the way to you!'
                          : order.status === 'Delivered'
                          ? 'Enjoy your food!'
                          : 'We will update you as the kitchen progresses.'}
                      </p>
                      {linkedOrderId && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onTrackOrder && onTrackOrder(linkedOrderId)}
                        >
                          Track delivery
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {submitError && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 font-medium mb-4">
          ❌ {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Select
            label="Select Target Kitchen"
            options={[{ value: '', label: 'Choose a Kitchen...' }, ...kitchens]}
            value={form.sellerId}
            onChange={handleChange('sellerId')}
            error={errors.sellerId}
          />
          <Input
            label="Food Name"
            placeholder="What would you like to eat?"
            value={form.name}
            onChange={handleChange('name')}
            error={errors.name}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Input
            label="Budget (৳)"
            placeholder="৳0.00"
            value={form.budget}
            onChange={handleChange('budget')}
            error={errors.budget}
          />
          <Select
            label="Delivery Urgency"
            options={urgency}
            value={form.urgency}
            onChange={handleChange('urgency')}
          />
        </div>

        <Textarea
          label="Description"
          placeholder="Describe the dish, ingredients, style, or any specific requirements..."
          rows={3}
          value={form.description}
          onChange={handleChange('description')}
          error={errors.description}
        />

        <Input
          label="Delivery Location"
          placeholder="Enter your full address"
          value={form.location}
          onChange={handleChange('location')}
          error={errors.location}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />

        <Textarea
          label="Special Instructions (optional)"
          placeholder="Any dietary restrictions, delivery preferences, or special requests..."
          rows={2}
          value={form.note}
          onChange={handleChange('note')}
        />

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-sm text-slate-500">
            <svg className="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Custom orders require seller review and approval.
          </div>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={showSuccess}
          >
            {showSuccess ? (
              <>
                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Request Sent!
              </>
            ) : (
              'Send Request'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default CustomOrders;
