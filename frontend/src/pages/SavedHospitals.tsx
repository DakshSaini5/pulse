import React, { useState, useEffect } from 'react';
import { hospitalAPI, Hospital } from '../services/api';
import { 
  Heart, MapPin, Star, AlertCircle, ArrowRight, PhoneCall, Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { getInitialLocation } from '../utils/geolocation';

export const SavedHospitals: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEmergencyCallMode = searchParams.get('emergency_call') === 'true';

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  const emergencyHelplines = [
    { name: 'National Emergency Helpline (All-in-One)', phone: '112', desc: 'Central emergency response integration across India.' },
    { name: 'Ambulance Service', phone: '102', desc: 'Primary medical emergency response and hospital transport.' },
    { name: 'Trauma & Disaster Response (Ambulance)', phone: '108', desc: 'Accidents, trauma care, and state disaster helplines.' },
    { name: 'Police Dispatch', phone: '100', desc: 'Immediate civil safety and law enforcement dispatch.' },
    { name: 'Fire & Rescue Department', phone: '101', desc: 'Fire outbreaks and critical rescue operations.' },
    { name: 'Women Helpline', phone: '1091', desc: 'Dedicated civil security and protection response.' }
  ];

  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);

  const fetchSaved = async (userLat?: number, userLng?: number) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const data = await hospitalAPI.getSaved(userLat, userLng);
      setHospitals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await hospitalAPI.unsave(id);
      setHospitals(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadLocation = () => {
      getInitialLocation()
        .then((res) => {
          setLat(res.latitude);
          setLng(res.longitude);
          fetchSaved(res.latitude, res.longitude);
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

  return (
    <div className="space-y-8 pb-16 text-left">
      {/* Blinking Emergency Alert Box */}
      {isEmergencyCallMode && (
        <div className="bg-red-600 border border-red-500 rounded-2xl p-5 text-white flex items-center gap-4 animate-pulse shadow-xl shadow-red-600/30">
          <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 animate-bounce">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider">🚨 Emergency Call Directory Active</h3>
            <p className="text-xs text-white/90 font-medium">Click any calling button below to direct-dial the hospital instantly from your mobile dialer!</p>
          </div>
        </div>
      )}

      <div className="text-left space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Heart className="text-danger w-8 h-8 fill-danger animate-pulse" />
          {isEmergencyCallMode ? 'Emergency Call Directory' : 'Saved Care & Favorite Hospitals'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isEmergencyCallMode 
            ? 'Access hotlines and direct contact lines for your bookmarked medical facilities immediately.' 
            : 'Manage and browse clinics or medical departments you bookmarked for later navigation.'
          }
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-40 bg-slate-800 rounded-3xl" />
          <div className="h-40 bg-slate-800 rounded-3xl" />
        </div>
      ) : hospitals.length === 0 ? (
        <div className="space-y-8">
          {/* Main Empty State */}
          <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto border border-slate-200 dark:border-slate-700">
            <Heart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Saved Hospitals</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Bookmarked clinics from the search map will appear here for fast emergency dialer access.
            </p>
            <Link to="/search" className="mt-6 px-4 py-2 bg-primary text-slate-900 dark:text-white rounded-xl text-xs font-semibold inline-block">
              Explore Discover Maps
            </Link>
          </div>

          {/* National Helplines Fallback */}
          {isEmergencyCallMode && (
            <div className="space-y-6">
              <div className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center sm:text-left">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Verified National Medical Helplines</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Instant hotlines for dispatching ambulances, trauma response, or civil protection across India.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {emergencyHelplines.map((hl, idx) => (
                  <div 
                    key={idx}
                    className="glass-panel rounded-2xl p-5 border border-red-500/20 bg-red-500/[0.01] dark:bg-red-500/[0.02] flex flex-col justify-between h-44 shadow-sm hover:shadow-lg transition-all"
                  >
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug">{hl.name}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{hl.desc}</p>
                    </div>
                    <a
                      href={`tel:${hl.phone}`}
                      className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 mt-4 shadow-md shadow-red-600/20 hover:shadow-red-600/35 transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
                      Dial Hot: {hl.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Saved Hospitals list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hospitals.map(hosp => (
              <div
                key={hosp.id}
                onClick={() => navigate(`/hospitals/${hosp.id}`)}
                className="glass-panel glass-panel-hover rounded-3xl p-6 border border-slate-200 dark:border-slate-700 flex flex-col justify-between cursor-pointer text-left relative bg-white dark:bg-slate-900/[0.005]"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-snug">{hosp.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 leading-none">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        {hosp.address}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleUnsave(hosp.id, e)}
                      className="p-2.5 rounded-xl border border-danger/25 bg-danger/10 text-danger hover:bg-danger/20 transition-all shrink-0"
                      title="Remove from bookmarks"
                    >
                      <Heart className="w-4 h-4 fill-danger" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1 text-warning bg-warning/5 border border-warning/10 px-2.5 py-0.5 rounded-xl">
                      <Star className="w-4 h-4 fill-warning text-warning" />
                      {hosp.rating.toFixed(1)}
                    </span>

                    {hosp.emergencyAvailable && (
                      <span className="text-[10px] bg-danger/15 border border-danger/25 text-danger px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        24/7 ER Room
                      </span>
                    )}

                    <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold">
                      Score: {hosp.recommendationScore}%
                    </span>
                  </div>

                  {/* Dialer calling action */}
                  {hosp.phone ? (
                    <div className="pt-2">
                      <a
                        href={`tel:${hosp.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/35 flex items-center justify-center gap-2 active:scale-95"
                      >
                        <PhoneCall className="w-4 h-4 animate-bounce" />
                        Call Hospital: {hosp.phone}
                      </a>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <a
                        href="tel:112"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 hover:shadow-red-600/35 flex items-center justify-center gap-2 active:scale-95"
                      >
                        <PhoneCall className="w-4 h-4 animate-bounce" />
                        Call Emergency Hotline (112)
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700 mt-4 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <span>Working: {hosp.workingHours}</span>
                  <span className="text-primary font-extrabold flex items-center gap-0.5 hover:underline">
                    Directions
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* National Helplines supplementary section at bottom in emergency call mode */}
          {isEmergencyCallMode && (
            <div className="space-y-6 border-t border-slate-200 dark:border-slate-800 pt-8">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Verified National Medical Helplines</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Instant hotlines for dispatching ambulances, trauma response, or civil protection across India.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {emergencyHelplines.map((hl, idx) => (
                  <div 
                    key={idx}
                    className="glass-panel rounded-2xl p-5 border border-red-500/20 bg-red-500/[0.01] dark:bg-red-500/[0.02] flex flex-col justify-between h-44 shadow-sm hover:shadow-lg transition-all"
                  >
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug">{hl.name}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{hl.desc}</p>
                    </div>
                    <a
                      href={`tel:${hl.phone}`}
                      className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 mt-4 shadow-md shadow-red-600/20 hover:shadow-red-600/35 transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
                      Dial Hot: {hl.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
