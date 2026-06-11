import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Navigation, X, Locate } from 'lucide-react';
import { useUserLocation } from '../context/LocationContext';
import { geocodingAPI } from '../services/api';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const LocationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { setManualLocation, requestGPSLocation, source } = useUserLocation();
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city) {
      toast.error('City is required to resolve your location.');
      return;
    }

    setLoading(true);
    try {
      const result = await geocodingAPI.geocode({ street, city, state, pincode });
      
      // Construct a clean, standardized label containing the city so phone formatters and UI scopes work properly
      const cleanCity = result.city || city;
      const cleanState = result.state || state;
      const cleanLabel = `${cleanCity}${cleanState ? `, ${cleanState}` : ''}`;
      
      setManualLocation(result.latitude, result.longitude, cleanLabel);
      toast.success(`Location set to ${cleanLabel}`);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not find the specified location. Please check your spelling.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseGPS = async () => {
    setGpsLoading(true);
    try {
      const success = await requestGPSLocation();
      if (success) {
        toast.success('Location updated from device GPS!');
        onClose();
      } else {
        toast.error('GPS access failed or was denied. Please input your location manually.');
      }
    } catch (err) {
      toast.error('Failed to get GPS location.');
    } finally {
      setGpsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#111827] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-800">
        
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 flex items-start justify-between border-b border-blue-100 dark:border-blue-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Set Search Location</h2>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Specify your current coverage zone</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <button
            type="button"
            onClick={handleUseGPS}
            disabled={gpsLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all active:scale-[0.98]"
          >
            <Locate className="w-5 h-5 animate-pulse" />
            {gpsLoading ? 'Detecting Location...' : 'Use Live GPS Location'}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Or Enter Address Manually</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Area / Street Address (Optional)
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Area / Street Address"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-500/20 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-500/20 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="State"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-500/20 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pincode / ZIP Code
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Pincode / ZIP Code"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-500/20 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? 'Locating...' : 'Set Location'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LocationModal;
