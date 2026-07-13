import { useState, useEffect } from 'react';
import { Card, Button, Badge, MapPicker } from '../common';

const DEFAULT_MAP_CENTER = {
  lat: 23.8103,
  lng: 90.4125,
  address: '',
};

const GeolocationValidation = ({ withinRadius, onToggleRadius, onLocationChange, customerLocation }) => {
  const hasCustomerLocation = Boolean(customerLocation?.lat && customerLocation?.lng);
  const [selectedLocation, setSelectedLocation] = useState(customerLocation || DEFAULT_MAP_CENTER);

  useEffect(() => {
    if (customerLocation?.lat && customerLocation?.lng) {
      setSelectedLocation(customerLocation);
    } else {
      setSelectedLocation(DEFAULT_MAP_CENTER);
    }
  }, [customerLocation?.lat, customerLocation?.lng, customerLocation?.address]);

  const handleLocationPick = (loc) => {
    setSelectedLocation(loc);
    if (onLocationChange) {
      onLocationChange(loc);
    }
  };

  return (
    <Card>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Live Customer Location & Delivery Radius</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pick any location in Bangladesh to view nearby restaurants within your 30-minute delivery zone.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onToggleRadius}>
          Toggle Sample Distance ({withinRadius ? 'Within 30-min' : 'Outside 30-min'})
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Real OpenStreetMap View with Save Button */}
        <div className="space-y-3">
          <MapPicker
            initialLat={selectedLocation.lat}
            initialLng={selectedLocation.lng}
            radiusMeters={7000} // 7km ~ 30 minute delivery radius
            circleColor="#10b981" // Green circle for Customer Delivery Zone
            showSaveButton={true}
            onLocationChange={handleLocationPick}
            height="340px"
            skipInitialReverseGeocode={!hasCustomerLocation}
          />
        </div>

        {/* Location Info & Radius Status */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900">Delivery Eligibility</h3>
              <Badge variant={hasCustomerLocation && withinRadius ? 'success' : 'warning'} size="md" dot>
                {!hasCustomerLocation ? 'Select Location' : withinRadius ? '30-Min Serviceable' : 'Extended Zone'}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Selected Address</span>
                <p className="text-slate-800 font-medium mt-0.5">
                  {hasCustomerLocation ? (selectedLocation.address || 'Selected delivery location') : 'No delivery location selected yet'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400">Latitude</span>
                  <p className="font-mono text-slate-700">{hasCustomerLocation ? selectedLocation.lat.toFixed(5) : '-'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Longitude</span>
                  <p className="font-mono text-slate-700">{hasCustomerLocation ? selectedLocation.lng.toFixed(5) : '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`rounded-xl p-4 border ${
              hasCustomerLocation && withinRadius ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`rounded-full p-2 ${hasCustomerLocation && withinRadius ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                {hasCustomerLocation && withinRadius ? (
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
                <h4 className={`font-semibold ${hasCustomerLocation && withinRadius ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {!hasCustomerLocation ? 'Choose a Delivery Location' : withinRadius ? 'Fast 30-Minute Express Delivery' : 'Extended Radius Notice'}
                </h4>
                <p className={`mt-1 text-xs ${hasCustomerLocation && withinRadius ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {!hasCustomerLocation
                    ? 'Kitchens and food items will appear only after you pick a delivery point on the map or use GPS/search.'
                    : withinRadius
                    ? 'Your selected location is inside our active 7km (30-minute) express circle. All cloud kitchens in your area are available for instant ordering.'
                    : 'Your selected location is outside our standard 30-minute delivery ring. Higher delivery fees or longer fulfillment times may apply.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GeolocationValidation;
