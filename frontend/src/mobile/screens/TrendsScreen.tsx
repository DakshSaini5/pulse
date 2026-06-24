// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Activity, ChevronRight, Info, Award, Loader2 } from 'lucide-react';
import { PulseNav } from './PulseNav';
import { trendAPI, reportAPI } from '@core/services/api';

interface TrendsScreenProps {
  activeScreen?: string;
}

function MiniChart({ data }: { data: { date: string; value: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="h-16 flex items-center justify-center text-xs text-slate-500">No data yet</div>;
  }
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const height = 60;
  const width = 100;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width || 50;
    const y = height - ((d.value - min) / range) * (height - 12) - 6;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="#1E60D5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * width || 50;
        const y = height - ((d.value - min) / range) * (height - 12) - 6;
        return i === data.length - 1 || data.length === 1 ? (
          <circle key={i} cx={x} cy={y} r="3.5" fill="#1E60D5" />
        ) : null;
      })}
    </svg>
  );
}

function getStatus(value: number, min: number, max: number) {
  if (value < min) return { label: 'Low', color: 'text-amber-400', bg: 'bg-amber-500/15' };
  if (value > max) return { label: 'High', color: 'text-red-400', bg: 'bg-red-500/15' };
  return { label: 'Normal', color: 'text-emerald-400', bg: 'bg-emerald-500/15' };
}

export function TrendsScreen({ activeScreen }: TrendsScreenProps) {
  const navigate = useNavigate();
  const [trends, setTrends] = useState<any[]>([]);
  const [activeMarker, setActiveMarker] = useState('');
  const [loading, setLoading] = useState(true);
  const [assessingRisk, setAssessingRisk] = useState(false);
  const [riskResult, setRiskResult] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await trendAPI.getTrends();
        setTrends(data || []);
      } catch { }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const knownMarkerInfo: Record<string, { desc: string; ref: string }> = {
    'Hemoglobin': { desc: 'Carries oxygen in red blood cells.', ref: '12.0 - 15.0' },
    'HbA1c': { desc: '3-month average blood glucose.', ref: '4.0 - 5.6' },
    'TSH': { desc: 'Thyroid metabolic rate indicator.', ref: '0.4 - 4.5' },
    'Cholesterol': { desc: 'Cardiovascular fat profile.', ref: '120 - 200' },
  };

  const uniqueMarkersMap = new Map<string, { name: string; unit: string; desc: string; ref: string }>();
  trends.forEach(t => {
    if (!uniqueMarkersMap.has(t.markerName)) {
      const known = knownMarkerInfo[t.markerName] || { desc: 'Biological marker from reports.', ref: '0 - 100' };
      uniqueMarkersMap.set(t.markerName, { name: t.markerName, unit: t.unit || 'units', desc: known.desc, ref: known.ref });
    }
  });
  const markers = Array.from(uniqueMarkersMap.values());

  useEffect(() => {
    if (markers.length > 0 && (!activeMarker || !markers.some(m => m.name === activeMarker))) {
      setActiveMarker(markers[0].name);
    }
  }, [markers.length]);

  const handleAssessRisk = async () => {
    setAssessingRisk(true);
    try { const res = await reportAPI.getRiskAssessment(); setRiskResult(res); } catch { }
    finally { setAssessingRisk(false); }
  };

  const selected = markers.find(b => b.name === activeMarker) || markers[0];
  const filteredData = trends
    .filter(t => t.markerName === activeMarker)
    .map(t => ({ date: new Date(t.recordedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }), value: t.value }))
    .reverse();
  const currentValue = filteredData.length > 0 ? filteredData[filteredData.length - 1].value : 0;
  const refParts = selected ? selected.ref.split('-').map(s => parseFloat(s.trim())) : [0, 100];
  const normalMin = refParts[0] || 0;
  const normalMax = refParts[1] || 100;
  const status = getStatus(currentValue, normalMin, normalMax);
  const rangePercent = normalMax > normalMin ? Math.min(100, Math.max(0, ((currentValue - normalMin) / (normalMax - normalMin)) * 100)) : 50;

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0F19]">
      <PulseNav variant="app" activeScreen="trends" onNavigate={(id: string) => navigate(`/${id}`)} />

      <main className="flex-1 overflow-y-auto pb-28">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <h1 className="text-xl font-bold text-white">Health Trends</h1>
          <p className="text-xs text-slate-400 mt-1">Track clinical indexes over time</p>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 text-[#1E60D5] animate-spin" /></div>
        ) : markers.length === 0 ? (
          <div className="mx-4 py-16 text-center">
            <TrendingUp className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">No health data yet</p>
            <p className="text-xs text-slate-500 mt-1">Upload lab reports to start tracking biomarkers</p>
          </div>
        ) : (
          <>
            {/* Active Marker Chart */}
            {selected && (
              <div className="mx-4 mb-4">
                <div className="bg-[#111827] rounded-2xl border border-slate-800/60 p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="text-lg font-bold text-white">{selected.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{selected.desc}</p>
                    </div>
                    {filteredData.length > 0 && (
                      <span className={`text-sm font-bold px-3 py-1 rounded-xl ${status.bg} ${status.color}`}>
                        {currentValue} {selected.unit}
                      </span>
                    )}
                  </div>

                  {filteredData.length > 0 && (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2 mb-3 ${status.bg} ${status.color}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${status.color === 'text-emerald-400' ? 'bg-emerald-400' : status.color === 'text-amber-400' ? 'bg-amber-400' : 'bg-red-400'}`} />
                      {status.label}
                    </div>
                  )}

                  {/* Chart */}
                  <div className="bg-[#0B0F19] rounded-xl p-3 mb-3 mt-2">
                    <MiniChart data={filteredData} />
                  </div>

                  {/* Range bar */}
                  {filteredData.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">Reference Range</span>
                        <span className="text-xs text-slate-400">{normalMin}–{normalMax} {selected.unit}</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1E60D5] rounded-full transition-all" style={{ width: `${rangePercent}%` }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-slate-600">Low</span>
                        <span className="text-[10px] font-bold text-[#1E60D5]">Current: {currentValue}</span>
                        <span className="text-[10px] text-slate-600">High</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Risk Score */}
            <div className="mx-4 mb-4">
              <div className="bg-[#111827] rounded-2xl border border-slate-800/60 p-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-[#1E60D5]" />
                  AI Health Risk Score
                </h3>
                <p className="text-[10px] text-slate-400 mb-3">Calculate risk score from your latest lab markers.</p>

                {riskResult ? (
                  <div className={`p-3 rounded-xl border ${riskResult.score < 60 ? 'bg-red-500/15 border-red-500/20 text-red-400' : riskResult.score < 80 ? 'bg-amber-500/15 border-amber-500/20 text-amber-400' : 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold">Score</span>
                      <span className="text-xl font-black">{riskResult.score}/100</span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-slate-300">{riskResult.summary}</p>
                    <button onClick={() => handleAssessRisk()} className="text-[9px] mt-2 underline">Recalculate</button>
                  </div>
                ) : (
                  <button
                    onClick={handleAssessRisk}
                    disabled={assessingRisk || trends.length === 0}
                    className="w-full py-3 bg-white text-[#0B0F19] hover:opacity-90 text-sm font-bold rounded-xl disabled:opacity-40 flex justify-center items-center gap-2 active:scale-[0.98] transition-transform"
                  >
                    {assessingRisk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                    {assessingRisk ? 'Analyzing...' : 'Calculate Risk Score'}
                  </button>
                )}
              </div>
            </div>

            {/* Marker Selection */}
            <div className="mx-4 mb-4">
              <div className="bg-[#111827] rounded-2xl border border-slate-800/60 overflow-hidden">
                <div className="px-4 pt-4 pb-3 border-b border-slate-800/40">
                  <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">Select Marker</h3>
                </div>
                <div className="divide-y divide-slate-800/40">
                  {markers.map((marker) => {
                    const markerData = trends.filter(t => t.markerName === marker.name);
                    const latestValue = markerData.length > 0 ? markerData[0].value : 0;
                    const rp = marker.ref.split('-').map(s => parseFloat(s.trim()));
                    const mStatus = getStatus(latestValue, rp[0] || 0, rp[1] || 100);
                    return (
                      <button
                        key={marker.name}
                        onClick={() => setActiveMarker(marker.name)}
                        className={`w-full flex items-center justify-between px-4 py-4 transition-colors text-left ${
                          activeMarker === marker.name ? 'bg-[#1E60D5]/10 border-l-4 border-l-[#1E60D5]' : 'active:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${activeMarker === marker.name ? 'text-[#1E60D5]' : 'text-white'}`}>
                              {marker.name}
                            </span>
                            {markerData.length > 0 && (
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${mStatus.bg} ${mStatus.color}`}>
                                {mStatus.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{marker.desc}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${activeMarker === marker.name ? 'bg-white text-[#0B0F19]' : 'bg-slate-800 text-slate-400'}`}>
                            {marker.unit}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mx-4 mb-4">
              <div className="bg-[#1E60D5]/10 rounded-xl border border-[#1E60D5]/15 p-3 flex items-start gap-3">
                <Info className="w-4 h-4 text-[#1E60D5] shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Disclaimer:</strong> Pulse provides informational insights. Not a substitute for professional medical advice.
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
