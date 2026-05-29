import React, { useState, useEffect } from 'react';
import { hospitalAPI, Hospital } from '../services/api';
import { 
  Heart, MapPin, Star, AlertCircle, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export const SavedHospitals: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const data = await hospitalAPI.getSaved();
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
    fetchSaved();
  }, []);

  return (
    <div className="space-y-8 pb-16 text-left">
      <div className="text-left space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Heart className="text-danger w-8 h-8 fill-danger animate-pulse" />
          Saved Care & Favorite Hospitals
        </h1>
        <p className="text-xs text-slate-400">Manage and browse clinics or medical departments you bookmarked for later navigation.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-40 bg-slate-800 rounded-3xl" />
          <div className="h-40 bg-slate-800 rounded-3xl" />
        </div>
      ) : hospitals.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto my-12 border border-white/5">
          <Heart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">No Saved Hospitals</h2>
          <p className="text-xs text-slate-400 mt-2">Bookmarked clinics from the search map will appear here for fast routing access.</p>
          <Link to="/search" className="mt-6 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold inline-block">Explore Maps</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hospitals.map(hosp => (
            <div
              key={hosp.id}
              onClick={() => navigate(`/hospitals/${hosp.id}`)}
              className="glass-panel glass-panel-hover rounded-3xl p-6 border border-white/5 flex flex-col justify-between cursor-pointer text-left relative bg-white/[0.005]"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-extrabold text-white text-lg leading-snug">{hosp.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 leading-none">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
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
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>Working: {hosp.workingHours}</span>
                <span className="text-primary font-extrabold flex items-center gap-0.5 hover:underline">
                  Directions
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
