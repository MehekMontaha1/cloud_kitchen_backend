import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, LocateFixed, Search, Check, Save } from 'lucide-react';
import { Button } from './';

// Fix Leaflet default marker icon path issue in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom component to update map center dynamically
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

// Map events handler component
function MapEvents({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const MapPicker = ({
  initialLat = 23.8103, // Default: Dhaka, Bangladesh
  initialLng = 90.4125,
  radiusMeters = null, // e.g. 7000 for 7km radius
  circleColor = '#10b981', // Default: Green (#10b981) for Customer, Red (#ef4444) for Seller/Rider
  onLocationChange,
  showSaveButton = true,
  readOnly = false,
  height = '320px',
  zoom = 13,
  skipInitialReverseGeocode = false,
}) => {
  const [position, setPosition] = useState([initialLat, initialLng]);
  const [address, setAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition([initialLat, initialLng]);
      if (skipInitialReverseGeocode) {
        setAddress('');
      } else {
        reverseGeocode(initialLat, initialLng, false);
      }
    }
  }, [initialLat, initialLng, skipInitialReverseGeocode]);


  // Reverse geocoding using free Nominatim API
  const reverseGeocode = async (lat, lng, notifyParent = true) => {
    setLoadingAddress(true);
    let formattedAddress = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CloudKitchenApp/1.0',
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        formattedAddress = data.display_name || formattedAddress;
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setAddress(formattedAddress);
      if (notifyParent && onLocationChange) {
        onLocationChange({ lat, lng, address: formattedAddress });
      }
      setLoadingAddress(false);
    }
  };

  const handleSelectLocation = (lat, lng) => {
    if (readOnly) return;
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
  };

  // Graceful GPS location retrieval with IP fallback
  const handleUseGPS = async () => {
    setIsLocating(true);
    setStatusMessage(null);

    const tryIPGeolocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            setPosition([data.latitude, data.longitude]);
            reverseGeocode(data.latitude, data.longitude);
            setStatusMessage({ type: 'info', text: `Located via IP: ${data.city || 'Bangladesh'}` });
            return true;
          }
        }
      } catch (err) {
        console.warn('IP Geolocation failed:', err);
      }
      return false;
    };

    if (!navigator.geolocation) {
      const success = await tryIPGeolocation();
      if (!success) {
        setStatusMessage({ type: 'warning', text: 'GPS not supported. Set location manually on the map.' });
      }
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        reverseGeocode(latitude, longitude);
        setStatusMessage({ type: 'success', text: 'Location retrieved from device GPS!' });
        setIsLocating(false);
      },
      async (err) => {
        console.warn('Browser GPS error, attempting IP fallback...', err);
        const success = await tryIPGeolocation();
        if (!success) {
          setStatusMessage({
            type: 'warning',
            text: 'Device location unavailable. Search for your area or click the map to select delivery location.',
          });
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  };

  // Save location to user profile
  const handleSaveToProfile = async () => {
    setSavingLocation(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: address || `Location (${position[0].toFixed(4)}, ${position[1].toFixed(4)})`,
          latitude: position[0],
          longitude: position[1],
        }),
      });

      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Location successfully saved to your profile!' });
      } else {
        const data = await res.json();
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save location.' });
      }
    } catch (err) {
      console.error('Save location error:', err);
      setStatusMessage({ type: 'error', text: 'Network error saving location.' });
    } finally {
      setSavingLocation(false);
    }
  };

  // Address search query handler
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoadingAddress(true);
    setStatusMessage(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: { 'User-Agent': 'CloudKitchenApp/1.0' },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setPosition([lat, lng]);
          setAddress(data[0].display_name);
          if (onLocationChange) {
            onLocationChange({ lat, lng, address: data[0].display_name });
          }
        } else {
          setStatusMessage({ type: 'warning', text: 'Location not found. Try a broader search term.' });
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoadingAddress(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`rounded-lg px-3 py-2 text-xs flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : statusMessage.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Search and GPS Control Bar */}
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search location in Bangladesh (e.g. Dhanmondi, Dhaka)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pl-9 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
            <Button type="submit" variant="secondary" size="sm" disabled={loadingAddress}>
              Search
            </Button>
          </form>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseGPS}
            disabled={isLocating}
            icon={<LocateFixed className={`h-4 w-4 ${isLocating ? 'animate-spin' : 'text-orange-500'}`} />}
          >
            {isLocating ? 'Locating...' : 'Use My GPS'}
          </Button>
        </div>
      )}

      {/* Map Container */}
      <div
        className="relative rounded-xl border border-slate-200 overflow-hidden shadow-sm"
        style={{ height }}
      >
        <MapContainer
          center={position}
          zoom={zoom}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
        >
          <ChangeView center={position} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} />
          {radiusMeters && (
            <Circle
              center={position}
              radius={radiusMeters}
              pathOptions={{
                color: circleColor,
                fillColor: circleColor,
                fillOpacity: 0.15,
                dashArray: '6, 6',
              }}
            />
          )}
          {!readOnly && <MapEvents onLocationSelect={handleSelectLocation} />}
        </MapContainer>

        {!readOnly && (
          <div className="absolute top-2 right-2 z-[400] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 shadow-md flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-orange-500" /> Click map to pick point
          </div>
        )}
      </div>

      {/* Selected Address Display & Save Button */}
      {address && (
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3 border border-slate-200">
          <div className="flex items-start gap-2 flex-1 min-w-[200px]">
            <MapPin className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Selected Location:</p>
              <p className="mt-0.5">{loadingAddress ? 'Fetching address...' : address}</p>
              <p className="mt-1 font-mono text-[10px] text-slate-400">
                Coordinates: {position[0].toFixed(5)}, {position[1].toFixed(5)}
              </p>
            </div>
          </div>

          {showSaveButton && !readOnly && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleSaveToProfile}
              disabled={savingLocation}
              icon={savingLocation ? <Check className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            >
              {savingLocation ? 'Saving...' : 'Save Location'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default MapPicker;
