// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Star, Bookmark, ExternalLink, Phone, Sparkles,
  X, CheckSquare, Map, SlidersHorizontal, Loader2
} from 'lucide-react';
import { PulseNav } from './PulseNav';
import { useUserLocation } from '@core/context/LocationContext';
import axios from 'axios';
import toast from 'react-hot-toast';

interface DiscoverScreenProps {
  activeScreen?: string;
}

export function DiscoverScreen({ activeScreen }: DiscoverScreenProps) {
  const navigate = useNavigate();
  const { lat, lng, label: cityName } = useUserLocation();

  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [radius, setRadius] = useState(15);
  const [hasER, setHasER] = useState(false);
  const [sortBy, setSortBy] = useState('distance');
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const token = localStorage.getItem('pulse_token');
  const apiUrl = import.meta.env.VITE_API_URL;

  const searchHospitals = async () => {
    if (!lat || !lng) {
      toast.error('Location not available. Please enable location.');
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        radius: String(radius),
        sort: sortBy,
      });
      if (query) params.set('q', query);
      if (specialty) params.set('specialty', specialty);
      if (hasER) params.set('emergency', 'true');

      const res = await axios.get(`${apiUrl}/api/hospitals/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHospitals(res.data || []);
    } catch (err: any) {
      toast.error('Failed to search hospitals');
    } finally {
      setLoading(false);
    }
  };

  // Auto-search on mount
  useEffect(() => {
    if (lat && lng) searchHospitals();
  }, [lat, lng]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchHospitals();
  };

  const toggleSave = async (id: string) => {
    try {
      if (savedIds.includes(id)) {
        setSavedIds(prev => prev.filter(s => s !== id));
        await axios.delete(`${apiUrl}/api/hospitals/saved/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        setSavedIds(prev => [...prev, id]);
        await axios.post(`${apiUrl}/api/hospitals/saved`, { hospitalId: id }, { headers: { Authorization: `Bearer ${token}` } });
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

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="px-4 mb-3">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2.5 bg-[#111827] border border-slate-800/60 rounded-xl px-4 h-12">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search hospital or specialty..."
                className="flex-1 text-sm bg-transparent outline-none text-white placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              className="h-12 px-5 bg-[#1E60D5] text-white font-semibold rounded-xl active:scale-95 transition-transform"
            >
              Search
            </button>
          </div>
        </form>

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
            {/* Specialty */}
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
                <option value="General Medicine">General Medicine</option>
                <option value="Emergency Medicine">Emergency Medicine</option>
              </select>
            </div>

            {/* Radius */}
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

            {/* ER + Search */}
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
              {loading ? 'Searching...' : `${hospitals.length} Results`}
            </h3>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#1E60D5] animate-spin" />
              <p className="text-sm text-slate-400">Finding hospitals near you...</p>
            </div>
          ) : hospitals.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No hospitals found. Try adjusting your filters.
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

                  {/* Rating */}
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
                  </div>

                  {/* AI Explanation */}
                  {hospital.explanation && (
                    <div className="mt-2.5 bg-[#1E60D5]/10 rounded-xl p-3 border border-[#1E60D5]/15">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#1E60D5] shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-300 leading-relaxed">{hospital.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/40 bg-[#0B0F19]/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {hospital.workingHours || 'Hours N/A'}
                    </span>
                  </div>
                  <button className="flex items-center gap-1 text-xs font-bold text-[#1E60D5]">
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
