// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Star, Bookmark, ExternalLink, Phone, Sparkles,
  X, CheckSquare, Map, SlidersHorizontal, Loader2, Activity,
  Stethoscope, TestTube, Syringe, Bone, Heart, Eye, Baby, Ear
} from 'lucide-react';
import { PulseNav } from './PulseNav';
import { useUserLocation } from '@core/context/LocationContext';
import { hospitalAPI } from '@core/services/api';
import toast from 'react-hot-toast';

interface DiscoverScreenProps {
  activeScreen?: string;
}

// Service chips — uses q= so backend intentMapper resolves to correct specialty
const SERVICE_CHIPS = [
  { label: 'Blood Test', q: 'blood test', icon: TestTube },
  { label: 'Vaccination', q: 'vaccination', icon: Syringe },
  { label: 'Dental', specialty: 'Dental', icon: Bone },
  { label: 'Cardiology', specialty: 'Cardiology', icon: Heart },
  { label: 'Eye Care', specialty: 'Eye Care', icon: Eye },
  { label: 'Pediatrics', specialty: 'Pediatrics', icon: Baby },
  { label: 'General', specialty: 'General Medicine', icon: Stethoscope },
];

export function DiscoverScreen({ activeScreen }: DiscoverScreenProps) {
  const navigate = useNavigate();
  const { lat, lng, label: cityName } = useUserLocation() as any;

  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [radius, setRadius] = useState(15);
  const [hasER, setHasER] = useState(false);
  const [sortBy, setSortBy] = useState('distance');
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Autocomplete state
  const [autocompleteResults, setAutocompleteResults] = useState<{ hospitals: any[]; specialties: any[] }>({ hospitals: [], specialties: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const searchHospitals = async (overrideQuery?: string, overrideSpecialty?: string) => {
    if (!lat || !lng) {
      toast.error('Location not available. Please enable location.');
      return;
    }
    setLoading(true);
    setShowDropdown(false);
    try {
      const q = overrideQuery !== undefined ? overrideQuery : query;
      const spec = overrideSpecialty !== undefined ? overrideSpecialty : specialty;
      const data = await hospitalAPI.search(q, spec, radius, lat, lng, cityName);
      let filtered = hasER ? data.filter((h: any) => h.emergencyAvailable) : data;
      if (sortBy === 'rating') filtered = filtered.sort((a: any, b: any) => b.rating - a.rating);
      else if (sortBy === 'distance') filtered = filtered.sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
      else filtered = filtered.sort((a: any, b: any) => b.recommendationScore - a.recommendationScore);
      setHospitals(filtered);
    } catch (err: any) {
      toast.error('Failed to search hospitals');
    } finally {
      setLoading(false);
    }
  };

  // Auto-search on mount when location is ready
  useEffect(() => {
    if (lat && lng) searchHospitals();
  }, [lat, lng]);

  // Autocomplete — debounced 300ms
  useEffect(() => {
    if (query.trim().length < 2) {
      setAutocompleteResults({ hospitals: [], specialties: [] });
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setAutocompleteLoading(true);
      try {
        const data = await hospitalAPI.autocomplete(query, lat, lng, cityName);
        setAutocompleteResults(data);
        setShowDropdown(true);
      } catch {
        // silent
      } finally {
        setAutocompleteLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, lat, lng, cityName]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchHospitals();
  };

  const handleChipPress = (chip: typeof SERVICE_CHIPS[0]) => {
    if ('q' in chip) {
      setQuery(chip.q as string);
      setSpecialty('');
      searchHospitals(chip.q as string, '');
    } else {
      setQuery('');
      setSpecialty(chip.specialty as string);
      searchHospitals('', chip.specialty as string);
    }
  };

  const toggleSave = async (id: string) => {
    try {
      if (savedIds.includes(id)) {
        setSavedIds(prev => prev.filter(s => s !== id));
        await hospitalAPI.unsave(id);
      } else {
        setSavedIds(prev => [...prev, id]);
        await hospitalAPI.save(id);
      }
    } catch {
      toast.error('Failed to update saved hospitals');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0F19]">
      <PulseNav variant="app" activeScreen="discover" onNavigate={(id: string) => navigate(`/${id}`)} />

      <main className="flex-1 overflow-y-auto pb-28">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <h1 className="text-xl font-bold text-white">Find Hospitals</h1>
          <p className="text-xs text-slate-400 mt-1">Discover healthcare providers near you</p>
        </div>

        {/* Location Bar */}
        <div className="px-4 mb-3">
          <div className="flex items-center gap-3 bg-[#111827] border border-slate-800/60 rounded-xl px-4 py-3">
            <MapPin className="w-4 h-4 text-[#1E60D5] shrink-0" />
            <span className="text-sm text-slate-400 flex-1">
              <strong className="text-white">{cityName || 'Locating...'}</strong>
            </span>
          </div>
        </div>

        {/* Search Bar with Autocomplete */}
        <div ref={searchContainerRef} className="px-4 mb-3 relative">
          <form onSubmit={handleSearch}>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2.5 bg-[#111827] border border-slate-800/60 rounded-xl px-4 h-12">
                <Search className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => { if (query.trim().length >= 2) setShowDropdown(true); }}
                  placeholder="Search hospital, symptom, specialty..."
                  className="flex-1 text-sm bg-transparent outline-none text-white placeholder:text-slate-500"
                />
                {query.length > 0 && (
                  <button type="button" onClick={() => { setQuery(''); setShowDropdown(false); }}>
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="h-12 px-5 bg-[#1E60D5] text-white font-semibold rounded-xl active:scale-95 transition-transform"
              >
                Search
              </button>
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {showDropdown && query.trim().length >= 2 && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-[#111827] border border-slate-700/60 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto">
              {autocompleteLoading ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Activity className="w-4 h-4 animate-spin text-[#1E60D5]" />
                  <span className="text-xs text-slate-400">Searching...</span>
                </div>
              ) : autocompleteResults.hospitals.length === 0 && autocompleteResults.specialties.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-4">No matches found</p>
              ) : (
                <div className="p-2 space-y-1">
                  {autocompleteResults.specialties.length > 0 && (
                    <>
                      <p className="text-[9px] font-bold text-[#1E60D5] uppercase tracking-widest px-2 pt-1">🩺 Services</p>
                      {autocompleteResults.specialties.map((s) => (
                        <button
                          key={s.name}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-700/50 flex items-center justify-between"
                          onClick={() => { setSpecialty(s.name); setQuery(''); setShowDropdown(false); searchHospitals('', s.name); }}
                        >
                          <span className="font-semibold">{s.name}</span>
                          <span className="text-[9px] bg-[#1E60D5]/20 text-[#1E60D5] px-2 py-0.5 rounded-full">Filter</span>
                        </button>
                      ))}
                    </>
                  )}
                  {autocompleteResults.hospitals.length > 0 && (
                    <>
                      <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest px-2 pt-2">🏥 Hospitals</p>
                      {autocompleteResults.hospitals.map((h) => (
                        <button
                          key={h.id}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-700/50 flex items-center justify-between"
                          onClick={() => { setQuery(h.name); setShowDropdown(false); searchHospitals(h.name, ''); }}
                        >
                          <span className="font-semibold">{h.name}</span>
                          <span className="text-[9px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">Select</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Browse by Service Chips */}
        <div className="px-4 mb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SERVICE_CHIPS.map((chip) => {
              const Icon = chip.icon;
              const isActive = ('specialty' in chip && specialty === chip.specialty) || ('q' in chip && query === chip.q);
              return (
                <button
                  key={chip.label}
                  onClick={() => handleChipPress(chip)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    isActive
                      ? 'border-[#1E60D5] bg-[#1E60D5]/15 text-[#1E60D5]'
                      : 'border-slate-700/60 bg-[#111827] text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="px-4 mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#111827] border border-slate-800/60 rounded-xl text-sm font-medium text-slate-300"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {(specialty || hasER) && <span className="w-2 h-2 rounded-full bg-[#1E60D5]" />}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mx-4 mb-3 p-4 bg-[#111827] border border-slate-800/60 rounded-xl space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Specialty</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none"
              >
                <option value="">All Specialties</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Neurology">Neurology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Gynecology">Gynecology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="ENT">ENT</option>
                <option value="Dental">Dental</option>
                <option value="Eye Care">Eye Care</option>
                <option value="Gastroenterology">Gastroenterology</option>
                <option value="Pulmonology">Pulmonology</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Emergency Medicine">Emergency Medicine</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Radius</label>
                <span className="text-xs font-bold text-[#1E60D5]">{radius} km</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-[#1E60D5]"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHasER(!hasER)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                  hasER ? 'border-[#1E60D5] bg-[#1E60D5]/15 text-[#1E60D5]' : 'border-slate-700 text-slate-400'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                24/7 ER
              </button>
              <button
                type="button"
                onClick={() => { setShowFilters(false); searchHospitals(); }}
                className="flex-1 h-10 bg-[#1E60D5] text-white font-semibold rounded-xl active:scale-95 transition-transform"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="px-4 flex flex-col gap-3 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              {loading ? 'Searching...' : `${hospitals.length} Result${hospitals.length !== 1 ? 's' : ''}`}
            </h3>
            {specialty && (
              <button
                onClick={() => { setSpecialty(''); searchHospitals('', ''); }}
                className="text-[10px] text-[#1E60D5] font-bold flex items-center gap-1"
              >
                Clear filter <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#1E60D5] animate-spin" />
              <p className="text-sm text-slate-400">Finding hospitals near you...</p>
            </div>
          ) : hospitals.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No hospitals found. Try adjusting your search or increasing the radius.
            </div>
          ) : (
            hospitals.map((hospital) => (
              <div key={hospital.id} className="bg-[#111827] rounded-2xl border border-slate-800/60 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 pr-2">
                      <h4 className="font-bold text-white text-base leading-tight">{hospital.name}</h4>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-400">{hospital.address}</span>
                      </div>
                      {hospital.phone && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span className="text-xs text-slate-400">{hospital.phone}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleSave(hospital.id)}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                        savedIds.includes(hospital.id) ? 'bg-[#1E60D5]/20 border-[#1E60D5]/30' : 'border-slate-700 bg-[#0B0F19]'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${savedIds.includes(hospital.id) ? 'text-[#1E60D5] fill-[#1E60D5]' : 'text-slate-500'}`} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {hospital.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold text-white">{hospital.rating?.toFixed(1)}</span>
                      </div>
                    )}
                    {hospital.recommendationScore && (
                      <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full">
                        Score: {hospital.recommendationScore}%
                      </span>
                    )}
                    {hospital.emergencyAvailable && (
                      <span className="text-[10px] bg-red-500/15 border border-red-500/25 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase">
                        24/7 ER
                      </span>
                    )}
                    {hospital.distance && (
                      <span className="text-[10px] text-slate-500 font-medium ml-auto">
                        {hospital.distance.toFixed(1)} km
                      </span>
                    )}
                  </div>

                  {hospital.explanation && (
                    <div className="mt-2.5 bg-[#1E60D5]/10 rounded-xl p-3 border border-[#1E60D5]/15">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#1E60D5] shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-300 leading-relaxed">{hospital.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/40 bg-[#0B0F19]/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {hospital.workingHours || 'Hours N/A'}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/hospitals/${hospital.id}`)}
                    className="flex items-center gap-1 text-xs font-bold text-[#1E60D5]"
                  >
                    Details <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
