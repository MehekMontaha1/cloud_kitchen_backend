import { useState } from 'react';
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

const CustomOrders = ({ onSubmit }) => {
  const [form, setForm] = useState({
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

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Food name is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.location.trim()) newErrors.location = 'Delivery location is required';
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
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onSubmit(form);
    setIsSubmitting(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      setForm({
        name: '',
        description: '',
        location: '',
        note: '',
        cuisine: 'any',
        urgency: 'standard',
        budget: '',
      });
    }, 2000);
  };

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Custom Orders</h2>
        <p className="mt-1 text-sm text-slate-500">
          Request food from distant sellers or special menu items not listed on the platform.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Input
            label="Food Name"
            placeholder="What would you like to eat?"
            value={form.name}
            onChange={handleChange('name')}
            error={errors.name}
          />
          <Input
            label="Budget (optional)"
            placeholder="$0.00"
            value={form.budget}
            onChange={handleChange('budget')}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
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
          rows={4}
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
            Custom orders may take longer and have delivery surcharges.
          </div>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={showSuccess}
          >
            {showSuccess ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
