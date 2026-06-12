import React, { useState, useEffect } from 'react';
import { trendAPI, HealthTrend, HealthInsight } from '@core/services/api';
import { 
  TrendingUp, Activity, Calendar, Award, 
  HelpCircle, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Capacitor } from '@capacitor/core';


export const HealthTrends: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trends, setTrends] = useState<HealthTrend[]>([]);
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMarker, setActiveMarker] = useState('Hemoglobin');
  const [assessingRisk, setAssessingRisk] = useState(false);
  const [riskResult, setRiskResult] = useState<{ score: number, summary: string, biomarkersAnalyzed: number } | null>(null);

  const fetchTrends = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const [trendData, insightData] = await Promise.all([
        trendAPI.getTrends(),
        trendAPI.getInsights()
      ]);
      setTrends(trendData);
      setInsights(insightData);
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

  const handleAssessRisk = async () => {
    setAssessingRisk(true);
    try {
      const { reportAPI } = await import('@core/services/api');
      const res = await reportAPI.getRiskAssessment();
      setRiskResult(res);
    } catch (err) {
      console.error(err);
      alert('Failed to calculate health risk score.');
    } finally {
      setAssessingRisk(false);
    }
  };


  return (
    <div className="space-y-8 pb-16 text-left">
      <div className="text-left space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="text-primary w-8 h-8 animate-pulse" />
          Biological Health Trends Tracker
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">Track and monitor important clinical indexes over time. Watch historical adjustments in clean comparative graphs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left pane: selector pills */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Select Laboratory Marker</h3>
            
            <div className="flex flex-col gap-2">
              {markers.map((marker) => {
                const isActive = marker.name === activeMarker;
                return (
                  <button
                    key={marker.name}
                    onClick={() => setActiveMarker(marker.name)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      isActive 
                        ? 'border-primary bg-primary/10 text-slate-900 dark:text-white font-bold' 
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:text-white'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold">{marker.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500'}`}>
                        {marker.unit}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 font-light mt-1.5 leading-normal">{marker.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guidelines info card */}
          {activeMarkerInfo && (
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-700 space-y-3 bg-gradient-to-b from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-900/50">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">Reference parameters</span>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold">Standard Healthy Range</span>
                <span className="text-primary font-bold">{activeMarkerInfo.ref} {activeMarkerInfo.unit}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 leading-normal font-light">
                Note: Blood reference indicators might deviate slightly between clinical laboratory providers. Pulse indicates values based on global standardized guidelines.
              </p>
            </div>
          )}

          {/* AI Risk Assessment Widget */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-700 space-y-4 bg-gradient-to-b from-primary/5 to-transparent">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              AI Health Risk Score
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Calculate an overall risk score from 0-100 based on your latest uploaded medical lab markers.
            </p>
            
            {riskResult ? (
              <div className={`p-4 rounded-xl border ${riskResult.score < 60 ? 'bg-danger/10 border-danger/20 text-danger' : riskResult.score < 80 ? 'bg-warning/10 border-warning/20 text-warning' : 'bg-success/10 border-success/20 text-success'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold">Health Score</span>
                  <span className="text-xl font-black">{riskResult.score} / 100</span>
                </div>
                <p className="text-[10px] leading-relaxed mb-2 text-slate-700 dark:text-slate-200">{riskResult.summary}</p>
                <p className="text-[9px] mt-2 opacity-70">Analyzed {riskResult.biomarkersAnalyzed} recent lab markers.</p>
                <button onClick={() => setRiskResult(null)} className="text-[9px] mt-2 underline hover:opacity-80">Reset</button>
              </div>
            ) : (
              <button
                onClick={handleAssessRisk}
                disabled={assessingRisk || trends.length === 0}
                className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-xs font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {assessingRisk ? <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> : <Award className="w-4 h-4" />}
                {assessingRisk ? 'Analyzing Lab Data...' : 'Calculate Risk Score'}
              </button>
            )}
          </div>

        </div>

        {/* Right pane: Charts visualizer */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 space-y-6 relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-900/50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.1)_0%,transparent_70%)] pointer-events-none" />
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{activeMarker} Progression</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500">Biological analysis timeline matching verified uploads.</p>
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
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 dark:text-slate-500 text-xs">
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
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Historical Progress Records</h3>

            <div className="space-y-3">
              {filteredData.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 text-center py-4">Upload blood sheets to populate history log.</p>
              ) : (
                filteredData.map((d, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-success/15 flex items-center justify-center text-success">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-slate-900 dark:text-white block font-bold">Lab Record Update</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {d.date}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-900 dark:text-white font-extrabold block">
                        {d.value} {activeMarkerInfo?.unit}
                      </span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold block mt-0.5 uppercase tracking-wider">{activeMarker}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Generated Habits List */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Automated Daily Habits
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Personalized habits suggested by AI based on your recent report extractions.</p>
            <div className="space-y-3">
              {insights.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No habits generated yet. Upload a report for AI to suggest some.</p>
              ) : (
                insights.map((insight, i) => (
                  <div key={insight.id || i} className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex justify-between items-start text-xs">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 mt-0.5 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-slate-900 dark:text-white block font-bold">{insight.title}</span>
                        <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{insight.description}</p>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-2">
                          {new Date(insight.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
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
