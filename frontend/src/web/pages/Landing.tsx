import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@core/context/AuthContext';
import { emergencyAPI, hospitalAPI, prescriptionAPI, trendAPI, EmergencyContact } from '@core/services/api';
import EmergencyContactModal from '../components/EmergencyContactModal';
import NeedHelpModal from '../components/NeedHelpModal';
import BreathingCuesModal from '../components/BreathingCuesModal';
import { useUserLocation } from '@core/context/LocationContext';
import LocationModal from '../components/LocationModal';
import {
  Activity, Search, FileText, ArrowRight,
  Map, Play, Sparkles, Heart, Activity as ActivityIcon,
  ShieldAlert, AlertTriangle, Stethoscope, Syringe,
  TestTube, Bone, Brain, Eye, Baby, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import { isNativeApp } from '@core/utils/platform';

export const Landing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [panicLoading, setPanicLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(true);

  // Global user location hook
  const { latitude: lat, longitude: lng, label: cityName, locationStatus, requestGPSLocation } = useUserLocation();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Autocomplete Dropdown State
  const [autocompleteResults, setAutocompleteResults] = useState<{
    hospitals: Array<{ id: string; name: string }>;
    specialties: Array<{ name: string }>;
  }>({ hospitals: [], specialties: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchingAutocomplete, setSearchingAutocomplete] = useState(false);

  // Drag state for mobile web Panic Button
  const [panicDragOffset, setPanicDragOffset] = useState({ x: 0, y: 0 });
  const isPanicDragging = useRef(false);
  const panicDragStartPos = useRef({ x: 0, y: 0 });

  const handlePanicPointerDown = (e: React.PointerEvent) => {
    isPanicDragging.current = true;
    panicDragStartPos.current = {
      x: e.clientX - panicDragOffset.x,
      y: e.clientY - panicDragOffset.y
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePanicPointerMove = (e: React.PointerEvent) => {
    if (!isPanicDragging.current) return;
    let nextX = e.clientX - panicDragStartPos.current.x;
    let nextY = e.clientY - panicDragStartPos.current.y;

    // Bounds check
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 360;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 640;

    const maxLeftX = -screenWidth / 2 + 50;
    const maxRightX = screenWidth / 2 - 50;

    // Restrict drag up so it never goes past the dashboard area into the top header (leave top 340px clear)
    const maxUpY = -screenHeight + 340;
    const maxDownY = 60;

    setPanicDragOffset({
      x: Math.min(Math.max(nextX, maxLeftX), maxRightX),
      y: Math.min(Math.max(nextY, maxUpY), maxDownY)
    });
  };

  const handlePanicPointerUp = (e: React.PointerEvent) => {
    isPanicDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Dashboard Counts
  const [dashboardCounts, setDashboardCounts] = useState({ saved: 0, scans: 0, trends: 0 });

  useEffect(() => {
    if (user && isNativeApp) {
      Promise.all([
        hospitalAPI.getSaved(lat, lng).catch(() => []),
        prescriptionAPI.getAll().catch(() => []),
        trendAPI.getTrends().catch(() => [])
      ]).then(([hospitals, prescriptions, trends]) => {
        setDashboardCounts({
          saved: Array.isArray(hospitals) ? hospitals.length : 0,
          scans: Array.isArray(prescriptions) ? prescriptions.length : 0,
          trends: Array.isArray(trends) ? trends.length : 0
        });
      });
    }
  }, [user, isNativeApp, lat, lng]);

  useEffect(() => {
    if (user) {
      emergencyAPI.getContacts().then((data) => {
        setContacts(data);
        setContactsLoading(false);
        // Show modal if new user (0 contacts) and hasn't skipped this session (only on native app)
        if (isNativeApp && data.length === 0 && !sessionStorage.getItem('pulse_skipped_emergency')) {
          setTimeout(() => {
            setShowEmergencyModal(true);
          }, 1500); // 1.5s delay to prevent flash during login redirect
        }
      }).catch((err) => {
        console.error(err);
        setContactsLoading(false);
      });
    }
  }, [user]);

  // Click outside to close autocomplete dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.search-container')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Autocomplete query effect (debounced 300ms)
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setAutocompleteResults({ hospitals: [], specialties: [] });
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchingAutocomplete(true);
      setAutocompleteResults({ hospitals: [], specialties: [] }); // clear stale results immediately
      setShowDropdown(true); // show spinner right away, no flash of "no match"
      try {
        const data = await hospitalAPI.autocomplete(
          searchQuery,
          lat,
          lng,
          cityName
        );
        setAutocompleteResults(data);
      } catch (err) {
        console.error('Error fetching autocomplete:', err);
      } finally {
        setSearchingAutocomplete(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, lat, lng, cityName]);

  const handleSkipEmergency = () => {
    sessionStorage.setItem('skipped_emergency', 'true');
    setShowEmergencyModal(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowDropdown(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const triggerPanic = async () => {
    if (contacts.length === 0) {
      toast.error('You must save at least one emergency contact before triggering a Panic alert!', {
        duration: 4000
      });
      setShowEmergencyModal(true);
      return;
    }

    setPanicLoading(true);
    try {
      // Get location if possible
      let lat, lng;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (e) {
          console.warn("Location not available for panic button");
        }
      }

      const res = (await emergencyAPI.triggerPanic(lat, lng)) as any;

      if (res.simulated) {
        toast((t) => (
          <div className="text-xs text-slate-800 dark:text-slate-100 block text-left space-y-1">
            <span className="font-bold text-orange-500 block">🚨 EMERGENCY ALERT SIMULATED</span>
            <span>SMS successfully simulated for contacts:</span>
            <ul className="list-disc pl-4 font-semibold">
              {res.results?.map((r: any, idx: number) => (
                <li key={idx}>{r.name} ({r.status})</li>
              ))}
            </ul>
            <span className="text-[10px] text-gray-500 block pt-1 border-t border-slate-200 dark:border-slate-700">
              (To send real SMS, configure Twilio credentials in your backend .env file)
            </span>
          </div>
        ), { duration: 7000 });
      } else {
        toast.success(res.message || 'Live emergency SMS alerts successfully dispatched!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch panic alert');
    } finally {
      setPanicLoading(false);
    }
  };

  if (user) {
    // ==========================================
    // LOGGED-IN DASHBOARD VIEW
    // ==========================================
    return (
      <>
        <EmergencyContactModal
          isOpen={showEmergencyModal}
          onClose={handleSkipEmergency}
          onSuccess={() => {
            setShowEmergencyModal(false);
            emergencyAPI.getContacts().then(setContacts);
          }}
        />

        <BreathingCuesModal
          isOpen={showPanicModal}
          onClose={() => setShowPanicModal(false)}
          emergencyContactPhone={contacts[0]?.phoneNumber}
          emergencyContactName={contacts[0]?.name}
        />

        <NeedHelpModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
        />

        <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
          {/* Action Required Banner */}
          {isNativeApp && !contactsLoading && contacts.length === 0 && !showEmergencyModal && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-orange-500/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="text-orange-500 w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-orange-500 font-bold">Action Required: Emergency Contacts</h3>
                  <p className="text-sm text-orange-600/80 dark:text-orange-400/80">You have no emergency contacts saved. This is required for the Panic Button feature.</p>
                </div>
              </div>
              <Link to="/profile" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors whitespace-nowrap">
                Add Now
              </Link>
            </div>
          )}

          {/* Header & Panic Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 text-left">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Hi, {user.name} 👋
              </h1>
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                {locationStatus === 'granted' && cityName ? (
                  <span className="flex items-center flex-wrap gap-1">
                    <MapPin className="w-4 h-4 text-primary shrink-0 animate-bounce" />
                    <span>Showing care services in <strong className="text-slate-800 dark:text-white">{cityName}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        console.log("[Landing] Change Location clicked, setting modal open to true");
                        setIsLocationModalOpen(true);
                      }}
                      className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary px-2 py-0.5 rounded-lg ml-2 font-bold transition-all border border-primary/20 cursor-pointer relative z-50"
                    >
                      Change
                    </button>
                  </span>
                ) : locationStatus === 'checking' ? (
                  <>
                    <Activity className="w-4 h-4 text-primary animate-spin shrink-0" />
                    <span>Acquiring your location coordinates...</span>
                  </>
                ) : (
                  <span>Welcome back to Pulse. Monitor, analyze, and explore your care.</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">

              <button
                onClick={() => setShowHelpModal(true)}
                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-800/50 shadow-sm transition-all flex items-center gap-2"
              >
                <ActivityIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Need Help?
              </button>
              {!isNativeApp && (
                <button
                  onClick={() => setShowPanicModal(true)}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-red-600/20 transition-all active:scale-95 flex items-center gap-2 border border-red-500/10"
                >
                  <ShieldAlert className="w-4 h-4" />
                  PANIC
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Location-Based Care Discovery Rendering */}
          {locationStatus === 'checking' ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
              <Activity className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Locating you to find nearby healthcare services...
              </p>
            </div>
          ) : locationStatus === 'granted' ? (
            <>
              {/* Global Search Bar with AutoComplete Dropdown */}
              <div className="search-container relative group w-full">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-teal-500/20 rounded-2xl sm:rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-50" />
                <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 shadow-sm">
                  <div className="pl-3 sm:pl-4 text-slate-400 shrink-0">
                    <Search className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for services, hospitals, or conditions..."
                    className="w-full bg-transparent border-none focus:ring-0 text-[11px] sm:text-lg px-2 sm:px-4 py-2 sm:py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                  <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-5 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-base font-bold transition-colors shrink-0">
                    Search
                  </button>
                </form>

                {/* Autocomplete Dropdown List */}
                {showDropdown && searchQuery.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[1000] p-4 text-left max-h-96 overflow-y-auto">
                    {searchingAutocomplete ? (
                      <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                        <Activity className="animate-spin text-primary w-4 h-4" />
                        Searching Database...
                      </div>
                    ) : autocompleteResults.hospitals.length === 0 && autocompleteResults.specialties.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                        ❌ No matching hospitals or services found in database.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Specialties/Services Autocomplete results */}
                        {autocompleteResults.specialties.length > 0 && (
                          <div>
                            <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider block mb-2 px-2">
                              🩺 Results in Services
                            </span>
                            <div className="space-y-1">
                              {autocompleteResults.specialties.map((spec) => (
                                <div
                                  key={spec.name}
                                  onClick={() => {
                                    setShowDropdown(false);
                                    navigate(`/search?specialty=${encodeURIComponent(spec.name)}`);
                                  }}
                                  className="px-3 py-2.5 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center justify-between group transition-colors"
                                >
                                  <span className="font-semibold">{spec.name}</span>
                                  <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                                    Go to Service
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hospitals Autocomplete results */}
                        {autocompleteResults.hospitals.length > 0 && (
                          <div>
                            <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider block mb-2 px-2">
                              🏥 Results in Hospitals
                            </span>
                            <div className="space-y-1">
                              {autocompleteResults.hospitals.map((hosp) => (
                                <div
                                  key={hosp.id}
                                  onClick={() => {
                                    setShowDropdown(false);
                                    navigate(`/hospitals/${hosp.id}`);
                                  }}
                                  className="px-3 py-2.5 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center justify-between group transition-colors"
                                >
                                  <span className="font-semibold">{hosp.name}</span>
                                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                                    View Details
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Browse Services Grid */}
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 text-left">Browse Services</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4">
                  {[
                    { name: 'General', icon: Stethoscope, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', specialty: 'General Medicine' },
                    { name: 'Vaccination', icon: Syringe, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', query: 'vaccination' },
                    { name: 'Blood Test', icon: TestTube, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', query: 'blood test' },
                    { name: 'Dental', icon: Bone, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', specialty: 'Dental' },
                    { name: 'Cardiology', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', specialty: 'Cardiology' },
                    { name: 'Neurology', icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', specialty: 'Neurology' },
                    { name: 'Eye Care', icon: Eye, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10', specialty: 'Eye Care' },
                    { name: 'Pediatrics', icon: Baby, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', specialty: 'Pediatrics' },
                  ].map((service, idx) => (
                    <Link
                      key={idx}
                      to={'query' in service ? `/search?q=${encodeURIComponent(service.query as string)}` : `/search?specialty=${encodeURIComponent((service as any).specialty || service.name)}`}
                      className="flex flex-col items-center justify-center p-3 sm:p-6 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl hover:-translate-y-1 transition-transform group shadow-sm hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-black/40"
                    >
                      <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${service.bg} flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform`}>
                        <service.icon className={`w-5 h-5 sm:w-8 sm:h-8 ${service.color}`} />
                      </div>
                      <span className="text-slate-900 dark:text-slate-200 font-semibold text-[10px] sm:text-base text-center leading-tight">{service.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center max-w-xl mx-auto my-8 space-y-6 shadow-xl shadow-slate-100 dark:shadow-black/20">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <MapPin className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Location Needed</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Please enable location services or enter your address manually to discover nearby healthcare facilities.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={async () => {
                    const success = await requestGPSLocation();
                    if (!success) {
                      toast.error("GPS access failed. Please select your location manually.");
                      setIsLocationModalOpen(true);
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Use Live GPS
                </button>
                <button
                  onClick={() => setIsLocationModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-primary/20"
                >
                  Enter Location Manually
                </button>
              </div>
            </div>
          )}

          {/* --- MOBILE NATIVE SECTIONS --- */}
          {isNativeApp && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              {/* Daily Health Tips */}
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 text-left">Daily Health Tips</h2>
                <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                  <div className="w-60 h-32 p-4 bg-[#FFFBF0] dark:bg-amber-950/30 border border-[#FDE68A] dark:border-amber-800/50 rounded-2xl snap-center flex-shrink-0 flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400">💧</span>
                      <h3 className="font-bold text-[#854D0E] dark:text-amber-500">Stay Hydrated</h3>
                    </div>
                    <p className="text-xs text-[#D97706] dark:text-amber-600/90 leading-relaxed font-medium">
                      Drinking at least 8 glasses of water daily improves energy levels and keeps your skin glowing.
                    </p>
                  </div>
                  <div className="w-60 h-32 p-4 bg-[#F0FDF4] dark:bg-emerald-950/30 border border-[#BBF7D0] dark:border-emerald-800/50 rounded-2xl snap-center flex-shrink-0 flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500">🚶</span>
                      <h3 className="font-bold text-[#166534] dark:text-emerald-500">Keep Moving</h3>
                    </div>
                    <p className="text-xs text-[#059669] dark:text-emerald-600/90 leading-relaxed font-medium">
                      A brisk 30-minute walk every day can significantly boost your cardiovascular health.
                    </p>
                  </div>
                  <div className="w-60 h-32 p-4 bg-[#FAF5FF] dark:bg-purple-950/30 border border-[#E9D5FF] dark:border-purple-800/50 rounded-2xl snap-center flex-shrink-0 flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-500">💤</span>
                      <h3 className="font-bold text-[#6B21A8] dark:text-purple-500">Quality Sleep</h3>
                    </div>
                    <p className="text-xs text-[#9333EA] dark:text-purple-600/90 leading-relaxed font-medium">
                      Aim for 7-9 hours of uninterrupted sleep to enhance immune function and cognitive performance.
                    </p>
                  </div>
                  <div className="w-60 h-32 p-4 bg-[#F0F9FF] dark:bg-sky-950/30 border border-[#BAE6FD] dark:border-sky-800/50 rounded-2xl snap-center flex-shrink-0 flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sky-500">🥗</span>
                      <h3 className="font-bold text-[#075985] dark:text-sky-500">Balanced Diet</h3>
                    </div>
                    <p className="text-xs text-[#0369A1] dark:text-sky-600/90 leading-relaxed font-medium">
                      Incorporate a variety of colorful vegetables and lean proteins to fuel your body throughout the day.
                    </p>
                  </div>
                </div>
              </div>

              {/* Health Summary / Dashboard */}
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 text-left">Your Health Summary</h2>
                <div className="grid grid-cols-3 gap-2">
                  <Link to="/prescriptions" className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center gap-0.5 active:scale-95 transition-transform shadow-sm">
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">{dashboardCounts.scans}</span>
                    <span className="block text-xs font-bold text-slate-800 dark:text-white mt-1">Scans</span>
                    <span className="text-[9px] font-medium text-slate-500">prescriptions</span>
                  </Link>
                  <Link to="/saved" className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center gap-0.5 active:scale-95 transition-transform shadow-sm">
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">{dashboardCounts.saved}</span>
                    <span className="block text-xs font-bold text-slate-800 dark:text-white mt-1">Hospitals</span>
                    <span className="text-[9px] font-medium text-slate-500">saved</span>
                  </Link>
                  <Link to="/reports" className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center gap-0.5 active:scale-95 transition-transform shadow-sm">
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">{dashboardCounts.trends}</span>
                    <span className="block text-xs font-bold text-slate-800 dark:text-white mt-1">Trends</span>
                    <span className="text-[9px] font-medium text-slate-500">tracked</span>
                  </Link>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Movable Panic Button for Mobile Dashboard */}
        {isNativeApp && (
          <button
            onPointerDown={handlePanicPointerDown}
            onPointerMove={handlePanicPointerMove}
            onPointerUp={handlePanicPointerUp}
            onClick={() => setShowPanicModal(true)}
            style={{ transform: `translate(calc(-50% + ${panicDragOffset.x}px), ${panicDragOffset.y}px)`, touchAction: 'none' }}
            className="fixed bottom-24 left-1/2 z-[99999] h-10 px-2 pr-6 bg-[#DC2626] text-white text-xs font-black rounded-full shadow-[0_0_20px_rgba(220,38,38,0.6)] border border-red-400/30 flex items-center justify-center gap-2 cursor-grab active:cursor-grabbing transition-colors"
          >
            <div className="size-6 bg-white rounded-full flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-[#DC2626] font-black text-sm leading-none mt-0.5">!</span>
            </div>
            <span className="tracking-widest">PANIC</span>
          </button>
        )}

        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
        />
      </>
    );
  }

  // ==========================================
  // PUBLIC HERO VIEW (Not Logged In)
  // ==========================================
  return (
    <>

      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-32 px-4 md:px-10 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-500/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-primary text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700 animate-pulse">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            Pulse Intelligent Healthcare Platform
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            No Queue, <br />
            <span className="text-primary">For Your Cure.</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            An AI-powered navigation assistant that simplifies complex medical files, tracks your core trends, and recommends highly suited hospitals in plain English.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-xl bg-primary hover:bg-primary-hover text-slate-900 dark:text-white font-bold text-sm sm:text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 sm:gap-3 group"
            >
              Start Analyzing Free
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/search"
              className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-xl glass-panel bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-sm sm:text-lg text-slate-900 dark:text-white transition-all flex items-center justify-center gap-2 sm:gap-3"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 text-primary fill-primary" />
              Discover Hospitals Map
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200/50 dark:border-slate-800/50">
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              Disclaimer: This app is not a medical device and does not diagnose, treat, or prevent any condition.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};
