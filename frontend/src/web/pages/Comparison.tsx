import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { hospitalAPI, Hospital } from '@core/services/api';
import { getInitialLocation } from '@core/utils/geolocation';
import { 
  ArrowLeft, Star, Clock, AlertCircle, ShieldCheck, 
  MapPin, Phone, Globe, Layers, Plus, Check, ArrowRight
} from 'lucide-react';
import { getHospitalDisplayName, getHospitalLocality } from '@core/utils/utils';
import toast from 'react-hot-toast';

export const Comparison: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);

  useEffect(() => {
    document.title = 'Compare hospitals | Pulse';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Compare 2 or 3 hospitals side by side by distance, departments, and emergency care.');
  }, []);

  const idsStr = searchParams.get('ids') || '';
  const currentIds = idsStr ? idsStr.split(',').filter(Boolean) : [];

  // Fetch comparison data or fallback list
  useEffect(() => {
    const loadHospitals = async () => {
      setLoading(true);
      try {
        if (currentIds.length > 0) {
          const data = await hospitalAPI.compare(currentIds, lat, lng);
          setHospitals(data);
        } else {
          setHospitals([]);
        }

        // Always fetch a selection of hospitals for the "Add to compare" list
        const nearby = await hospitalAPI.search('', '', 25, lat || 12.9716, lng || 77.5946);
        setNearbyHospitals(nearby);
      } catch (err) {
        console.error('Error fetching hospitals for comparison:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHospitals();
  }, [idsStr, lat, lng]);

  // Geolocation
  useEffect(() => {
    getInitialLocation()
      .then((res) => {
        setLat(res.latitude);
        setLng(res.longitude);
      })
      .catch((err) => {
        console.warn('Geolocation fallback to Bengaluru:', err);
      });
  }, []);

  const handleToggleCompare = (id: string) => {
    let newIds = [...currentIds];
    if (newIds.includes(id)) {
      newIds = newIds.filter((cid) => cid !== id);
    } else {
      if (newIds.length >= 3) {
        toast.error('You can compare a maximum of 3 hospitals at a time.');
        return;
      }
      newIds.push(id);
    }

    if (newIds.length > 0) {
      setSearchParams({ ids: newIds.join(',') });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-16 text-left">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A3BAA] hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Find more hospitals
          </Link>
          <h1 className="text-[28px] sm:text-[36px] font-bold text-[#121414] dark:text-white leading-[1.2] tracking-[-0.02em]">
            Compare hospitals
          </h1>
          <p className="text-sm sm:text-base text-[#4B5563] dark:text-slate-400 mt-1">
            Pick 2 or 3 hospitals to compare. Tap &quot;Add to compare&quot; on any hospital below.
          </p>
        </div>

        {currentIds.length > 0 && (
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="px-3.5 py-2 border border-[#E5E7EB] dark:border-slate-700 text-sm font-medium text-[#4B5563] rounded-lg hover:bg-slate-50 transition-colors"
          >
            Clear selection ({currentIds.length})
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4 py-8 animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      ) : hospitals.length > 0 ? (
        /* Side-by-side Table */
        <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)] bg-white dark:bg-slate-900">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-slate-800 bg-[#F5F7FA] dark:bg-slate-800/60">
                <th className="p-4 sm:p-5 font-bold text-[#121414] dark:text-white uppercase tracking-wider w-1/4 text-xs">
                  Feature
                </th>
                {hospitals.map((h) => (
                  <th key={h.id} className="p-4 sm:p-5 font-bold text-[#121414] dark:text-white text-base w-1/4 align-top">
                    <div className="space-y-1">
                      <div>{getHospitalDisplayName(h.name, h.address)}</div>
                      <button
                        type="button"
                        onClick={() => handleToggleCompare(h.id)}
                        className="text-xs text-[#C62828] hover:underline font-normal"
                      >
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-slate-800 text-[#121414] dark:text-slate-200">
              {/* Rating */}
              <tr>
                <td className="p-4 sm:p-5 font-semibold text-[#4B5563] dark:text-slate-400">
                  Rating
                </td>
                {hospitals.map((h) => (
                  <td key={h.id} className="p-4 sm:p-5">
                    <div className="flex items-center gap-1 font-bold text-[#B45309]">
                      <Star className="w-4 h-4 fill-[#B45309] text-[#B45309]" />
                      <span>{h.rating.toFixed(1)} / 5.0</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* 24x7 Emergency status */}
              <tr>
                <td className="p-4 sm:p-5 font-semibold text-[#4B5563] dark:text-slate-400">
                  24x7 Emergency
                </td>
                {hospitals.map((h) => (
                  <td key={h.id} className="p-4 sm:p-5">
                    {h.emergencyAvailable ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-[#12805C] border border-[#12805C]/30">
                        Available
                      </span>
                    ) : (
                      <span className="text-xs text-[#4B5563]">
                        Not listed
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Distance */}
              <tr>
                <td className="p-4 sm:p-5 font-semibold text-[#4B5563] dark:text-slate-400">
                  Distance
                </td>
                {hospitals.map((h) => (
                  <td key={h.id} className="p-4 sm:p-5 font-medium">
                    {h.distance ? `${h.distance.toFixed(1)} km` : 'Contact for location'}
                  </td>
                ))}
              </tr>

              {/* Operating Hours */}
              <tr>
                <td className="p-4 sm:p-5 font-semibold text-[#4B5563] dark:text-slate-400">
                  Working Hours
                </td>
                {hospitals.map((h) => (
                  <td key={h.id} className="p-4 sm:p-5">
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#4B5563] dark:text-slate-300">
                      <Clock className="w-4 h-4 text-[#1A3BAA] shrink-0" />
                      <span>{h.workingHours || 'Mon-Sun: 24 Hours'}</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Specialties */}
              <tr>
                <td className="p-4 sm:p-5 font-semibold text-[#4B5563] dark:text-slate-400">
                  Departments
                </td>
                {hospitals.map((h) => (
                  <td key={h.id} className="p-4 sm:p-5">
                    <div className="flex flex-wrap gap-1.5">
                      {h.specialties && h.specialties.length > 0 ? (
                        h.specialties.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-[#F5F7FA] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 text-[#121414] dark:text-slate-300 px-2 py-0.5 rounded"
                          >
                            {s.specialty.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#4B5563]">General Care</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Phone */}
              <tr>
                <td className="p-4 sm:p-5 font-semibold text-[#4B5563] dark:text-slate-400">
                  Phone
                </td>
                {hospitals.map((h) => (
                  <td key={h.id} className="p-4 sm:p-5">
                    {h.phone ? (
                      <div>
                        <a href={`tel:${h.phone}`} className="text-[#1A3BAA] font-semibold hover:underline">
                          {h.phone}
                        </a>
                        <p className="text-[12px] text-[#4B5563] mt-0.5">
                          Call to confirm before visiting.
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-[#4B5563]">Check website</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Action buttons */}
              <tr>
                <td className="p-4 sm:p-5 font-semibold text-[#4B5563] dark:text-slate-400">
                  Details
                </td>
                {hospitals.map((h) => (
                  <td key={h.id} className="p-4 sm:p-5">
                    <Link
                      to={`/hospitals/${h.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A3BAA] hover:bg-[#142E86] text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <span>View details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}

      {/* "Add to compare" section from nearby hospitals */}
      <div className="space-y-4 pt-4">
        <div className="border-b border-[#E5E7EB] dark:border-slate-800 pb-3">
          <h2 className="text-xl font-bold text-[#121414] dark:text-white">
            {hospitals.length === 0 ? 'Pick hospitals to compare' : 'Add another hospital to compare'}
          </h2>
          <p className="text-sm text-[#4B5563] dark:text-slate-400 mt-1">
            {hospitals.length === 0
              ? 'Click "Add to compare" on any hospital below to see side-by-side details.'
              : `You have selected ${hospitals.length} of 3 hospitals.`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nearbyHospitals.slice(0, 9).map((hosp) => {
            const isAdded = currentIds.includes(hosp.id);
            return (
              <div
                key={hosp.id}
                className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-[#121414] dark:text-white text-base">
                      {getHospitalDisplayName(hosp.name, hosp.address)}
                    </h3>
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#B45309]">
                      <Star className="w-3.5 h-3.5 fill-[#B45309]" />
                      {hosp.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm text-[#4B5563] dark:text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#1A3BAA] shrink-0" />
                    <span className="truncate">{getHospitalLocality(hosp.address) || hosp.address}</span>
                  </p>
                  {hosp.emergencyAvailable && (
                    <span className="inline-block px-2.5 py-0.5 rounded text-sm font-semibold bg-emerald-50 text-[#12805C] border border-[#12805C]/20">
                      24×7 emergency
                    </span>
                  )}
                </div>

                <div className="pt-4 mt-2 border-t border-[#E5E7EB] dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-medium text-[#4B5563]">
                    {hosp.distance ? `${hosp.distance.toFixed(1)} km away` : 'Bengaluru'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleCompare(hosp.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                      isAdded
                        ? 'bg-[#EEF2FC] text-[#1A3BAA] border border-[#1A3BAA]'
                        : 'bg-[#1A3BAA] hover:bg-[#142E86] text-white'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Add to compare
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-4 bg-[#F5F7FA] dark:bg-slate-800/40 border border-[#E5E7EB] dark:border-slate-800 rounded-xl text-xs sm:text-sm text-[#4B5563] dark:text-slate-400 leading-[1.5]">
        <strong>Note:</strong> Hospital information is gathered from public registrations and verified directories. Operating schedules may change without notice. Please call the hospital directly to confirm doctor availability before visiting.
      </div>
    </div>
  );
};

export default Comparison;
