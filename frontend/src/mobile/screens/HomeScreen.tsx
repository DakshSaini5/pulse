// @ts-nocheck
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Activity, Search, MapPin, Upload, FlaskConical,
  Stethoscope, Heart, Brain, Eye, Syringe, Bone, Baby, ChevronRight, Bell,
} from 'lucide-react';
import { PulseNav } from './PulseNav';
import { useUserLocation } from '@core/context/LocationContext';
import { useAuth } from '@core/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const services = [
  { id: 'general', label: 'General', icon: Stethoscope, gradient: 'from-blue-500/20 to-blue-600/10', iconColor: 'text-blue-400' },
  { id: 'vaccination', label: 'Vaccination', icon: Syringe, gradient: 'from-emerald-500/20 to-emerald-600/10', iconColor: 'text-emerald-400' },
  { id: 'blood-test', label: 'Blood Test', icon: FlaskConical, gradient: 'from-red-500/20 to-red-600/10', iconColor: 'text-red-400' },
  { id: 'dental', label: 'Dental', icon: Bone, gradient: 'from-amber-500/20 to-amber-600/10', iconColor: 'text-amber-400' },
  { id: 'cardiology', label: 'Cardiology', icon: Heart, gradient: 'from-rose-500/20 to-rose-600/10', iconColor: 'text-rose-400' },
  { id: 'neurology', label: 'Neurology', icon: Brain, gradient: 'from-purple-500/20 to-purple-600/10', iconColor: 'text-purple-400' },
  { id: 'eye-care', label: 'Eye Care', icon: Eye, gradient: 'from-cyan-500/20 to-cyan-600/10', iconColor: 'text-cyan-400' },
  { id: 'pediatrics', label: 'Pediatrics', icon: Baby, gradient: 'from-orange-500/20 to-orange-600/10', iconColor: 'text-orange-400' },
];

export function HomeScreen({ activeScreen, onNavigate, onPanic }: any) {
  const navigate = useNavigate();
  const { label: locationLabel } = useUserLocation();
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['home-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('pulse_token');
      const [prescriptions] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/prescriptions`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      return {
        scans: prescriptions.data?.length ?? 0,
        hospitals: 0,
        trends: 0,
      };
    },
    staleTime: 60000,
  });

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0F19]">
      <PulseNav variant="app" activeScreen="home" onNavigate={(id: string) => navigate(`/${id}`)} />

      <main className="flex-1 overflow-y-auto pb-28">
        {/* Greeting */}
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-2xl font-bold text-white">
            Hi, {firstName} 👋
          </h2>
          <div className="flex items-center gap-1.5 mt-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#1E60D5]" />
            <span className="text-xs text-slate-400">
              {locationLabel || 'Detecting location...'}
            </span>
          </div>
        </div>

        {/* Quick Actions — the 4 main actions like website dashboard */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/records')}
              className="flex flex-col items-start gap-3 p-4 bg-gradient-to-br from-[#1E60D5]/15 to-[#1E60D5]/5 border border-[#1E60D5]/20 rounded-2xl active:scale-[0.97] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1E60D5]/20 flex items-center justify-center">
                <Upload className="w-5 h-5 text-[#1E60D5]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Upload Prescription</p>
                <p className="text-[10px] text-slate-400 mt-0.5">AI-scan your meds</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/records')}
              className="flex flex-col items-start gap-3 p-4 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/20 rounded-2xl active:scale-[0.97] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Upload Report</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Lab results analysis</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/discover')}
              className="flex flex-col items-start gap-3 p-4 bg-gradient-to-br from-purple-500/15 to-purple-500/5 border border-purple-500/20 rounded-2xl active:scale-[0.97] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Search className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Find Hospitals</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Near your location</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/trends')}
              className="flex flex-col items-start gap-3 p-4 bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/20 rounded-2xl active:scale-[0.97] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Health Trends</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Track your vitals</p>
              </div>
            </button>
          </div>
        </div>

        {/* Health Summary */}
        <div className="px-4 py-2">
          <div className="bg-[#111827] rounded-2xl border border-slate-800/60 p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              Your Health Summary
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Scans', value: String(stats?.scans ?? '—'), sub: 'prescriptions', color: 'text-[#1E60D5]' },
                { label: 'Hospitals', value: String(stats?.hospitals ?? '—'), sub: 'saved', color: 'text-emerald-400' },
                { label: 'Trends', value: String(stats?.trends ?? '—'), sub: 'tracked', color: 'text-amber-400' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center bg-[#0B0F19] rounded-xl p-3 border border-slate-800/40">
                  <span className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</span>
                  <span className="text-[10px] font-semibold text-slate-300 leading-none mt-0.5">{stat.label}</span>
                  <span className="text-[10px] text-slate-500">{stat.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Browse Services */}
        <div className="px-4 pt-3 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Browse Services</h3>
            <button
              onClick={() => navigate('/discover')}
              className="flex items-center gap-1 text-[10px] font-semibold text-[#1E60D5]"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  onClick={() => navigate('/discover')}
                  className="flex flex-col items-center gap-2 p-3 bg-[#111827] rounded-xl border border-slate-800/40 active:scale-95 transition-transform"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${service.iconColor}`} />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-300 text-center leading-tight">
                    {service.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
