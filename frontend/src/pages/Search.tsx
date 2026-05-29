import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hospitalAPI, Hospital } from '../services/api';
import { Map } from '../components/Map';
import { 
  Search as SearchIcon, MapPin, Star, AlertCircle, Heart, 
  Activity, ArrowRight, ShieldCheck, HelpCircle, Layers, CheckSquare, Square
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Search: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Search parameters state
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [radius, setRadius] = useState(15); // max distance in km
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  // Map user coordinates
  const [lat, setLat] = useState(28.6139);
  const [lng, setLng] = useState(77.2090);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | undefined>(undefined);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  
  // Hospital comparison tracking state
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Sample specialties list
  const specialties = [
    { name: 'Cardiology', label: '🫀 Cardiology' },
    { name: 'Endocrinology', label: '🦋 Endocrinology' },
    { name: 'Hematology', label: '🩸 Hematology' },
    { name: 'Neurology', label: '🧠 Neurology' },
    { name: 'Pediatrics', label: '👶 Pediatrics' },
    { name: 'General Medicine', label: '🏥 General Medicine' }
  ];

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const data = await hospitalAPI.search(query, specialty, radius, lat, lng);
      // Client-side emergency filter if checked
      const filtered = emergencyOnly ? data.filter(h => h.emergencyAvailable) : data;
      setHospitals(filtered);
      
      // Auto highlight first search match if available
      if (filtered.length > 0) {
        setSelectedHospitalId(filtered[0].id);
      }
    } catch (err) {
      console.error('Failed fetching hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSaved = async () => {
    if (!user) return;
    try {
      const saved = await hospitalAPI.getSaved();
      setSavedIds(saved.map(h => h.id));
    } catch (err) {
      console.error(err);
    }
  };

  // Run initial searches
  useEffect(() => {
    fetchHospitals();
    fetchSaved();
  }, [specialty, radius, emergencyOnly]);

  // Request browser geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        (err) => console.log('Geolocation disabled, falling back to Delhi coordinates.')
      );
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHospitals();
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
        alert('You can select a maximum of 3 hospitals to compare at once.');
        return prev;
      }
      return [...prev, id];
    });
  };

  return (
    <div className="space-y-8 pb-20 relative">
      <div className="text-left space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Activity className="text-primary w-8 h-8 animate-pulse" />
          Healthcare Navigation & Hospital Discovery
        </h1>
        <p className="text-xs text-slate-400">Discover hospitals matching your specialty need, distance parameters, and emergency situations.</p>
      </div>

      {/* Filters Segment */}
      <form onSubmit={handleSearchSubmit} className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/5 grid grid-cols-1 md:grid-cols-12 gap-4 items-end text-left bg-white/[0.01]">
        <div className="md:col-span-4 space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital Name / Keywords</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <SearchIcon className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search e.g. Apollo, Metro, City..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs text-white"
            />
          </div>
        </div>

        <div className="md:col-span-3 space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinical Specialty</label>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-white"
          >
            <option value="">All Specialties</option>
            {specialties.map(spec => (
              <option key={spec.name} value={spec.name}>{spec.label}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Radius</label>
            <span className="text-[10px] text-primary font-extrabold">{radius} km</span>
          </div>
          <input
            type="range"
            min="2"
            max="40"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-full accent-primary h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="md:col-span-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setEmergencyOnly(!emergencyOnly)}
            className={`py-3 px-3 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              emergencyOnly 
                ? 'bg-danger/10 border-danger/30 text-danger shadow-md shadow-danger/5' 
                : 'border-white/5 bg-white/5 text-slate-400 hover:text-white'
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
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="glass-panel rounded-2xl p-5 border border-white/5 h-32 animate-pulse flex flex-col justify-between">
                  <div className="w-[50%] h-4 bg-slate-800 rounded" />
                  <div className="w-[80%] h-3 bg-slate-800 rounded" />
                  <div className="w-[30%] h-3 bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : hospitals.length === 0 ? (
            <div className="glass-panel rounded-2xl p-10 border border-white/5 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-500 mb-3 animate-bounce" />
              <p className="text-sm font-semibold">No clinics located in this range.</p>
              <p className="text-xs text-slate-500 mt-1">Try broadening your radius slider or clearing the specialty dropdown.</p>
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
                      ? 'border-primary bg-primary/[0.02] shadow-lg shadow-primary/10' 
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-white text-base leading-snug">{hosp.name}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 leading-none">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {hosp.address}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Bookmark Button */}
                        <button
                          onClick={(e) => handleToggleSave(hosp.id, e)}
                          className={`p-2 rounded-lg border transition-all ${
                            isSaved 
                              ? 'border-danger/30 bg-danger/10 text-danger' 
                              : 'border-white/5 bg-white/5 text-slate-400 hover:text-white'
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
                              : 'border-white/5 bg-white/5 text-slate-400 hover:text-white'
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

                      <span className="text-[10px] bg-slate-800 border border-white/5 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                        Score: {hosp.recommendationScore}%
                      </span>
                    </div>

                    {/* Recommendation score breakdown snippet */}
                    {hosp.explanation && (
                      <div className="p-2.5 bg-primary/10 border border-primary/15 rounded-xl text-[10px] text-slate-300 leading-normal">
                        <strong>💡 Match Reason:</strong> {hosp.explanation}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Open: {hosp.workingHours}</span>
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
        <div className="lg:col-span-7 h-[600px] rounded-2xl overflow-hidden shadow-2xl relative border border-white/5">
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
            userLat={lat}
            userLng={lng}
          />
        </div>
      </div>

      {/* Floating comparison dock at the bottom */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-lg px-4 animate-slide-up">
          <div className="glass-panel border border-primary/30 bg-[#0B0F19]/90 backdrop-blur-xl p-4 rounded-2xl flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                <Layers className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Compare Panel Active</span>
                <span className="text-[10px] text-slate-400">{compareIds.length} hospital{compareIds.length > 1 ? 's' : ''} selected (Max 3)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCompareIds([])}
                className="px-3 py-2 rounded-xl text-[10px] text-slate-400 hover:text-white font-bold"
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
    </div>
  );
};
