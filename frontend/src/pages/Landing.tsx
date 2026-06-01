import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { emergencyAPI, hospitalAPI, EmergencyContact } from '../services/api';
import EmergencyContactModal from '../components/EmergencyContactModal';
import NeedHelpModal from '../components/NeedHelpModal';
import { 
  Activity, Search, FileText, ArrowRight, 
  Map, Play, Sparkles, Heart, Activity as ActivityIcon,
  ShieldAlert, AlertTriangle, Stethoscope, Syringe,
  TestTube, Bone, Brain, Eye, Baby
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Landing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [panicLoading, setPanicLoading] = useState(false);

  // Autocomplete Dropdown State
  const [autocompleteResults, setAutocompleteResults] = useState<{
    hospitals: Array<{ id: string; name: string }>;
    specialties: Array<{ name: string }>;
  }>({ hospitals: [], specialties: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchingAutocomplete, setSearchingAutocomplete] = useState(false);

  useEffect(() => {
    if (user) {
      emergencyAPI.getContacts().then((data) => {
        setContacts(data);
        // Show modal if new user (0 contacts) and hasn't skipped this session
        if (data.length === 0 && !sessionStorage.getItem('skipped_emergency')) {
          setShowEmergencyModal(true);
        }
      }).catch(console.error);
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
      try {
        const data = await hospitalAPI.autocomplete(searchQuery);
        setAutocompleteResults(data);
        setShowDropdown(true);
      } catch (err) {
        console.error('Error fetching autocomplete:', err);
      } finally {
        setSearchingAutocomplete(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

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
      <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
        <EmergencyContactModal 
          isOpen={showEmergencyModal} 
          onClose={handleSkipEmergency}
          onSuccess={() => {
            setShowEmergencyModal(false);
            emergencyAPI.getContacts().then(setContacts);
          }}
        />

        <NeedHelpModal 
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
        />

        {/* Action Required Banner */}
        {contacts.length === 0 && !showEmergencyModal && (
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Hi, {user.name.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">How are you feeling today?</p>
          </div>

          <div className="flex w-full md:w-auto items-center gap-3">
            <button 
              onClick={() => setShowHelpModal(true)}
              className="flex-1 md:flex-none px-6 py-3.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold rounded-2xl border border-red-200 dark:border-red-500/30 transition-all flex items-center justify-center gap-2"
            >
              <ActivityIcon className="w-5 h-5" />
              Need Help?
            </button>
            <button 
              onClick={triggerPanic}
              disabled={panicLoading}
              className="flex-1 md:flex-none px-6 py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-extrabold rounded-2xl shadow-xl shadow-red-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-5 h-5" />
              {panicLoading ? 'SENDING...' : 'PANIC'}
            </button>
          </div>
        </div>

        {/* Global Search Bar with AutoComplete Dropdown */}
        <div className="search-container relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-teal-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-50" />
          <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-2 shadow-sm">
            <div className="pl-4 text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for services, hospitals, or conditions..."
              className="w-full bg-transparent border-none focus:ring-0 text-lg px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
            <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-2xl font-bold transition-colors">
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Browse Services</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'General', icon: Stethoscope, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
              { name: 'Vaccination', icon: Syringe, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
              { name: 'Blood Test', icon: TestTube, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
              { name: 'Dental', icon: Bone, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
              { name: 'Cardiology', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
              { name: 'Neurology', icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
              { name: 'Eye Care', icon: Eye, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
              { name: 'Pediatrics', icon: Baby, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
            ].map((service, idx) => (
              <Link 
                key={idx}
                to={`/search?specialty=${encodeURIComponent(service.name)}`}
                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl hover:-translate-y-1 transition-transform group shadow-sm hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-black/40"
              >
                <div className={`w-16 h-16 rounded-2xl ${service.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <service.icon className={`w-8 h-8 ${service.color}`} />
                </div>
                <span className="text-slate-900 dark:text-slate-200 font-semibold">{service.name}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    );
  }

  // ==========================================
  // PUBLIC HERO VIEW (Not Logged In)
  // ==========================================
  return (
    <div className="w-full">
      <section className="relative pt-24 pb-32 px-4 md:px-10 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-primary text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700 animate-pulse">
            <Sparkles className="w-4 h-4" />
            Pulse Intelligent Healthcare Platform
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Find the Right Care, <br/>
            <span className="text-primary">Faster and Smarter.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            An AI-powered navigation assistant that simplifies complex medical files, tracks your core trends, and recommends highly suited hospitals in plain English.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary hover:bg-primary-hover text-slate-900 dark:text-white font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center justify-center gap-3 group"
            >
              Start Analyzing Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/search"
              className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-lg text-slate-900 dark:text-white transition-all flex items-center justify-center gap-3"
            >
              <Play className="w-5 h-5 text-primary fill-primary" />
              Discover Hospitals Map
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
