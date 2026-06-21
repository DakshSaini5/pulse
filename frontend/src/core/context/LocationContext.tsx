import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCityNameFromCoords } from '@core/utils/geolocation';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

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

  const triggerGPSQuery = async () => {
    try {
      let lat: number;
      let lng: number;

      if (Capacitor.isNativePlatform()) {
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } else {
        if (!navigator.geolocation) {
          throw new Error('Geolocation not supported');
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
    } catch (error: any) {
      console.warn('GPS query failed or denied:', error.message);
      
      // BUG-FIX: If the user already has a valid cached location, do not wipe it out if the background refresh fails!
      const existingSource = localStorage.getItem('pulse_location_source');
      if (existingSource === 'gps' || existingSource === 'manual') {
        return;
      }

      localStorage.setItem('pulse_latitude', DEFAULT_LAT.toString());
      localStorage.setItem('pulse_longitude', DEFAULT_LNG.toString());
      localStorage.setItem('pulse_location_source', 'default');
      localStorage.setItem('pulse_location_label', DEFAULT_LABEL);
      localStorage.setItem('pulse_city_name', DEFAULT_LABEL);

      setState({
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LNG,
        source: 'default',
        label: DEFAULT_LABEL,
        locationStatus: 'denied',
      });
    }
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

  const requestGPSLocation = async (): Promise<boolean> => {
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

  const clearManualLocation = () => {
    localStorage.removeItem('pulse_latitude');
    localStorage.removeItem('pulse_longitude');
    localStorage.removeItem('pulse_location_source');
    localStorage.removeItem('pulse_location_label');
    localStorage.removeItem('pulse_city_name');

    triggerGPSQuery();
  };

  return (
    <LocationContext.Provider value={{ ...state, setManualLocation, requestGPSLocation, clearManualLocation }}>
      {children}
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
