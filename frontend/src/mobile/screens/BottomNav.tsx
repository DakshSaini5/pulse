// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, FileText, Activity, User as UserIcon, ShieldAlert } from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';
import { emergencyAPI } from '@core/services/api';
import toast from 'react-hot-toast';

export function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const [panicLoading, setPanicLoading] = useState(false);

  const isActive = (path: string) => {
    if (path === '/home' && location.pathname === '/home') return true;
    if (path === '/discover' && location.pathname === '/discover') return true;
    if (path === '/records' && location.pathname === '/records') return true;
    if (path === '/trends' && location.pathname === '/trends') return true;
    return false;
  };

  const triggerPanic = async () => {
    setPanicLoading(true);
    try {
      let lat: number | undefined, lng: number | undefined;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (e) {
          // Location unavailable
        }
      }
      const res = (await emergencyAPI.triggerPanic(lat, lng)) as any;
      if (res.simulated) {
        toast('🚨 Emergency alert simulated for contacts.', { duration: 5000 });
      } else {
        toast.success(res.message || 'Emergency SMS alerts dispatched!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch panic alert');
    } finally {
      setPanicLoading(false);
    }
  };

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F1623]/95 backdrop-blur-lg border-t border-slate-800/80">
      <div className="flex items-center justify-around px-2 py-2 pb-[max(env(safe-area-inset-bottom),8px)]">

        {/* Discover */}
        <Link
          to="/discover"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors min-w-[48px] ${isActive('/discover') ? 'text-[#1E60D5]' : 'text-slate-500'}`}
        >
          <Search className="w-5 h-5" />
          <span className={`text-[10px] font-semibold ${isActive('/discover') ? 'text-[#1E60D5]' : ''}`}>Discover</span>
        </Link>

        {/* Records */}
        <Link
          to="/records"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors min-w-[48px] ${isActive('/records') ? 'text-[#1E60D5]' : 'text-slate-500'}`}
        >
          <FileText className="w-5 h-5" />
          <span className={`text-[10px] font-semibold ${isActive('/records') ? 'text-[#1E60D5]' : ''}`}>Records</span>
        </Link>

        {/* Center Panic Button */}
        <button
          onClick={triggerPanic}
          disabled={panicLoading}
          className="flex flex-col items-center gap-1 -mt-6 active:scale-95 transition-transform disabled:opacity-70"
          aria-label="Panic emergency button"
        >
          <div className="w-14 h-14 rounded-full bg-red-500 shadow-lg shadow-red-500/30 flex items-center justify-center ring-4 ring-[#0F1623]">
            {panicLoading ? (
              <Activity className="w-6 h-6 text-white animate-spin" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-white" />
            )}
          </div>
          <span className="text-[10px] font-bold text-red-500 tracking-wide">PANIC</span>
        </button>

        {/* Trends */}
        <Link
          to="/trends"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors min-w-[48px] ${isActive('/trends') ? 'text-[#1E60D5]' : 'text-slate-500'}`}
        >
          <Activity className="w-5 h-5" />
          <span className={`text-[10px] font-semibold ${isActive('/trends') ? 'text-[#1E60D5]' : ''}`}>Trends</span>
        </Link>

        {/* Home/Profile */}
        <Link
          to="/home"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors min-w-[48px] ${isActive('/home') ? 'text-[#1E60D5]' : 'text-slate-500'}`}
        >
          <UserIcon className="w-5 h-5" />
          <span className={`text-[10px] font-semibold ${isActive('/home') ? 'text-[#1E60D5]' : ''}`}>Home</span>
        </Link>

      </div>
    </nav>
  );
}

export default BottomNav;
