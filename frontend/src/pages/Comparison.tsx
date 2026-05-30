import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { hospitalAPI, Hospital } from '../services/api';
import { 
  ArrowLeft, Star, Clock, AlertCircle, ShieldCheck, 
  MapPin, HelpCircle, Phone, Globe, Layers 
} from 'lucide-react';

export const Comparison: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHospitals = async () => {
    const idsStr = searchParams.get('ids');
    if (!idsStr) {
      setLoading(false);
      return;
    }
    const ids = idsStr.split(',');
    setLoading(true);
    try {
      const data = await hospitalAPI.compare(ids);
      setHospitals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-12 animate-pulse text-left">
        <div className="h-8 bg-slate-800 rounded w-1/4" />
        <div className="h-96 bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  if (hospitals.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto my-12 border border-slate-200">
        <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">No Hospitals Selected</h2>
        <p className="text-xs text-slate-500 mt-2">Please select hospitals to compare from the Discovery Map screen first.</p>
        <Link to="/search" className="mt-6 px-4 py-2 bg-primary text-slate-900 rounded-xl text-xs font-semibold inline-block">Back to Maps</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 text-left">
      <Link to="/search" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors text-xs font-semibold">
        <ArrowLeft className="w-4 h-4" />
        Back to Discovery Maps
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          <Layers className="text-primary w-8 h-8 animate-bounce" />
          Side-by-Side Provider Comparison
        </h1>
        <p className="text-xs text-slate-500 font-medium">Review ratings, department costs, and active availability options between your choices.</p>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-2xl glass-panel bg-white/[0.01]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-5 font-bold text-slate-500 uppercase tracking-wider w-1/4">Comparison Metric</th>
              {hospitals.map(h => (
                <th key={h.id} className="p-5 font-extrabold text-slate-900 text-sm w-1/4">
                  {h.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-600">
            {/* Recommendation Match Score */}
            <tr>
              <td className="p-5 font-semibold text-slate-500">Match Compatibility</td>
              {hospitals.map(h => (
                <td key={h.id} className="p-5">
                  <span className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full font-bold">
                    {h.recommendationScore}% Score
                  </span>
                </td>
              ))}
            </tr>

            {/* Ratings */}
            <tr>
              <td className="p-5 font-semibold text-slate-500">Patient Rating</td>
              {hospitals.map(h => (
                <td key={h.id} className="p-5">
                  <div className="flex items-center gap-1 font-bold text-warning">
                    <Star className="w-4 h-4 fill-warning text-warning" />
                    {h.rating.toFixed(1)} / 5.0
                  </div>
                </td>
              ))}
            </tr>

            {/* Emergency status */}
            <tr>
              <td className="p-5 font-semibold text-slate-500">24/7 ER Room</td>
              {hospitals.map(h => (
                <td key={h.id} className="p-5">
                  {h.emergencyAvailable ? (
                    <span className="text-[10px] bg-danger/10 border border-danger/20 text-danger px-2.5 py-0.5 rounded-full font-bold uppercase">
                      Yes — Active
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-800 text-slate-500 px-2.5 py-0.5 rounded-full font-bold uppercase">
                      Not Available
                    </span>
                  )}
                </td>
              ))}
            </tr>

            {/* Operating Hours */}
            <tr>
              <td className="p-5 font-semibold text-slate-500">Working Hours</td>
              {hospitals.map(h => (
                <td key={h.id} className="p-5 flex items-center gap-1.5 mt-1 font-medium">
                  <Clock className="w-4 h-4 text-slate-500" />
                  {h.workingHours}
                </td>
              ))}
            </tr>

            {/* Specialities Available */}
            <tr>
              <td className="p-5 font-semibold text-slate-500">Key Departments</td>
              {hospitals.map(h => (
                <td key={h.id} className="p-5">
                  <div className="flex flex-wrap gap-1">
                    {h.specialties?.map((s, idx) => (
                      <span key={idx} className="text-[9px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                        {s.specialty.name}
                      </span>
                    ))}
                  </div>
                </td>
              ))}
            </tr>

            {/* Average Consult Cost */}
            <tr>
              <td className="p-5 font-semibold text-slate-500">Consult Costs</td>
              {hospitals.map(h => {
                const costs = h.specialties?.map(s => s.averageCost) || [];
                const minCost = costs.length > 0 ? Math.min(...costs) : 0;
                const maxCost = costs.length > 0 ? Math.max(...costs) : 0;

                return (
                  <td key={h.id} className="p-5 font-bold text-slate-900">
                    ${minCost} - ${maxCost}
                  </td>
                );
              })}
            </tr>

            {/* Address */}
            <tr>
              <td className="p-5 font-semibold text-slate-500">Geographic Address</td>
              {hospitals.map(h => (
                <td key={h.id} className="p-5 text-slate-500 font-light flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                  {h.address}
                </td>
              ))}
            </tr>

            {/* Action buttons */}
            <tr>
              <td className="p-5 font-semibold text-slate-500">Direct Actions</td>
              {hospitals.map(h => (
                <td key={h.id} className="p-5">
                  <Link
                    to={`/hospitals/${h.id}`}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-slate-900 text-[10px] font-bold rounded-xl block text-center shadow shadow-primary/10 transition-colors"
                  >
                    View Clinic Profile
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
