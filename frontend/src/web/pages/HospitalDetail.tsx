import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { hospitalAPI, Hospital } from '@core/services/api';
import { useUserLocation } from '@core/context/LocationContext';
import { 
  ArrowLeft, MapPin, Phone, Globe, Clock, Star, 
  AlertCircle, Heart, User, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';
import { formatIndianPhoneNumber, getDialerHref } from '@core/utils/phoneFormatter';
import { getHospitalLocality } from '@core/utils/utils';
import toast from 'react-hot-toast';

export const HospitalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const specParam = searchParams.get('specialty') || undefined;
  
  const { latitude: lat, longitude: lng } = useUserLocation();
  
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);

  const fetchDetails = async (userLat = lat, userLng = lng) => {
    if (!id) return;
    setLoading(true);
    try {
      const [hospitalData, reviewsData] = await Promise.all([
        hospitalAPI.getById(id, userLat || undefined, userLng || undefined, specParam),
        hospitalAPI.getReviews(id)
      ]);
      setHospital(hospitalData);
      setReviews(reviewsData.reviews);
      setTotalReviews(reviewsData.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails(lat || undefined, lng || undefined);
  }, [id, lat, lng]);

  useEffect(() => {
    if (hospital) {
      document.title = `${hospital.name} | Pulse`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', `${hospital.name} in ${hospital.address}. View specialties, emergency availability, and contact information.`);
    }
  }, [hospital]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || !id) return;
    
    if (!user) {
      toast.error("Please sign in to submit a review.");
      return;
    }

    if (reviewText.trim().length < 10) {
      toast.error("Your review must be at least 10 characters long.");
      return;
    }
    
    setSubmittingReview(true);
    try {
      const newRev = await hospitalAPI.postReview(id, reviewRating, reviewText);
      setReviews(prev => [newRev, ...prev]);
      setTotalReviews(prev => prev + 1);
      setReviewText('');
      setReviewRating(5);
      
      toast.success("Review submitted successfully!");
      fetchDetails();
    } catch (err: any) {
      const validationMessage = err.response?.data?.errors
        ? err.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join('\n')
        : null;
      toast.error(validationMessage || err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-12 animate-pulse text-left">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
        <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="rounded-2xl p-10 text-center max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800">
        <AlertCircle className="w-12 h-12 text-pulseRed mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Hospital not found</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">The hospital listing does not exist or has been removed.</p>
        <Link to="/search" className="mt-5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold inline-block hover:bg-primary-hover transition-colors">
          Back to hospital search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 text-left px-4 sm:px-6">
      <Link to="/search" className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4" />
        Back to hospital list
      </Link>

      {/* Hospital Hero Card */}
      <div className="rounded-2xl p-6 sm:p-8 border border-pulseBorder dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {hospital.name}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-[#1A3BAA] shrink-0 mt-0.5" />
              <span>
                {getHospitalLocality(hospital.address) && getHospitalLocality(hospital.address) !== hospital.address ? (
                  <>
                    <strong className="text-slate-900 dark:text-white font-semibold">{getHospitalLocality(hospital.address)}</strong> — {hospital.address}
                  </>
                ) : (
                  hospital.address
                )}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/compare?add=${hospital.id}`}
              className="px-4 py-2 border border-pulseBorder dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Compare hospital
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 text-sm font-semibold">
          {hospital.rating > 0 && totalReviews > 0 ? (
            <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-sm font-semibold">
              <Star className="w-4 h-4 fill-[#B45309] text-[#B45309]" />
              <span>Google rating {hospital.rating.toFixed(1)} ({totalReviews} reviews)</span>
            </span>
          ) : null}

          {hospital.emergencyAvailable && (
            <span className="bg-emerald-50 text-[#12805C] border border-[#12805C]/30 dark:bg-emerald-950/40 dark:border-emerald-900 px-3 py-1.5 rounded-lg text-sm font-semibold">
              24×7 emergency care
            </span>
          )}

          {hospital.distance ? (
            <span className="bg-[#EEF2FC] text-[#1A3BAA] border border-[#1A3BAA]/20 px-3 py-1.5 rounded-lg text-sm font-medium">
              {hospital.distance.toFixed(1)} km from your location
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left column: Specialties & Reviews */}
        <div className="md:col-span-8 space-y-6">
          {/* Specialties */}
          <div className="rounded-2xl p-6 sm:p-8 border border-pulseBorder dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-pulseBorder dark:border-slate-800 pb-3">
              Departments and specialties
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hospital.specialties?.map((spec, index) => (
                <div key={index} className="p-4 bg-surface dark:bg-slate-800 border border-pulseBorder dark:border-slate-700 rounded-xl space-y-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    {spec.specialty.name}
                  </span>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {spec.specialty.description}
                  </p>
                  {spec.averageCost > 0 && (
                    <div className="pt-2 border-t border-pulseBorder dark:border-slate-700 flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                      <span>Consultation fee</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ₹{spec.averageCost}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reviews section - "Patient" word banned */}
          <div className="rounded-2xl p-6 sm:p-8 border border-pulseBorder dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-pulseBorder dark:border-slate-800 pb-3">
              {totalReviews > 0 ? `Hospital reviews (${totalReviews})` : 'Hospital reviews'}
            </h2>

            {/* Compose Review form */}
            <form onSubmit={handleAddReview} className="space-y-4 bg-surface dark:bg-slate-800 border border-pulseBorder dark:border-slate-700 p-4 rounded-xl">
              <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                Leave a review for this hospital
              </span>
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-400">Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setReviewRating(num)}
                      className="p-1 rounded transition-colors"
                      aria-label={`Rate ${num} star`}
                    >
                      <Star className={`w-5 h-5 ${num <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share details of your experience (care quality, waiting time, staff cleanliness)..."
                rows={3}
                required
                className="w-full bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              />
              <p className="text-sm text-slate-500">Reviews help other people make informed healthcare decisions.</p>

              <button
                type="submit"
                disabled={submittingReview}
                className="px-4 py-2 bg-[#1A3BAA] hover:bg-[#142E86] text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
              >
                {submittingReview ? 'Submitting...' : 'Submit review'}
              </button>
            </form>

            <div className="space-y-3">
              {reviews.length === 0 ? (
                <p className="text-sm text-slate-500 py-2">No reviews yet. Be the first to share your experience with this hospital.</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-4 border border-pulseBorder dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#EEF2FC] text-[#1A3BAA] flex items-center justify-center text-sm font-bold">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{rev.user.name}</span>
                      </div>
                      <span className="text-sm text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} className={`w-4 h-4 ${n <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{rev.reviewText}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: Contact & Facility Verification */}
        <div className="md:col-span-4 space-y-6">
          <div className="rounded-2xl p-6 border border-pulseBorder dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hospital contact
            </h3>
            
            <div className="space-y-4 text-sm font-medium">
              {hospital.workingHours && !hospital.workingHours.toLowerCase().includes('contact facility') && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#1A3BAA] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm text-slate-500 font-semibold block">Visiting and OPD hours</span>
                    <span className="text-sm text-slate-900 dark:text-white mt-1 block">{hospital.workingHours}</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#1A3BAA] shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm text-slate-500 font-semibold block">Telephone</span>
                  {hospital.phone ? (
                    <div>
                      <a href={getDialerHref(hospital.phone, hospital.address)} className="text-base text-[#1A3BAA] hover:underline mt-1 block font-bold">
                        {formatIndianPhoneNumber(hospital.phone, hospital.address)}
                      </a>
                      <p className="text-sm text-slate-500 mt-1">Call the hospital to confirm before visiting.</p>
                    </div>
                  ) : (
                    <a 
                      href={`https://www.google.com/search?q=phone+number+for+${encodeURIComponent(hospital.name)}+${encodeURIComponent(hospital.address)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#1A3BAA] hover:underline mt-1 block font-semibold flex items-center gap-1"
                    >
                      <span>Search helpline on Google</span>
                      <Globe className="w-4 h-4 text-slate-400" />
                    </a>
                  )}
                </div>
              </div>

              {hospital.website && (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-[#1A3BAA] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm text-slate-500 font-semibold block">Website</span>
                    <a href={`https://${hospital.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#1A3BAA] hover:underline mt-1 block break-all">
                      {hospital.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Honest Listing Guarantee */}
          <div className="rounded-2xl p-6 border border-pulseBorder dark:border-slate-800 bg-surface dark:bg-slate-900 space-y-3">
            <div className="flex items-center gap-2 text-[#1A3BAA] font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Unbiased listing</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              This hospital profile is compiled from public directory information. Pulse does not accept payment to alter rankings or promote specific hospitals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDetail;
