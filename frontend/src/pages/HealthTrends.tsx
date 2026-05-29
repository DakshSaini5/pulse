import React, { useState, useEffect } from 'react';
import { trendAPI, HealthTrend } from '../services/api';
import { 
  TrendingUp, Activity, Calendar, Award, 
  HelpCircle, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

export const HealthTrends: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trends, setTrends] = useState<HealthTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMarker, setActiveMarker] = useState('Hemoglobin');

  const fetchTrends = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const data = await trendAPI.getTrends();
      setTrends(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const markers = [
    { name: 'Hemoglobin', unit: 'g/dL', desc: 'Carries oxygen throughout red blood cells.', ref: '12.0 - 15.0' },
    { name: 'HbA1c', unit: '%', desc: 'Averages your blood glucose level over 3 months.', ref: '4.0 - 5.6' },
    { name: 'TSH', unit: 'uIU/mL', desc: 'Indicates active metabolic and thyroid rates.', ref: '0.4 - 4.5' },
    { name: 'Cholesterol', unit: 'mg/dL', desc: 'Monitors cardiovascular plaque and fat profiles.', ref: '120 - 200' }
  ];

  // Filters trends database to the active selected pill
  const filteredData = trends
    .filter(t => t.markerName === activeMarker)
    .map(t => ({
      date: new Date(t.recordedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      value: t.value,
      marker: t.markerName
    }))
    .reverse(); // chronological order

  const activeMarkerInfo = markers.find(m => m.name === activeMarker);

  return (
    <div className="space-y-8 pb-16 text-left">
      <div className="text-left space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <TrendingUp className="text-primary w-8 h-8 animate-pulse" />
          Biological Health Trends Tracker
        </h1>
        <p className="text-xs text-slate-400">Track and monitor important clinical indexes over time. Watch historical adjustments in clean comparative graphs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left pane: selector pills */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Laboratory Marker</h3>
            
            <div className="flex flex-col gap-2">
              {markers.map((marker) => {
                const isActive = marker.name === activeMarker;
                return (
                  <button
                    key={marker.name}
                    onClick={() => setActiveMarker(marker.name)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      isActive 
                        ? 'border-primary bg-primary/10 text-white font-bold' 
                        : 'border-white/5 bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold">{marker.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-500'}`}>
                        {marker.unit}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-light mt-1.5 leading-normal">{marker.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guidelines info card */}
          {activeMarkerInfo && (
            <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-3 bg-gradient-to-b from-white/[0.01] to-transparent">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">Reference parameters</span>
              <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Standard Healthy Range</span>
                <span className="text-primary font-bold">{activeMarkerInfo.ref} {activeMarkerInfo.unit}</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal font-light">
                Note: Blood reference indicators might deviate slightly between clinical laboratory providers. Pulse indicates values based on global standardized guidelines.
              </p>
            </div>
          )}
        </div>

        {/* Right pane: Charts visualizer */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/5 space-y-6 relative overflow-hidden bg-gradient-to-b from-white/[0.01] to-transparent">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <div>
                <h2 className="text-lg font-bold text-white">{activeMarker} Progression</h2>
                <p className="text-[10px] text-slate-400">Biological analysis timeline matching verified uploads.</p>
              </div>
              <span className="text-[10px] bg-primary/15 border border-primary/25 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase">
                Active Graph
              </span>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-primary animate-spin" />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
                <Activity className="w-8 h-8 mb-2 animate-bounce" />
                No uploads found tracking this marker. Verify your lab report parameters to generate lines.
              </div>
            ) : (
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={filteredData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af" 
                      fontSize={10} 
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={10} 
                      tickLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111827', 
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        color: '#fff'
                      }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Line
                      type="monotone"
                      name={`${activeMarker} (${activeMarkerInfo?.unit})`}
                      dataKey="value"
                      stroke="#0D6EFD"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#0D6EFD', strokeWidth: 2, stroke: '#0B0F19' }}
                      activeDot={{ r: 7, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Trend milestones list */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Historical Progress Records</h3>

            <div className="space-y-3">
              {filteredData.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Upload blood sheets to populate history log.</p>
              ) : (
                filteredData.map((d, i) => (
                  <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-success/15 flex items-center justify-center text-success">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-white block font-bold">Lab Record Update</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {d.date}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-white font-extrabold block">
                        {d.value} {activeMarkerInfo?.unit}
                      </span>
                      <span className="text-[9px] text-slate-500 font-semibold block mt-0.5 uppercase tracking-wider">{activeMarker}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
