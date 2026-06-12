import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { hospitalAPI, Hospital } from '@core/services/api';
import { getInitialLocation } from '@core/utils/geolocation';
import { 
  ArrowLeft, Star, Clock, AlertCircle, ShieldCheck, 
  MapPin, HelpCircle, Phone, Globe, Layers 
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';

import { useNavigate } from 'react-router-dom';

export const Comparison: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);

  const fetchHospitals = async () => {
    const idsStr = searchParams.get('ids');
    if (!idsStr) {
      setLoading(false);
      return;
    }
    const ids = idsStr.split(',');
    setLoading(true);
    try {
      const data = await hospitalAPI.compare(ids, lat, lng);
      setHospitals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get browser coordinates on mount
  useEffect(() => {
    const loadLocation = () => {
      getInitialLocation()
        .then((res) => {
          setLat(res.latitude);
          setLng(res.longitude);
        })
        .catch(err => {
          console.warn('Geolocation failed:', err);
        });
    };

    loadLocation();

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((status) => {
          status.onchange = () => {
            if (status.state === 'granted') {
              loadLocation();
            }
          };
        })
        .catch(err => console.log('Permissions API query not supported:', err));
    }
  }, []);

  // Fetch comparison data when parameters or coordinates change
  useEffect(() => {
    fetchHospitals();
  }, [searchParams, lat, lng]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-12 animate-pulse text-left">
        <div className="h-8 bg-slate-800 rounded w-1/4" />
        <div className="h-96 bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  if (hospitals.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto my-12 border border-slate-200 dark:border-slate-700">
        <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Hospitals Selected</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-2">Please select hospitals to compare from the Discovery Map screen first.</p>
        <Link to="/search" className="mt-6 px-4 py-2 bg-primary text-slate-900 dark:text-white rounded-xl text-xs font-semibold inline-block">Back to Maps</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 text-left">
      <Link to="/search" className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:text-white transition-colors text-xs font-semibold">
        <ArrowLeft className="w-4 h-4" />
        Back to Discovery Maps
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="text-primary w-8 h-8 animate-bounce" />
          Side-by-Side Provider Comparison
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">Review ratings, department costs, and active availability options between your choices.</p>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl glass-panel bg-white dark:bg-slate-900/[0.01]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <th className="p-5 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider w-1/4">Comparison Metric</th>
              {hospitals.map(h => (
                <th key={h.id} className="p-5 font-extrabold text-slate-900 dark:text-white text-sm w-1/4">
                  {h.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-600 dark:text-slate-300">
            {/* Recommendation Match Score */}
            <tr>
              <td className="p-5 font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">Match Compatibility</td>
              {hospitals.map(h => (
                <td key={h.id} className="p-5">
                  <span className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full font-bold">
                    {h.recommendationScore}% Score
                  </span>
                </td>
              ))}
            </tr>

            {/* Ratings */}
            <tr>
              <td className="p-5 font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">Patient Rating</td>
              {hospitals.map(h => (
                <td key={h.id} className="p-5">
                  <div className="flex items-center gap-1 font-bold text-warning">
                    <Star className="w-4 h-4 fill-warning text-warning" />
                    {h.rating.toFixed(1)} / 5.0
                  </div>
                </td>
              ))}
            </tr>

            {/* Emergency status */}
            <tr>
              <td className="p-5 font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">24/7 ER Room</td>
              {hospitals.map(h => (
                <td key={h.id} className="p-5">
                  {h.emergencyAvailable ? (
                    <span className="text-[10px] bg-danger/10 border border-danger/20 text-danger px-2.5 py-0.5 rounded-full font-bold uppercase">
                      Yes — Active
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 px-2.5 py-0.5 rounded-full font-bold uppercase">
                      Not Available
                    </span>
                  )}
                </td>
              ))}
            </tr>

            {/* Operating Hours */}
            <tr>
              <td className="p-5 font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">Working Hours</td>
              {hospitals.map(h => (
                <td key={h.id} className="p-5 flex items-center gap-1.5 mt-1 font-medium">
                  <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400 dark:text-slate-500" />
                  {h.workingHours}
                </td>
              ))}
            </tr>

            {/* Specialities Available */}
            <tr>
              <td className="p-5 font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">Key Departments</td>
              {hospitals.map(h => (
                <td key={h.id} className="p-5">
                  <div className="flex flex-wrap gap-1">
                    {h.specialties?.map((s, idx) => (
                      <span key={idx} className="text-[9px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-semibold">
                        {s.specialty.name}
                      </span>
                    ))}
                  </div>
                </td>
              ))}
            </tr>

            {/* Average Consult Cost */}
            <tr>
              <td className="p-5 font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">Consult Costs</td>
              {hospitals.map(h => {
                const costs = h.specialties?.map(s => s.averageCost).filter(c => c > 0) || [];
                // Use actual DB costs if available, otherwise generate a realistic placeholder based on hospital rating
                const minCost = costs.length > 0 ? Math.min(...costs) : Math.floor(h.rating * 100);
                const maxCost = costs.length > 0 ? Math.max(...costs) : minCost + 500;

                return (
                  <td key={h.id} className="p-5 font-bold text-slate-900 dark:text-white">
                    ₹{minCost} - ₹{maxCost} {costs.length === 0 && <span className="text-[10px] text-slate-400 font-normal ml-1">(Est.)</span>}
                  </td>
                );
              })}
            </tr>

            {/* Address */}
            <tr>
              <td className="p-5 font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">Geographic Address</td>
              {hospitals.map(h => (
                <td key={h.id} className="p-5 text-slate-500 dark:text-slate-400 dark:text-slate-500 font-light flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                  {h.address}
                </td>
              ))}
            </tr>

            {/* Action buttons */}
            <tr>
              <td className="p-5 font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">Direct Actions</td>
              {hospitals.map(h => (
                <td key={h.id} className="p-5">
                  <Link
                    to={`/hospitals/${h.id}`}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-slate-900 dark:text-white text-[10px] font-bold rounded-xl block text-center shadow shadow-primary/10 transition-colors"
                  >
                    View Clinic Profile
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
