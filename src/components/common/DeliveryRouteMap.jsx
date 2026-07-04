import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Store, User, MapPin } from 'lucide-react';

// Custom icons for Kitchen and Customer
const kitchenIcon = L.divIcon({
  className: 'custom-kitchen-marker',
  html: `<div style="background-color: #f97316; width: 32px; height: 32px; borderRadius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 2px solid white;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M18 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M14 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M10 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M6 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const customerIcon = L.divIcon({
  className: 'custom-customer-marker',
  html: `<div style="background-color: #3b82f6; width: 32px; height: 32px; borderRadius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 2px solid white;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function FitBounds({ pickup, dropoff }) {
  const map = useMap();
  useEffect(() => {
    if (pickup && dropoff) {
      const bounds = L.latLngBounds(
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng]
      );
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [pickup, dropoff, map]);
  return null;
}

const DeliveryRouteMap = ({
  pickup = { lat: 23.8103, lng: 90.4125, name: 'Cloud Kitchen (Dhaka)' },
  dropoff = { lat: 23.7925, lng: 90.4078, name: 'Customer Home (Banani)' },
  height = '300px',
}) => {
  const polylinePositions = [
    [pickup.lat, pickup.lng],
    [dropoff.lat, dropoff.lng],
  ];

  // Calculate approximate straight-line distance in km
  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const distance = getDistanceKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl border border-slate-200 overflow-hidden shadow-sm" style={{ height }}>
        <MapContainer
          center={[(pickup.lat + dropoff.lat) / 2, (pickup.lng + dropoff.lng) / 2]}
          zoom={13}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
        >
          <FitBounds pickup={pickup} dropoff={dropoff} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[pickup.lat, pickup.lng]} icon={kitchenIcon}>
            <Popup>
              <div className="font-sans text-xs">
                <strong className="text-orange-600">Pickup:</strong> {pickup.name}
              </div>
            </Popup>
          </Marker>
          <Marker position={[dropoff.lat, dropoff.lng]} icon={customerIcon}>
            <Popup>
              <div className="font-sans text-xs">
                <strong className="text-blue-600">Dropoff:</strong> {dropoff.name}
              </div>
            </Popup>
          </Marker>
          <Polyline
            positions={polylinePositions}
            pathOptions={{ color: '#f97316', weight: 4, dashArray: '8, 8', opacity: 0.8 }}
          />
        </MapContainer>

        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800 shadow-md flex items-center gap-2">
          <MapPin className="h-4 w-4 text-orange-500" />
          <span>Approx. Distance: <strong>{distance} km</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 flex items-center gap-2">
          <Store className="h-4 w-4 shrink-0 text-orange-600" />
          <span className="truncate"><strong>Pickup:</strong> {pickup.name}</span>
        </div>
        <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-2">
          <User className="h-4 w-4 shrink-0 text-blue-600" />
          <span className="truncate"><strong>Dropoff:</strong> {dropoff.name}</span>
        </div>
      </div>
    </div>
  );
};

export default DeliveryRouteMap;
