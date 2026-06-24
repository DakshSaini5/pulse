// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitCompareArrows, Star, Clock, CheckCircle2,
  XCircle, Sparkles, AlertCircle, ArrowLeft, Loader2
} from 'lucide-react';
import { PulseNav } from './PulseNav';
import axios from 'axios';

export function HospitalCompareScreen() {
  const navigate = useNavigate();
  const token = localStorage.getItem('pulse_token');
  const apiUrl = import.meta.env.VITE_API_URL;

  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/hospitals/saved`, { headers: { Authorization: `Bearer ${token}` } });
        // Use saved hospitals as comparison candidates
        setHospitals((res.data || []).slice(0, 3));
      } catch { }
      finally { setLoading(false); }
    };
    fetchSaved();
  }, []);

  const allSpecialties = new Set<string>();
  hospitals.forEach(h => {
    if (h.specialties) h.specialties.forEach((s: any) => allSpecialties.add(s.specialty?.name || s.name));
  });
  const featureKeys = Array.from(allSpecialties);

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0F19]">
      <PulseNav variant="app" activeScreen="compare" onNavigate={(id: string) => navigate(`/${id}`)} />

      <main className="flex-1 overflow-y-auto pb-28">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <button onClick={() => navigate('/discover')} className="flex items-center gap-1 text-xs font-bold text-slate-500 mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Discover
          </button>
          <h1 className="text-xl font-bold text-white">Hospital Compare</h1>
          <p className="text-xs text-slate-400 mt-1">Side-by-side comparison of your saved hospitals</p>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 text-[#1E60D5] animate-spin" /></div>
        ) : hospitals.length === 0 ? (
          <div className="mx-4 mb-4 bg-[#111827] rounded-2xl border-2 border-dashed border-slate-700 p-10 flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-amber-400" />
            <h3 className="font-bold text-white">No Hospitals to Compare</h3>
            <p className="text-xs text-slate-400 text-center">Save some hospitals from the Discover screen first.</p>
            <button onClick={() => navigate('/discover')} className="mt-2 px-4 py-2 bg-[#1E60D5] text-white text-xs font-bold rounded-xl active:scale-95 transition-transform">
              Go to Discover
            </button>
          </div>
        ) : (
          <div className="mx-4 mb-4">
            {/* AI Summary */}
            {hospitals.length >= 2 && (
              <div className="bg-[#1E60D5]/10 rounded-xl border border-[#1E60D5]/15 px-4 py-3 mb-3 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#1E60D5] shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">AI Recommendation:</strong>{' '}
                  {hospitals.reduce((prev, cur) => ((prev.rating || 0) > (cur.rating || 0)) ? prev : cur).name}{' '}
                  scores highest overall.
                </p>
              </div>
            )}

            {/* Comparison Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800/60">
              <div className="bg-[#111827] min-w-[max-content]">
                {/* Headers */}
                <div className="grid border-b border-slate-800/40" style={{ gridTemplateColumns: `100px repeat(${hospitals.length}, minmax(120px, 1fr))` }}>
                  <div className="px-3 py-3 bg-[#0B0F19]/50" />
                  {hospitals.map(h => (
                    <div key={h.id} className="px-3 py-3 border-l border-slate-800/40">
                      <p className="text-[11px] font-bold text-white leading-tight">{h.name}</p>
                    </div>
                  ))}
                </div>

                {/* Data rows */}
                {[
                  { label: 'Rating', render: (h: any) => (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-white">{h.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                  )},
                  { label: '24/7 ER', render: (h: any) => h.emergencyAvailable
                    ? <span className="text-[9px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-bold">Yes</span>
                    : <span className="text-[9px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">No</span>
                  },
                  { label: 'Hours', render: (h: any) => (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span className="text-[10px] font-semibold text-slate-300 truncate max-w-[80px]">{h.workingHours || 'N/A'}</span>
                    </div>
                  )},
                ].map((row, i) => (
                  <div key={row.label} className="grid border-b border-slate-800/40 last:border-b-0" style={{ gridTemplateColumns: `100px repeat(${hospitals.length}, minmax(120px, 1fr))` }}>
                    <div className={`px-3 py-3 flex items-center ${i % 2 === 1 ? 'bg-[#0B0F19]/30' : ''}`}>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{row.label}</span>
                    </div>
                    {hospitals.map(h => (
                      <div key={h.id} className={`px-3 py-3 border-l border-slate-800/40 flex items-center ${i % 2 === 1 ? 'bg-[#0B0F19]/20' : ''}`}>
                        {row.render(h)}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Departments */}
                {featureKeys.length > 0 && (
                  <>
                    <div className="px-4 py-2.5 bg-[#0B0F19]/50 border-t border-b border-slate-800/40">
                      <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Departments</p>
                    </div>
                    {featureKeys.map((feature, i) => (
                      <div key={feature} className="grid border-b border-slate-800/40 last:border-b-0" style={{ gridTemplateColumns: `100px repeat(${hospitals.length}, minmax(120px, 1fr))` }}>
                        <div className={`px-3 py-3 flex items-center ${i % 2 === 1 ? 'bg-[#0B0F19]/30' : ''}`}>
                          <span className="text-[9px] font-semibold text-slate-400">{feature}</span>
                        </div>
                        {hospitals.map(h => {
                          const has = h.specialties?.some((s: any) => (s.specialty?.name || s.name) === feature);
                          return (
                            <div key={h.id} className={`px-3 py-3 border-l border-slate-800/40 flex items-center justify-center ${i % 2 === 1 ? 'bg-[#0B0F19]/20' : ''}`}>
                              {has ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-slate-700" />}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
