import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../common';

const GeolocationValidation = ({ withinRadius, onToggleRadius }) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const simulateLocation = () => {
      setTimeout(() => {
        setLocation({
          latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
          longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
          address: '123 Market Street, San Francisco, CA',
          zone: withinRadius ? 'Downtown' : 'Outer District',
        });
        setLoading(false);
      }, 1000);
    };

    simulateLocation();
  }, [withinRadius]);

  if (loading) {
    return (
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Geolocation Validation</h2>
          <p className="mt-1 text-sm text-slate-500">Verifying your location for delivery radius...</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Geolocation Validation</h2>
        <p className="mt-1 text-sm text-slate-500">
          Location-based filtering ensures realistic delivery times.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-slate-900">Your Location</h3>
              <Badge variant={withinRadius ? 'success' : 'warning'} size="md" dot>
                {withinRadius ? 'Within Radius' : 'Outside Radius'}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {location?.address}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Zone: {location?.zone}
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-4 ${withinRadius ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-start gap-3">
              <div className={`rounded-full p-2 ${withinRadius ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                {withinRadius ? (
                  <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div>
                <h4 className={`font-medium ${withinRadius ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {withinRadius ? 'Delivery Available' : 'Limited Availability'}
                </h4>
                <p className={`mt-1 text-sm ${withinRadius ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {withinRadius
                    ? 'Great news! You are within our active 30-minute delivery radius. All nearby restaurants are available.'
                    : 'Some items may not be available or may have longer delivery times due to your location.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative rounded-xl overflow-hidden bg-slate-100 h-64">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <div className={`absolute inset-0 ${withinRadius ? 'bg-emerald-200' : 'bg-amber-200'} rounded-full blur-xl opacity-50 animate-pulse`} />
                <div className={`relative mx-auto w-4 h-4 rounded-full ${withinRadius ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <div className={`mt-2 h-32 w-32 rounded-full border-2 ${withinRadius ? 'border-emerald-400' : 'border-amber-400'} border-dashed`} />
              <p className="mt-4 text-sm text-slate-500">30-min radius</p>
            </div>
          </div>
          <div className="absolute bottom-3 right-3">
            <Button variant="secondary" size="sm" onClick={onToggleRadius}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Test Radius
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GeolocationValidation;
