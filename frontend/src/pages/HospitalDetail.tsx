import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { hospitalAPI, Hospital } from '../services/api';
import { 
  ArrowLeft, MapPin, Phone, Globe, Clock, Star, 
  Activity, AlertCircle, ShieldCheck, Heart, User 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HospitalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await hospitalAPI.getById(id);
      setHospital(data);
      // Setup mock reviews for immediate visual aesthetics
      setReviews([
        { id: '1', rating: 5, reviewText: 'Exceptional cardiac staff. The emergency routing was incredibly fast.', user: { name: 'Sophia Miller' }, createdAt: '2026-05-12' },
        { id: '2', rating: 4, reviewText: 'Clean facility, friendly consultants. The pediatric queue was handled smoothly.', user: { name: 'David Chen' }, createdAt: '2026-05-18' }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    
    const newRev = {
      id: Date.now().toString(),
      rating: reviewRating,
      reviewText,
      user: { name: user?.name || 'Pulse Guest' },
      createdAt: new Date().toISOString().split('T')[0]
    };

    setReviews(prev => [newRev, ...prev]);
    setReviewText('');
    setReviewRating(5);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-12 animate-pulse text-left">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="h-64 bg-slate-800 rounded-3xl" />
        <div className="h-32 bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto my-12 border border-white/5">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">Hospital Not Found</h2>
        <p className="text-xs text-slate-400 mt-2">The hospital record does not exist or has been removed.</p>
        <Link to="/search" className="mt-6 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold inline-block">Back to Maps</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 text-left">
      <Link to="/search" className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs font-semibold">
        <ArrowLeft className="w-4 h-4" />
        Back to Discovery Maps
      </Link>

      {/* Hero card details */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/5 relative overflow-hidden bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none animate-pulse" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{hospital.name}</h1>
              <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                {hospital.address}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1 text-warning bg-warning/5 border border-warning/10 px-3 py-1 rounded-xl">
                <Star className="w-4 h-4 fill-warning text-warning" />
                {hospital.rating.toFixed(1)} / 5.0
              </span>

              {hospital.emergencyAvailable && (
                <span className="text-[10px] bg-danger/15 border border-danger/25 text-danger px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  24/7 Emergency Care Ready
                </span>
              )}

              <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full font-bold uppercase">
                Match Score: {hospital.recommendationScore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left column: specs and contact info */}
        <div className="md:col-span-8 space-y-6">
          {/* Departments list */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/5 space-y-6">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">Clinical Specialties & Departments</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hospital.specialties?.map((spec, index) => (
                <div key={index} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-primary block">{spec.specialty.name}</span>
                    <p className="text-[10px] text-slate-400 leading-normal mt-1">{spec.specialty.description}</p>
                  </div>
                  <div className="mt-4 flex justify-between items-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 pt-2 border-t border-white/5">
                    <span>Average consult cost</span>
                    <span className="text-white font-extrabold">${spec.averageCost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review List block */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/5 space-y-6">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-3">Patient Reviews ({reviews.length})</h2>

            {/* Compose Review form */}
            <form onSubmit={handleAddReview} className="space-y-4 bg-white/5 border border-white/5 p-4 rounded-2xl">
              <span className="text-xs font-semibold text-white block">Write a Clinical Review</span>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setReviewRating(num)}
                      className="p-1 rounded transition-transform hover:scale-110"
                    >
                      <Star className={`w-4 h-4 ${num <= reviewRating ? 'fill-warning text-warning' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your patient experience..."
                rows={3}
                required
                className="w-full p-3 rounded-xl glass-input text-xs text-white"
              />

              <button
                type="submit"
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md"
              >
                Submit Review
              </button>
            </form>

            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 border border-white/5 rounded-2xl bg-white/[0.01] space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center border border-white/10 text-xs font-bold text-slate-300">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-white">{rev.user.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{rev.createdAt}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={`w-3.5 h-3.5 ${n <= rev.rating ? 'fill-warning text-warning' : 'text-slate-700'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 font-light leading-relaxed">{rev.reviewText}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: contacts and metrics */}
        <div className="md:col-span-4 space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Facility Contact Details</h3>
            
            <div className="space-y-4 text-xs font-medium">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Opening Hours</span>
                  <span className="text-white mt-1 block">{hospital.workingHours}</span>
                </div>
              </div>

              {hospital.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Helpline</span>
                    <span className="text-white mt-1 block">{hospital.phone}</span>
                  </div>
                </div>
              )}

              {hospital.website && (
                <div className="flex items-start gap-3">
                  <Globe className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Official Portal</span>
                    <a href={`https://${hospital.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-1 block">
                      {hospital.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Premium Recommendation breakdown formula */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary animate-pulse" />
              Scoring Formula
            </h3>
            <p className="text-[10px] text-slate-400 leading-normal font-light">
              Our automated Healthcare Referral matching logic determines ratings based on 4 distinct criteria layers:
            </p>
            <div className="space-y-2 text-[10px] font-semibold uppercase tracking-wider">
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                <span>Specialty match (40%)</span>
                <span className="text-primary font-bold">Excellent</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                <span>Distance radius (30%)</span>
                <span className="text-primary font-bold">~12 mins away</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                <span>Patient reviews (20%)</span>
                <span className="text-primary font-bold">{hospital.rating.toFixed(1)} stars</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                <span>Emergency 24h (10%)</span>
                <span className="text-primary font-bold">{hospital.emergencyAvailable ? 'Included' : 'None'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
