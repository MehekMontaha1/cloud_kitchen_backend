import { useState, useMemo } from 'react';
import { Card, Button, Input, Textarea, Select } from '../common';

const cuisines = [
  { value: 'any', label: 'Any Cuisine' },
  { value: 'asian', label: 'Asian' },
  { value: 'italian', label: 'Italian' },
  { value: 'american', label: 'American' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'indian', label: 'Indian' },
  { value: 'mediterranean', label: 'Mediterranean' },
];

const urgency = [
  { value: 'standard', label: 'Standard (2-4 hours)' },
  { value: 'express', label: 'Express (1-2 hours)' },
  { value: 'asap', label: 'ASAP' },
];

const CustomOrders = ({ foods = [], onSubmit }) => {
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
    cuisine: 'any',
    urgency: 'standard',
    budget: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

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
    if (!form.location.trim()) newErrors.location = 'Delivery location is required';
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
          delivery_address: form.location,
          type: 'Custom',
          items: [{
            name: form.name,
            description: form.description,
            note: form.note,
            cuisine: form.cuisine,
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
            cuisine: 'any',
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
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Custom Orders</h2>
        <p className="mt-1 text-sm text-slate-500">
          Request custom/special menu items from nearby kitchens not listed on the platform.
        </p>
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

        <div className="grid gap-6 md:grid-cols-3">
          <Input
            label="Budget (৳)"
            placeholder="৳0.00"
            value={form.budget}
            onChange={handleChange('budget')}
            error={errors.budget}
          />
          <Select
            label="Preferred Cuisine"
            options={cuisines}
            value={form.cuisine}
            onChange={handleChange('cuisine')}
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
