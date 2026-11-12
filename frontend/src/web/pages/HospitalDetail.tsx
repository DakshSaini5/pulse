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
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{hospital.address}</span>
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

        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold">
          <span className="flex items-center gap-1 text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{hospital.rating.toFixed(1)} / 5.0</span>
            <span className="text-slate-400 font-normal">({totalReviews} reviews)</span>
          </span>

          {hospital.emergencyAvailable && (
            <span className="bg-red-50 text-pulseRed border border-red-200 dark:bg-red-950/40 dark:border-red-900 px-3 py-1.5 rounded-lg font-bold">
              24/7 Emergency Care Available
            </span>
          )}

          {hospital.distance && (
            <span className="bg-pulseTint text-primary px-3 py-1.5 rounded-lg">
              {hospital.distance.toFixed(1)} km from your location
            </span>
          )}

          <span className="text-slate-500 font-normal ml-auto">
            Verified listing • Updated July 2026
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left column: Specialties & Reviews */}
        <div className="md:col-span-8 space-y-6">
          {/* Specialties */}
          <div className="rounded-2xl p-6 sm:p-8 border border-pulseBorder dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-pulseBorder dark:border-slate-800 pb-3">
              Departments &amp; Specialties
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hospital.specialties?.map((spec, index) => (
                <div key={index} className="p-4 bg-surface dark:bg-slate-800 border border-pulseBorder dark:border-slate-700 rounded-xl space-y-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    {spec.specialty.name}
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {spec.specialty.description}
                  </p>
                  <div className="pt-2 border-t border-pulseBorder dark:border-slate-700 flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                    <span>Consultation fee</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {spec.averageCost > 0 ? `₹${spec.averageCost}` : 'Contact hospital'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews section */}
          <div className="rounded-2xl p-6 sm:p-8 border border-pulseBorder dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-pulseBorder dark:border-slate-800 pb-3">
              Patient Reviews ({totalReviews})
            </h2>

            {/* Compose Review form */}
            <form onSubmit={handleAddReview} className="space-y-4 bg-surface dark:bg-slate-800 border border-pulseBorder dark:border-slate-700 p-4 rounded-xl">
              <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                Leave a review for this hospital
              </span>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-600 dark:text-slate-400">Rating:</span>
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
              <p className="text-xs text-slate-500">Reviews help other patients make informed healthcare decisions.</p>

              <button
                type="submit"
                disabled={submittingReview}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors"
              >
                {submittingReview ? 'Submitting...' : 'Submit review'}
              </button>
            </form>

            <div className="space-y-3">
              {reviews.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">No reviews yet. Be the first to review this hospital.</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-4 border border-pulseBorder dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-pulseTint text-primary flex items-center justify-center text-xs font-bold">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{rev.user.name}</span>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} className={`w-3.5 h-3.5 ${n <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
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
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Hospital Contact
            </h3>
            
            <div className="space-y-4 text-xs font-medium">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Visiting &amp; OPD Hours</span>
                  <span className="text-sm text-slate-900 dark:text-white mt-1 block">{hospital.workingHours}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold block">Telephone</span>
                  {hospital.phone ? (
                    <div>
                      <a href={getDialerHref(hospital.phone, hospital.address)} className="text-base text-primary hover:underline mt-1 block font-bold">
                        {formatIndianPhoneNumber(hospital.phone, hospital.address)}
                      </a>
                      <p className="text-xs text-slate-500 mt-1">Call the hospital to confirm before visiting.</p>
                    </div>
                  ) : (
                    <a 
                      href={`https://www.google.com/search?q=phone+number+for+${encodeURIComponent(hospital.name)}+${encodeURIComponent(hospital.address)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline mt-1 block font-semibold flex items-center gap-1"
                    >
                      Search helpline on Google
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  )}
                </div>
              </div>

              {hospital.website && (
                <div className="flex items-start gap-3">
                  <Globe className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-semibold block">Website</span>
                    <a href={`https://${hospital.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-1 block break-all">
                      {hospital.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Honest Listing Guarantee */}
          <div className="rounded-2xl p-6 border border-pulseBorder dark:border-slate-800 bg-surface dark:bg-slate-900 space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Unbiased Listing</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This hospital profile is compiled from public directory information and verified facilities. Pulse does not accept payment to alter rankings or promote specific hospitals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDetail;
