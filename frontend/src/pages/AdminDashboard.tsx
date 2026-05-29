import React, { useState, useEffect } from 'react';
import { adminAPI, AdminStats } from '../services/api';
import { 
  ShieldAlert, Users, Activity, FileText, 
  Coins, Database, AlertCircle, RefreshCw 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/search');
      return;
    }
    setLoading(true);
    try {
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-12 animate-pulse text-left">
        <div className="h-8 bg-slate-800 rounded w-1/4" />
        <div className="grid grid-cols-4 gap-4">
          <div className="h-24 bg-slate-800 rounded-3xl" />
          <div className="h-24 bg-slate-800 rounded-3xl" />
          <div className="h-24 bg-slate-800 rounded-3xl" />
          <div className="h-24 bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto my-12 border border-white/5">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-slate-400 mt-2">Only accounts mapped to the ADMIN category can view stats logs.</p>
        <button onClick={() => navigate('/search')} className="mt-6 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold">Back to Maps</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 text-left">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="text-warning w-8 h-8 animate-pulse" />
            Pulse Admin Control Desk
          </h1>
          <p className="text-xs text-slate-400">Review real-time system performance indexings, Tesseract queues, and Gemini API cost charts.</p>
        </div>

        <button 
          onClick={fetchStats}
          className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 transition-all flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Stats
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Platform Users', value: stats.usersCount, color: 'text-primary' },
          { icon: Database, label: 'Scanned Hospitals', value: stats.hospitalsCount, color: 'text-success' },
          { icon: FileText, label: 'OCR Scans Run', value: stats.ocrCount, color: 'text-warning' },
          { icon: Coins, label: 'Gemini Cost Accum', value: `$${stats.aiCost.toFixed(3)}`, color: 'text-danger' }
        ].map((card, idx) => (
          <div key={idx} className="glass-panel rounded-3xl p-5 border border-white/5 flex items-center gap-4 relative overflow-hidden bg-white/[0.005]">
            <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">{card.label}</span>
              <span className="text-xl sm:text-2xl font-extrabold text-white mt-1 block leading-none">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Usage logs and details */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/5 space-y-6 bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="flex justify-between items-center pb-3 border-b border-white/5">
          <div>
            <h3 className="font-bold text-white text-base">Gemini model Usage Logs</h3>
            <p className="text-[10px] text-slate-400">Transactions processed via Gemini 2.5 Flash tokens.</p>
          </div>
          <span className="text-[10px] bg-warning/10 border border-warning/20 text-warning px-2.5 py-0.5 rounded-full font-bold uppercase">
            Model: Flash 2.5
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-slate-400 uppercase tracking-wider font-bold">
                <th className="p-4">User</th>
                <th className="p-4">Feature Segment</th>
                <th className="p-4">Tokens Used</th>
                <th className="p-4">Simulated Cost</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {stats.usages.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.005] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-bold">
                        {u.user.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold block text-white">{u.user.name}</span>
                        <span className="text-[9px] text-slate-500 block leading-none mt-0.5">{u.user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-primary">{u.feature}</td>
                  <td className="p-4 font-mono font-medium">{u.tokensUsed} tokens</td>
                  <td className="p-4 font-mono text-danger font-semibold">${(u.tokensUsed * 0.0000003).toFixed(5)}</td>
                  <td className="p-4 text-slate-500">{new Date(u.processedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
