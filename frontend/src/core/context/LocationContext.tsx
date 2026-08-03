import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCityNameFromCoords } from '@core/utils/geolocation';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { MapPin } from 'lucide-react';

export interface LocationState {
  latitude: number;
  longitude: number;
  source: 'gps' | 'manual' | 'default';
  label: string;
  locationStatus: 'checking' | 'granted' | 'denied';
}

interface LocationContextType extends LocationState {
  setManualLocation: (lat: number, lng: number, label: string) => void;
  requestGPSLocation: () => Promise<boolean>;
  clearManualLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const DEFAULT_LAT = 28.6139;
const DEFAULT_LNG = 77.2090;
const DEFAULT_LABEL = 'Delhi Area, Delhi';

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LocationState>({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    source: 'default',
    label: DEFAULT_LABEL,
    locationStatus: 'checking',
  });

  // Controls the in-app disclosure popup
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [pendingResolve, setPendingResolve] = useState<((val: boolean) => void) | null>(null);

  // ─────────────────────────────────────────────────────────
  // Core GPS fetch — called ONLY after user accepts disclosure
  // ─────────────────────────────────────────────────────────
  const fetchGPS = async (): Promise<boolean> => {
    try {
      let lat: number;
      let lng: number;

      if (Capacitor.isNativePlatform()) {
        // Show Android OS "Allow location?" system dialog
        const perm = await Geolocation.requestPermissions({ permissions: ['location'] });
        const granted =
          perm.location === 'granted' ||
          (perm as any).coarseLocation === 'granted';

        if (!granted) {
          setState(prev => ({ ...prev, locationStatus: 'denied' }));
          return false;
        }

        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } else {
        // Web browser
        if (!navigator.geolocation) return false;
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }

      // Reverse geocode to city name
      let label = 'GPS Location';
      try {
        const city = await getCityNameFromCoords(lat, lng);
        if (city && city !== 'Unknown Location') label = city;
      } catch { /* non-critical */ }

      localStorage.setItem('pulse_latitude', lat.toString());
      localStorage.setItem('pulse_longitude', lng.toString());
      localStorage.setItem('pulse_location_source', 'gps');
      localStorage.setItem('pulse_location_label', label);
      localStorage.setItem('pulse_city_name', label);
      localStorage.setItem('pulse_location_disclosure_accepted', 'true');

      setState({ latitude: lat, longitude: lng, source: 'gps', label, locationStatus: 'granted' });
      return true;
    } catch (err: any) {
      console.warn('GPS fetch failed:', err?.message);
      setState(prev => ({ ...prev, locationStatus: 'denied' }));
      return false;
    }
  };

  // ─────────────────────────────────────────────────────────
  // Public method called when user taps "Use Live GPS"
  // Shows disclosure first (if not accepted before), then GPS
  // ─────────────────────────────────────────────────────────
  const requestGPSLocation = (): Promise<boolean> => {
    return new Promise<boolean>(resolve => {
      const alreadyAccepted =
        localStorage.getItem('pulse_location_disclosure_accepted') === 'true';

      if (alreadyAccepted) {
        // Already accepted before — go straight to GPS
        fetchGPS().then(resolve);
      } else {
        // Show in-app disclosure popup first
        setPendingResolve(() => resolve);
        setShowDisclosure(true);
      }
    });
  };

  // ─────────────────────────────────────────────────────────
  // Disclosure popup handlers
  // ─────────────────────────────────────────────────────────
  const handleAccept = async () => {
    setShowDisclosure(false);
    localStorage.setItem('pulse_location_disclosure_accepted', 'true');
    const success = await fetchGPS();
    pendingResolve?.(success);
    setPendingResolve(null);
  };

  const handleDecline = () => {
    setShowDisclosure(false);
    pendingResolve?.(false);
    setPendingResolve(null);
    setState(prev => ({ ...prev, locationStatus: 'denied' }));
  };

  // ─────────────────────────────────────────────────────────
  // On mount: restore saved location ONLY — never auto-GPS
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const savedLat   = localStorage.getItem('pulse_latitude');
    const savedLng   = localStorage.getItem('pulse_longitude');
    const savedSrc   = localStorage.getItem('pulse_location_source');
    const savedLabel = localStorage.getItem('pulse_location_label') ||
                       localStorage.getItem('pulse_city_name');

    if (savedLat && savedLng && savedSrc && savedLabel) {
      setState({
        latitude: parseFloat(savedLat),
        longitude: parseFloat(savedLng),
        source: savedSrc as any,
        label: savedLabel,
        locationStatus: savedSrc === 'gps' || savedSrc === 'manual' ? 'granted' : 'denied',
      });

      // Silently resolve stale label in background (no GPS re-request)
      if (savedLabel === 'GPS Location' || savedLabel === 'Unknown Location') {
        getCityNameFromCoords(parseFloat(savedLat), parseFloat(savedLng))
          .then(city => {
            if (city && city !== 'Unknown Location') {
              localStorage.setItem('pulse_location_label', city);
              localStorage.setItem('pulse_city_name', city);
              setState(prev => ({ ...prev, label: city }));
            }
          })
          .catch(() => {});
      }
    } else {
      // No saved location — use default Delhi, wait for user to set one
      setState({
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LNG,
        source: 'default',
        label: DEFAULT_LABEL,
        locationStatus: 'denied',
      });
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // Manual location
  // ─────────────────────────────────────────────────────────
  const setManualLocation = (lat: number, lng: number, label: string) => {
    localStorage.setItem('pulse_latitude', lat.toString());
    localStorage.setItem('pulse_longitude', lng.toString());
    localStorage.setItem('pulse_location_source', 'manual');
    localStorage.setItem('pulse_location_label', label);
    localStorage.setItem('pulse_city_name', label);
    setState({ latitude: lat, longitude: lng, source: 'manual', label, locationStatus: 'granted' });
  };

  const clearManualLocation = () => {
    localStorage.removeItem('pulse_latitude');
    localStorage.removeItem('pulse_longitude');
    localStorage.removeItem('pulse_location_source');
    localStorage.removeItem('pulse_location_label');
    localStorage.removeItem('pulse_city_name');
    setState({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG, source: 'default', label: DEFAULT_LABEL, locationStatus: 'denied' });
  };

  return (
    <LocationContext.Provider value={{ ...state, setManualLocation, requestGPSLocation, clearManualLocation }}>
      {children}

      {/* In-app location disclosure popup — shown before first GPS access */}
      {showDisclosure && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-red-500 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Allow Location Access</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Required to find nearby hospitals</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>Pulse uses your location to find the nearest hospitals, clinics, and emergency services around you.</p>
              <p>Your location is <strong>never stored</strong> on our servers and is <strong>never shared</strong> with third parties.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                Not Now
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-red-500/25 transition-all active:scale-95"
              >
                Allow Location
              </button>
            </div>
          </div>
        </div>
      )}
    </LocationContext.Provider>
  );
};

export const useUserLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useUserLocation must be used within a LocationProvider');
  }
  return context;
};
