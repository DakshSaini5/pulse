import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCityNameFromCoords } from '@core/utils/geolocation';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

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

// Default coordinates: Central Delhi
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

  const [showDisclosure, setShowDisclosure] = useState(false);
  const [pendingGpsResolve, setPendingGpsResolve] = useState<{ resolve: (val: boolean) => void } | null>(null);

  const executeActualGPSRequest = async (): Promise<boolean> => {
    try {
      let lat: number;
      let lng: number;

      if (Capacitor.isNativePlatform()) {
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } else {
        if (!navigator.geolocation) {
          return false;
        }
        const position = await Promise.race([
          new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            });
          }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Location request timed out')), 5000)
          )
        ]);
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      }

      let resolvedLabel = 'GPS Location';
      try {
        const city = await getCityNameFromCoords(lat, lng);
        if (city && city !== 'Unknown Location') {
          resolvedLabel = city;
        }
      } catch (err) {
        console.warn('Reverse geocoding failed:', err);
      }

      localStorage.setItem('pulse_latitude', lat.toString());
      localStorage.setItem('pulse_longitude', lng.toString());
      localStorage.setItem('pulse_location_source', 'gps');
      localStorage.setItem('pulse_location_label', resolvedLabel);
      localStorage.setItem('pulse_city_name', resolvedLabel);

      setState({
        latitude: lat,
        longitude: lng,
        source: 'gps',
        label: resolvedLabel,
        locationStatus: 'granted',
      });

      return true;
    } catch (error: any) {
      console.warn('GPS query failed:', error.message);
      return false;
    }
  };

  const triggerGPSQuery = async () => {
    const accepted = localStorage.getItem('pulse_location_disclosure_accepted') === 'true';
    if (Capacitor.isNativePlatform() && !accepted) {
      setState(prev => ({
        ...prev,
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LNG,
        source: 'default',
        label: DEFAULT_LABEL,
        locationStatus: 'denied',
      }));
      return;
    }
    await executeActualGPSRequest();
  };

  // Load from localStorage or request GPS on mount
  useEffect(() => {
    const savedLat = localStorage.getItem('pulse_latitude');
    const savedLng = localStorage.getItem('pulse_longitude');
    const savedSource = localStorage.getItem('pulse_location_source');
    const savedLabel = localStorage.getItem('pulse_location_label') || localStorage.getItem('pulse_city_name');

    if (savedLat && savedLng && savedSource && savedLabel) {
      setState({
        latitude: parseFloat(savedLat),
        longitude: parseFloat(savedLng),
        source: savedSource as any,
        label: savedLabel,
        locationStatus: (savedSource === 'gps' || savedSource === 'manual') ? 'granted' : 'denied',
      });

      if (savedLabel === 'GPS Location' || savedLabel === 'Unknown Location') {
        const latitude = parseFloat(savedLat);
        const longitude = parseFloat(savedLng);
        getCityNameFromCoords(latitude, longitude).then((city) => {
          if (city && city !== 'Unknown Location') {
            localStorage.setItem('pulse_location_label', city);
            localStorage.setItem('pulse_city_name', city);
            setState((prev) => ({ ...prev, label: city }));
          }
        }).catch((err) => {
          console.warn('Background reverse geocoding on mount failed:', err);
        });
      }

      // Refresh live GPS dynamically in the background if the user previously used GPS
      if (savedSource === 'gps') {
        triggerGPSQuery();
      }
    } else {
      triggerGPSQuery();
    }
  }, []);

  const setManualLocation = (lat: number, lng: number, label: string) => {
    localStorage.setItem('pulse_latitude', lat.toString());
    localStorage.setItem('pulse_longitude', lng.toString());
    localStorage.setItem('pulse_location_source', 'manual');
    localStorage.setItem('pulse_location_label', label);
    localStorage.setItem('pulse_city_name', label);

    setState({
      latitude: lat,
      longitude: lng,
      source: 'manual',
      label,
      locationStatus: 'granted',
    });
  };

  const requestGPSLocation = (): Promise<boolean> => {
    return new Promise<boolean>(async (resolve) => {
      const accepted = localStorage.getItem('pulse_location_disclosure_accepted') === 'true';
      if (Capacitor.isNativePlatform() && !accepted) {
        setPendingGpsResolve({ resolve });
        setShowDisclosure(true);
      } else {
        const success = await executeActualGPSRequest();
        resolve(success);
      }
    });
  };

  const clearManualLocation = () => {
    localStorage.removeItem('pulse_latitude');
    localStorage.removeItem('pulse_longitude');
    localStorage.removeItem('pulse_location_source');
    localStorage.removeItem('pulse_location_label');
    localStorage.removeItem('pulse_city_name');

    triggerGPSQuery();
  };

  const handleAcceptDisclosure = async () => {
    localStorage.setItem('pulse_location_disclosure_accepted', 'true');
    setShowDisclosure(false);
    const success = await executeActualGPSRequest();
    if (pendingGpsResolve) {
      pendingGpsResolve.resolve(success);
      setPendingGpsResolve(null);
    }
  };

  const handleDeclineDisclosure = () => {
    setShowDisclosure(false);
    if (pendingGpsResolve) {
      pendingGpsResolve.resolve(false);
      setPendingGpsResolve(null);
    }
    toast.error('Location permission is required for auto-detection. Please enter your location manually.');
  };

  return (
    <LocationContext.Provider value={{ ...state, setManualLocation, requestGPSLocation, clearManualLocation }}>
      {children}
      {showDisclosure && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Location Disclosure</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Play Store Compliance Info</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Pulse collects location data to measure distance to nearby hospitals and enable the emergency panic feature, even when the app is in the background or not in use.
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                This coordinates data is sent to our servers to query nearest hospitals within your specified radius, but it is not stored or shared with any third party.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleDeclineDisclosure}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleAcceptDisclosure}
                className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 transition-all active:scale-95"
              >
                Accept & Share
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
