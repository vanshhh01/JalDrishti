import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Search, Check, Loader2, Compass, ArrowRight, Navigation } from 'lucide-react';
import L from 'leaflet';

export default function LocationPickerModal({
  isOpen,
  onClose,
  initialLat = 28.6475,
  initialLng = 77.3150,
  initialAddress = '',
  onSelectLocation
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [address, setAddress] = useState(initialAddress || 'New Delhi, Delhi, India');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Sync with initial props whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setLat(initialLat);
      setLng(initialLng);
      if (initialAddress) setAddress(initialAddress);
    }
  }, [isOpen, initialLat, initialLng, initialAddress]);

  // Live Reverse Geocoding helper
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          const parts = data.display_name.split(',').map((p) => p.trim());
          const cleanAddr = parts.slice(0, 4).join(', ');
          setAddress(cleanAddr);
          return cleanAddr;
        }
      }
    } catch (e) {
      console.warn('Reverse geocode notice:', e);
    }
    const fallback = `Coordinates (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`;
    setAddress(fallback);
    return fallback;
  };

  // Initialize and update map
  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setSuggestions([]);
      return;
    }

    const initTimer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [lat, lng],
          zoom: 14,
          zoomControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const customDotIcon = L.divIcon({
          className: 'custom-dot',
          html: `
            <div style="
              width: 24px;
              height: 24px;
              background-color: #0284c7;
              border: 3.5px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 0 16px rgba(2, 132, 199, 0.9), 0 2px 6px rgba(0,0,0,0.3);
            "></div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([lat, lng], {
          icon: customDotIcon,
          draggable: true
        }).addTo(map);

        marker.on('dragend', async (e) => {
          const pos = e.target.getLatLng();
          setLat(pos.lat);
          setLng(pos.lng);
          setAddress(`Fetching address (${pos.lat.toFixed(4)}°N, ${pos.lng.toFixed(4)}°E)...`);
          await reverseGeocode(pos.lat, pos.lng);
        });

        map.on('click', async (e) => {
          marker.setLatLng(e.latlng);
          setLat(e.latlng.lat);
          setLng(e.latlng.lng);
          setAddress(`Fetching address (${e.latlng.lat.toFixed(4)}°N, ${e.latlng.lng.toFixed(4)}°E)...`);
          await reverseGeocode(e.latlng.lat, e.latlng.lng);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;

        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 250);
      }
    }, 150);

    return () => {
      clearTimeout(initTimer);
    };
  }, [isOpen]);

  // Real-Time Live Geocoding Search Suggestions
  useEffect(() => {
    const q = searchQuery.trim();

    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=6`
        );
        if (res.ok) {
          const data = await res.json();
          const liveMatches = (data || []).map((item) => {
            const parts = item.display_name.split(',');
            return {
              title: parts[0] || item.name,
              subtitle: parts.slice(1, 4).join(', ').trim() || 'India',
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            };
          });

          setSuggestions(liveMatches);
        }
      } catch (e) {
        console.warn('Live geocoding error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // GPS Locate Button inside Modal
  const handleDetectGPSInModal = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setLat(userLat);
        setLng(userLng);
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([userLat, userLng], 16, { duration: 1.2 });
          markerRef.current.setLatLng([userLat, userLng]);
        }
        await reverseGeocode(userLat, userLng);
        setIsLocating(false);
      },
      (err) => {
        console.warn('GPS error:', err);
        setIsLocating(false);
        alert('Could not access current GPS location. Please drop a pin or search on the map.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSelectSuggestion = (item) => {
    setLat(item.lat);
    setLng(item.lng);
    const fullAddr = `${item.title}, ${item.subtitle}`;
    setAddress(fullAddr);
    setSearchQuery(item.title);
    setSuggestions([]);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([item.lat, item.lng], 15, { duration: 1.2 });
      markerRef.current.setLatLng([item.lat, item.lng]);
    }
  };

  const handleConfirm = () => {
    onSelectLocation({
      latitude: lat,
      longitude: lng,
      address: address || `Coordinates: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`
    });
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pin Incident Location on Map</h3>
              <p className="text-xs text-slate-500">Search place name, use GPS, or click anywhere on the map</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & GPS Toolbar */}
        <div className="p-4 bg-white border-b border-slate-100 space-y-2.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search area (e.g. Rohini, Indirapuram, Sector 62 Noida, CP)..."
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600 focus:bg-white transition shadow-inner"
              />
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-cyan-600 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleDetectGPSInModal}
              disabled={isLocating}
              className="px-3.5 py-2.5 rounded-2xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              title="Use current GPS"
            >
              <Navigation className={`w-3.5 h-3.5 text-cyan-600 ${isLocating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'My GPS'}</span>
            </button>
          </div>

          {/* Live OpenStreetMap Autocomplete Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-white rounded-2xl border border-cyan-200 shadow-md divide-y divide-slate-100 overflow-hidden max-h-56 overflow-y-auto">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-cyan-50/80 transition flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-xl bg-cyan-100/80 text-cyan-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-cyan-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-cyan-600 opacity-0 group-hover:opacity-100 transition shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="w-full h-[320px] min-h-[320px] relative bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full" style={{ height: '320px' }} />
          
          <div className="absolute top-3 right-3 z-[400] px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-600 animate-spin" />
            <span>Click or drag pin to pinpoint location</span>
          </div>
        </div>

        {/* Footer info & CTA */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600 min-w-0 flex-1">
            <p className="font-bold text-slate-900 truncate">{address}</p>
            <p className="text-[11px] text-slate-500 font-mono">
              Coordinates: {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Location</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
