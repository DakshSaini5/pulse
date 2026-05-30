import React, { useState, useEffect } from 'react';
import { adminAPI, hospitalAPI, AdminStats } from '../services/api';
import { 
  ShieldAlert, Users, Activity, FileText, 
  Coins, Database, AlertCircle, RefreshCw, PlusCircle, Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  // New Hospital Form State
  const [showAddHospital, setShowAddHospital] = useState(false);
  const [addingHospital, setAddingHospital] = useState(false);
  const [hospForm, setHospForm] = useState({
    name: '', address: '', latitude: '', longitude: '', phone: '',
    email: '', website: '', workingHours: '9:00 AM - 5:00 PM', emergencyAvailable: false, rating: '0'
  });

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

  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingHospital(true);
    try {
      await hospitalAPI.addHospital(hospForm);
      alert('Hospital added successfully');
      setShowAddHospital(false);
      setHospForm({
        name: '', address: '', latitude: '', longitude: '', phone: '',
        email: '', website: '', workingHours: '9:00 AM - 5:00 PM', emergencyAvailable: false, rating: '0'
      });
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add hospital');
    } finally {
      setAddingHospital(false);
    }
  };

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
      <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto my-12 border border-slate-200">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-xs text-slate-500 mt-2">Only accounts mapped to the ADMIN category can view stats logs.</p>
        <button onClick={() => navigate('/search')} className="mt-6 px-4 py-2 bg-primary text-slate-900 rounded-xl text-xs font-semibold">Back to Maps</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 text-left">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-warning w-8 h-8 animate-pulse" />
            Pulse Admin Control Desk
          </h1>
          <p className="text-xs text-slate-500">Review real-time system performance indexings, Tesseract queues, and Gemini API cost charts.</p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddHospital(!showAddHospital)}
            className="p-2.5 rounded-xl border border-slate-200 bg-primary hover:bg-primary-hover text-slate-900 transition-all flex items-center gap-2 text-xs font-bold shadow-md shadow-primary/20"
          >
            <PlusCircle className="w-4 h-4" />
            Add Hospital
          </button>
          <button 
            onClick={fetchStats}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Stats
          </button>
        </div>
      </div>

      {showAddHospital && (
        <div className="glass-panel rounded-3xl p-6 border border-primary/30 bg-primary/5 space-y-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center pb-3 border-b border-primary/20">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Ingest New Hospital
            </h3>
            <button onClick={() => setShowAddHospital(false)} className="text-xs text-slate-500 hover:text-slate-900">Cancel</button>
          </div>
          
          <form onSubmit={handleAddHospital} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Hospital Name *</label>
                <input required type="text" value={hospForm.name} onChange={e => setHospForm({...hospForm, name: e.target.value})} className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-900" />
              </div>
              <div className="space-y-1 lg:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Address *</label>
                <input required type="text" value={hospForm.address} onChange={e => setHospForm({...hospForm, address: e.target.value})} className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-900" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Latitude *</label>
                <input required type="number" step="any" value={hospForm.latitude} onChange={e => setHospForm({...hospForm, latitude: e.target.value})} className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-900" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Longitude *</label>
                <input required type="number" step="any" value={hospForm.longitude} onChange={e => setHospForm({...hospForm, longitude: e.target.value})} className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-900" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Phone</label>
                <input type="text" value={hospForm.phone} onChange={e => setHospForm({...hospForm, phone: e.target.value})} className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-900" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Email</label>
                <input type="email" value={hospForm.email} onChange={e => setHospForm({...hospForm, email: e.target.value})} className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-900" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Website</label>
                <input type="text" value={hospForm.website} onChange={e => setHospForm({...hospForm, website: e.target.value})} className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-900" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Working Hours</label>
                <input type="text" value={hospForm.workingHours} onChange={e => setHospForm({...hospForm, workingHours: e.target.value})} className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-900" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Initial Rating (0-5)</label>
                <input type="number" min="0" max="5" step="0.1" value={hospForm.rating} onChange={e => setHospForm({...hospForm, rating: e.target.value})} className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-900" />
              </div>
              <div className="space-y-1 flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input type="checkbox" checked={hospForm.emergencyAvailable} onChange={e => setHospForm({...hospForm, emergencyAvailable: e.target.checked})} className="rounded text-primary focus:ring-primary w-4 h-4" />
                  24/7 Emergency Available
                </label>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={addingHospital}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-slate-900 text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {addingHospital ? 'Saving...' : 'Save Hospital Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Platform Users', value: stats.usersCount, color: 'text-primary' },
          { icon: Database, label: 'Scanned Hospitals', value: stats.hospitalsCount, color: 'text-success' },
          { icon: FileText, label: 'OCR Scans Run', value: stats.ocrCount, color: 'text-warning' },
          { icon: Coins, label: 'Gemini Cost Accum', value: `$${stats.aiCost.toFixed(3)}`, color: 'text-danger' }
        ].map((card, idx) => (
          <div key={idx} className="glass-panel rounded-3xl p-5 border border-slate-200 flex items-center gap-4 relative overflow-hidden bg-white/[0.005]">
            <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-200 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">{card.label}</span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 block leading-none">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Usage logs and details */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6 bg-gradient-to-b from-slate-50 to-slate-100/50">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Gemini model Usage Logs</h3>
            <p className="text-[10px] text-slate-500">Transactions processed via Gemini 2.5 Flash tokens.</p>
          </div>
          <span className="text-[10px] bg-warning/10 border border-warning/20 text-warning px-2.5 py-0.5 rounded-full font-bold uppercase">
            Model: Flash 2.5
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
                <th className="p-4">User</th>
                <th className="p-4">Feature Segment</th>
                <th className="p-4">Tokens Used</th>
                <th className="p-4">Simulated Cost</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-600">
              {stats.usages.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.005] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-800 border border-slate-200 flex items-center justify-center text-[10px] font-bold">
                        {u.user.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold block text-slate-900">{u.user.name}</span>
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
