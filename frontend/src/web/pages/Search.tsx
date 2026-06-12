import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { hospitalAPI, Hospital } from '@core/services/api';
import { Map } from '../components/Map';
import { 
  Search as SearchIcon, MapPin, Star, AlertCircle, Heart, Phone,
  Activity, ArrowRight, ShieldCheck, HelpCircle, Layers, CheckSquare, Square, Globe
} from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';
import { formatIndianPhoneNumber, getDialerHref } from '@core/utils/phoneFormatter';
import toast from 'react-hot-toast';
import { useUserLocation } from '@core/context/LocationContext';
import LocationModal from '../components/LocationModal';


export const Search: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Search parameters state initialized from URL if present
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [specialty, setSpecialty] = useState(searchParams.get('specialty') || '');
  const [radius, setRadius] = useState(() => {
    const saved = localStorage.getItem('pulse_pref_radius');
    return saved ? parseInt(saved) : 15;
  });
  const [emergencyOnly, setEmergencyOnly] = useState(searchParams.get('emergency') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'distance');

  // Use global user location hook
  const { latitude: lat, longitude: lng, label: cityName, locationStatus, requestGPSLocation } = useUserLocation();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Autocomplete Dropdown State
  const [autocompleteResults, setAutocompleteResults] = useState<{
    hospitals: Array<{ id: string; name: string }>;
    specialties: Array<{ name: string }>;
  }>({ hospitals: [], specialties: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchingAutocomplete, setSearchingAutocomplete] = useState(false);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | undefined>(undefined);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  
  // Hospital comparison tracking state
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Expanded comprehensive specialties list
  const specialties = [
    { name: 'Cardiology', label: '🫀 Cardiology' },
    { name: 'Orthopedics', label: '🦴 Orthopedics' },
    { name: 'Neurology', label: '🧠 Neurology' },
    { name: 'Pediatrics', label: '👶 Pediatrics' },
    { name: 'Gynecology', label: '🤰 Gynecology' },
    { name: 'Dermatology', label: ' छाला Dermatology' },
    { name: 'Endocrinology', label: '🦋 Endocrinology' },
    { name: 'Gastroenterology', label: '⚕️ Gastroenterology' },
    { name: 'Oncology', label: '🎗️ Oncology' },
    { name: 'Ophthalmology', label: '👁️ Ophthalmology' },
    { name: 'Urology', label: '💧 Urology' },
    { name: 'Psychiatry', label: '🧘 Psychiatry' },
    { name: 'ENT', label: '👂 ENT' },
    { name: 'Pulmonology', label: '🫁 Pulmonology' },
    { name: 'General Surgery', label: '✂️ General Surgery' },
    { name: 'Dental', label: '🦷 Dental' },
    { name: 'Emergency Medicine', label: '🚑 Emergency Medicine' },
    { name: 'Hematology', label: '🩸 Hematology' },
    { name: 'Rheumatology', label: '🦴 Rheumatology' },
    { name: 'General Medicine', label: '🏥 General Medicine' }
  ];

  // Debounce query (clears immediately if empty)
  useEffect(() => {
    if (query === '') {
      setDebouncedQuery('');
      return;
    }
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  // Click outside to close autocomplete dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.search-container-main')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Autocomplete query effect (debounced 300ms)
  useEffect(() => {
    if (query.trim().length < 2) {
      setAutocompleteResults({ hospitals: [], specialties: [] });
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchingAutocomplete(true);
      try {
        const data = await hospitalAPI.autocomplete(query, lat, lng, cityName);
        setAutocompleteResults(data);
        setShowDropdown(true);
      } catch (err) {
        console.error('Error fetching autocomplete:', err);
      } finally {
        setSearchingAutocomplete(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, lat, lng, cityName]);

  const fetchHospitals = async (searchVal = debouncedQuery) => {
    if (lat === null || lng === null) return;
    setLoading(true);
    try {
      const data = await hospitalAPI.search(searchVal, specialty, radius, lat, lng, cityName);
      // Client-side emergency filter if checked
      let filtered = emergencyOnly ? data.filter(h => h.emergencyAvailable) : data;
      
      // Sort
      if (sortBy === 'rating') {
        filtered = filtered.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === 'distance') {
        filtered = filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      } else {
        // match
        filtered = filtered.sort((a, b) => b.recommendationScore - a.recommendationScore);
      }
      
      setHospitals(filtered);
      
      // Auto highlight first search match if available
      if (filtered.length > 0) {
        setSelectedHospitalId(filtered[0].id);
      } else {
        setSelectedHospitalId(undefined);
      }
    } catch (err) {
      console.error('Failed fetching hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSaved = async () => {
    if (!user || lat === null || lng === null) return;
    try {
      const saved = await hospitalAPI.getSaved(lat, lng);
      setSavedIds(saved.map(h => h.id));
    } catch (err) {
      console.error(err);
    }
  };

  // Run initial and updated searches
  useEffect(() => {
    fetchHospitals(debouncedQuery);
    fetchSaved();
  }, [specialty, radius, emergencyOnly, sortBy, lat, lng, debouncedQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHospitals(debouncedQuery);
  };

  const handleToggleSave = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (savedIds.includes(id)) {
        await hospitalAPI.unsave(id);
        setSavedIds(prev => prev.filter(savedId => savedId !== id));
      } else {
        await hospitalAPI.save(id);
        setSavedIds(prev => [...prev, id]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectHospital = (id: string) => {
    setSelectedHospitalId(id);
  };

  const handleToggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(cid => cid !== id);
      }
      if (prev.length >= 3) {
        toast.error('You can select a maximum of 3 hospitals to compare at once.');
        return prev;
      }
      return [...prev, id];
    });
  };



  return (
    <div className="space-y-8 pb-20 relative">
      <div className="text-left space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="text-primary w-8 h-8 animate-pulse" />
          Healthcare Navigation & Hospital Discovery
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Discover hospitals matching your specialty need, distance parameters, and emergency situations.</p>
      </div>

      {locationStatus === 'checking' ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm text-center">
          <Activity className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Locating you to find nearby healthcare services...
          </p>
        </div>
      ) : locationStatus === 'granted' ? (
        <>
          {cityName && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl w-fit mr-auto flex-wrap">
              <MapPin className="w-4 h-4 text-primary shrink-0 animate-bounce" />
              <span>Active Location: <strong className="text-slate-800 dark:text-white">{cityName}</strong></span>
              <div className="ml-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={async () => {
                    const success = await requestGPSLocation();
                    if (success) toast.success("Location refreshed successfully!");
                    else toast.error("Could not refresh GPS location.");
                  }}
                  className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg font-bold transition-all border border-emerald-500/20 flex items-center gap-1"
                >
                  <Activity className="w-3 h-3" />
                  Refresh GPS
                </button>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary px-2 py-0.5 rounded-lg font-bold transition-all border border-primary/20"
                >
                  Change Location
                </button>
              </div>
            </div>
          )}

          {/* Filters Segment */}
          <form onSubmit={handleSearchSubmit} className="glass-panel rounded-2xl p-4 sm:p-6 border border-pulseBorder dark:border-slate-700 grid grid-cols-1 md:grid-cols-12 gap-4 items-end text-left bg-white/[0.01] dark:bg-slate-900/50 relative z-30">
            <div className="md:col-span-4 space-y-1 search-container-main relative">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hospital Name / Keywords</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 dark:text-slate-400">
                  <SearchIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => { if (query.trim().length >= 2) setShowDropdown(true); }}
                  placeholder="Search Hospital or Specialty Name"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs text-slate-900"
                />
              </div>

              {/* Autocomplete Dropdown List */}
              {showDropdown && query.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-50 p-4 text-left max-h-60 overflow-y-auto">
                  {searchingAutocomplete ? (
                    <div className="py-2 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                      <Activity className="animate-spin text-primary w-4 h-4" />
                      Searching...
                    </div>
                  ) : autocompleteResults.hospitals.length === 0 && autocompleteResults.specialties.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                      ❌ No matching results found.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Specialties/Services Autocomplete results */}
                      {autocompleteResults.specialties.length > 0 && (
                        <div>
                          <span className="text-[9px] font-extrabold text-primary uppercase tracking-wider block mb-1 px-1">
                            🩺 Services
                          </span>
                          <div className="space-y-0.5">
                            {autocompleteResults.specialties.map((spec) => (
                              <div
                                key={spec.name}
                                onClick={() => {
                                  setSpecialty(spec.name);
                                  setQuery('');
                                  setShowDropdown(false);
                                }}
                                className="px-2 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center justify-between group transition-colors"
                              >
                                <span className="font-semibold">{spec.name}</span>
                                <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                                  Filter
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hospitals Autocomplete results */}
                      {autocompleteResults.hospitals.length > 0 && (
                        <div>
                          <span className="text-[9px] font-extrabold text-red-500 uppercase tracking-wider block mb-1 px-1">
                            🏥 Hospitals
                          </span>
                          <div className="space-y-0.5">
                            {autocompleteResults.hospitals.map((hosp) => (
                              <div
                                key={hosp.id}
                                onClick={() => {
                                  setQuery(hosp.name);
                                  setSelectedHospitalId(hosp.id);
                                  setShowDropdown(false);
                                }}
                                className="px-2 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center justify-between group transition-colors"
                              >
                                <span className="font-semibold">{hosp.name}</span>
                                <span className="text-[8px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                                  Select
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

            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Clinical Specialty</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-slate-900"
              >
                <option value="">All Specialties</option>
                {specialties.map(spec => (
                  <option key={spec.name} value={spec.name}>{spec.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Max Radius</label>
                <span className="text-[10px] text-primary font-extrabold">{radius} km</span>
              </div>
              <input
                type="range"
                min="2"
                max="40"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-slate-900"
              >
                <option value="distance">Nearest First</option>
                <option value="match">Best Match</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEmergencyOnly(!emergencyOnly)}
                className={`py-3 px-3 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  emergencyOnly 
                    ? 'bg-danger/10 border-danger/30 text-danger shadow-md shadow-danger/5' 
                    : 'border-pulseBorder dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                24/7 ER Room
              </button>
              
              <button
                type="submit"
                className="py-3 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-[11px] font-bold shadow-md shadow-primary/25 transition-all flex items-center justify-center gap-1.5"
              >
                <SearchIcon className="w-3.5 h-3.5" />
                Search
              </button>
            </div>
          </form>

          {/* Main Map + List workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Hospital List */}
            <div className="lg:col-span-5 space-y-4 max-h-[600px] overflow-y-auto pr-2 text-left">
              {/* Active Specialty Filter Header */}
              {specialty && (
                <div className="glass-panel border border-primary/20 bg-primary/5 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top duration-300">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      🔍 Active Filter: <span className="text-primary font-extrabold">{specialty}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSpecialty('');
                      navigate('/search');
                    }}
                    className="text-[10px] font-bold bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl transition-all border border-pulseBorder dark:border-slate-700"
                    title="Clear filter"
                  >
                    Clear (X)
                  </button>
                </div>
              )}
              
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="glass-panel rounded-2xl p-5 border border-pulseBorder dark:border-slate-700 h-32 animate-pulse flex flex-col justify-between">
                      <div className="w-[50%] h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="w-[80%] h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="w-[30%] h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                  ))}
                </div>
              ) : hospitals.length === 0 ? (
                <div className="glass-panel rounded-2xl p-8 border border-amber-200/50 dark:border-amber-900/30 bg-amber-500/5 dark:bg-amber-950/10 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-normal">
                      Pulse is currently optimizing coverage for this region.
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                      Full specialty features are active in Delhi, Mumbai, and Bangalore.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all mx-auto"
                  >
                    Change Search Location
                  </button>
                </div>
              ) : (
                hospitals.map((hosp) => {
                  const isSelected = hosp.id === selectedHospitalId;
                  const isSaved = savedIds.includes(hosp.id);
                  const isComparing = compareIds.includes(hosp.id);

                  return (
                    <div
                      key={hosp.id}
                      onClick={() => handleSelectHospital(hosp.id)}
                      className={`glass-panel rounded-2xl p-5 border transition-all duration-300 cursor-pointer flex flex-col justify-between relative ${
                        isSelected 
                          ? 'border-primary bg-primary/[0.05] shadow-lg shadow-primary/10' 
                          : 'border-pulseBorder dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      <div className="space-y-3">
                        {hosp.photoUrl && (
                          <div className="w-full h-32 rounded-xl overflow-hidden mb-3">
                            <img src={hosp.photoUrl} alt={hosp.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{hosp.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 leading-none">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                              {hosp.address}
                            </p>
                            {hosp.phone ? (
                              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1.5 leading-none">
                                <Phone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                <a href={getDialerHref(hosp.phone, hosp.address)} className="hover:text-primary transition-colors">
                                  {formatIndianPhoneNumber(hosp.phone, hosp.address)}
                                </a>
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1.5 leading-none">
                                <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                <a 
                                  href={`https://www.google.com/search?q=phone+number+for+${encodeURIComponent(hosp.name)}+${encodeURIComponent(hosp.address)}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline transition-colors font-semibold flex items-center gap-0.5"
                                >
                                  Search number on Google
                                  <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                                </a>
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Bookmark Button */}
                            <button
                              onClick={(e) => handleToggleSave(hosp.id, e)}
                              className={`p-2 rounded-lg border transition-all ${
                                isSaved 
                                  ? 'border-danger/30 bg-danger/10 text-danger' 
                                  : 'border-pulseBorder dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                              title={isSaved ? "Remove from Bookmarks" : "Save Hospital"}
                            >
                              <Heart className={`w-4 h-4 ${isSaved ? 'fill-danger' : ''}`} />
                            </button>
                            
                            {/* Compare Button */}
                            <button
                              onClick={(e) => handleToggleCompare(hosp.id, e)}
                              className={`p-2 rounded-lg border transition-all ${
                                isComparing 
                                  ? 'border-primary bg-primary/20 text-primary' 
                                  : 'border-pulseBorder dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                              title="Add to Compare Panel"
                            >
                              {isComparing ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-semibold">
                          <span className="flex items-center gap-1 text-warning">
                            <Star className="w-4 h-4 fill-warning text-warning" />
                            {hosp.rating.toFixed(1)}
                          </span>

                          {hosp.emergencyAvailable && (
                            <span className="text-[10px] bg-danger/15 border border-danger/25 text-danger px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              24/7 ER Ready
                            </span>
                          )}

                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-pulseBorder dark:border-slate-600 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                            Score: {hosp.recommendationScore}%
                          </span>
                        </div>

                        {/* Recommendation score breakdown snippet */}
                        {hosp.explanation && (
                          <div className="p-2.5 bg-primary/10 border border-primary/15 rounded-xl text-[10px] text-slate-600 leading-normal">
                            <strong>💡 Match Reason:</strong> {hosp.explanation}
                          </div>
                        )}

                        {/* Active Specialty OPD Hours & INR Fees */}
                        {specialty && (() => {
                          const matchedSpec = hosp.specialties?.find(
                            (s) => s.specialty.name.toLowerCase() === specialty.toLowerCase()
                          );
                          if (!matchedSpec) return null;
                          return (
                            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-xl text-[10px] leading-normal font-semibold space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-500 dark:text-slate-400 font-semibold">Consulting Hours</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {(!matchedSpec.opdTimings || matchedSpec.opdTimings.includes('09:00 AM - 05:00 PM') || matchedSpec.opdTimings.includes('09:00 AM - 09:00 PM')) 
                                    ? 'Contact Facility' 
                                    : matchedSpec.opdTimings}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-500 dark:text-slate-400 font-semibold">Avg. Consultation Fee</span>
                                <span className="font-extrabold text-slate-900 dark:text-white">
                                  {matchedSpec.averageCost > 0 
                                    ? `₹${matchedSpec.averageCost}` 
                                    : 'Contact Hospital'}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-pulseBorder dark:border-slate-700 mt-4">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Open: {hosp.workingHours}</span>
                        <button
                          onClick={() => navigate(`/hospitals/${hosp.id}`)}
                          className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                        >
                          Full Departments
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Side: Leaflet Map */}
            <div className="lg:col-span-7 h-[600px] rounded-2xl overflow-hidden shadow-2xl relative border border-pulseBorder dark:border-slate-700">
              <Map
                hospitals={hospitals.map(h => ({
                  id: h.id,
                  name: h.name,
                  latitude: h.latitude,
                  longitude: h.longitude,
                  rating: h.rating,
                  recommendationScore: h.recommendationScore
                }))}
                selectedHospitalId={selectedHospitalId}
                onSelectHospital={handleSelectHospital}
                onViewDetails={(id) => navigate(`/hospitals/${id}`)}
                userLat={lat!}
                userLng={lng!}
              />
            </div>
          </div>

          {/* Floating comparison dock at the bottom */}
          {compareIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-lg px-4 animate-slide-up">
              <div className="glass-panel border border-primary/30 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                    <Layers className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Compare Panel Active</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{compareIds.length} hospital{compareIds.length > 1 ? 's' : ''} selected (Max 3)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCompareIds([])}
                    className="px-3 py-2 rounded-xl text-[10px] text-slate-500 hover:text-slate-900 font-bold"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => navigate(`/compare?ids=${compareIds.join(',')}`)}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-[10px] font-bold rounded-xl flex items-center gap-1 shadow-md shadow-primary/25 transition-all"
                  >
                    Compare Side-by-Side
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center max-w-xl mx-auto my-8 space-y-6 shadow-xl shadow-slate-100 dark:shadow-black/20 animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <MapPin className="w-8 h-8" />
          </div>
          <div className="space-y-2 text-center">
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

      <LocationModal 
        isOpen={isLocationModalOpen} 
        onClose={() => setIsLocationModalOpen(false)} 
      />
    </div>
  );
};
