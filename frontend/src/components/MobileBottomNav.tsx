import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Search, ClipboardList, User as UserIcon, ShieldAlert, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { emergencyAPI, EmergencyContact } from '../services/api';
import BreathingCuesModal from './BreathingCuesModal';
import toast from 'react-hot-toast';

export const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [panicLoading, setPanicLoading] = useState(false);

  useEffect(() => {
    if (user) {
      emergencyAPI.getContacts()
        .then(setContacts)
        .catch(console.error);
    }
  }, [user]);

  const isActive = (path: string) => {
    if (path === '/search' && location.pathname === '/') return true;
    return location.pathname.startsWith(path);
  };

  const triggerPanic = async () => {
    if (contacts.length === 0) {
      toast.error('You must save at least one emergency contact before triggering a Panic alert!', {
        duration: 4000
      });
      return;
    }

    setPanicLoading(true);
    try {
      let lat, lng;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) => 
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (e) {
          console.warn("Location not available for panic button");
        }
      }
      
      const res = (await emergencyAPI.triggerPanic(lat, lng)) as any;
      if (res.simulated) {
        toast((t) => (
          <div className="text-xs text-slate-800 dark:text-slate-100 block text-left space-y-1">
            <span className="font-bold text-orange-500 block">🚨 EMERGENCY ALERT SIMULATED</span>
            <span>SMS successfully simulated for contacts.</span>
          </div>
        ), { duration: 7000 });
      } else {
        toast.success(res.message || 'Live emergency SMS alerts successfully dispatched!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch panic alert');
    } finally {
      setPanicLoading(false);
    }
  };

  const handlePanicClick = () => {
    setShowPanicModal(true);
    triggerPanic(); // Fire SMS silently while breathing cues open
  };

  if (!user) return null;

  return (
    <>
      <BreathingCuesModal 
        isOpen={showPanicModal}
        onClose={() => setShowPanicModal(false)}
        emergencyContactPhone={contacts[0]?.phoneNumber}
        emergencyContactName={contacts[0]?.name}
      />
      
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] transition-colors duration-300">
        <div className="flex items-center justify-around h-16 px-2 relative">
          
          {/* Nav Item 1 */}
          <Link to="/search" className="flex flex-col items-center justify-center w-16 h-full text-slate-500 dark:text-slate-400">
            <Search className={`w-6 h-6 mb-1 ${isActive('/search') ? 'text-primary' : ''}`} />
            <span className={`text-[10px] font-medium ${isActive('/search') ? 'text-primary' : ''}`}>Discover</span>
          </Link>

          {/* Nav Item 2 */}
          <Link to="/prescriptions" className="flex flex-col items-center justify-center w-16 h-full text-slate-500 dark:text-slate-400">
            <ClipboardList className={`w-6 h-6 mb-1 ${isActive('/prescriptions') ? 'text-primary' : ''}`} />
            <span className={`text-[10px] font-medium ${isActive('/prescriptions') ? 'text-primary' : ''}`}>Records</span>
          </Link>

          {/* Center Prominent Panic Button */}
          <div className="flex flex-col items-center justify-center w-20 h-full relative -top-6">
            <button 
              onClick={handlePanicClick}
              disabled={panicLoading}
              className="w-16 h-16 rounded-full bg-red-600 shadow-[0_8px_30px_rgba(220,38,38,0.5)] border-4 border-white dark:border-slate-900 flex items-center justify-center text-white active:scale-95 transition-transform disabled:opacity-70"
            >
              {panicLoading ? <Activity className="w-8 h-8 animate-spin" /> : <ShieldAlert className="w-8 h-8" />}
            </button>
            <span className="text-[10px] font-extrabold text-red-600 mt-1 uppercase tracking-wider">Panic</span>
          </div>

          {/* Nav Item 3 */}
          <Link to="/trends" className="flex flex-col items-center justify-center w-16 h-full text-slate-500 dark:text-slate-400">
            <Activity className={`w-6 h-6 mb-1 ${isActive('/trends') ? 'text-primary' : ''}`} />
            <span className={`text-[10px] font-medium ${isActive('/trends') ? 'text-primary' : ''}`}>Trends</span>
          </Link>

          {/* Nav Item 4 */}
          <Link to="/profile" className="flex flex-col items-center justify-center w-16 h-full text-slate-500 dark:text-slate-400">
            <UserIcon className={`w-6 h-6 mb-1 ${isActive('/profile') ? 'text-primary' : ''}`} />
            <span className={`text-[10px] font-medium ${isActive('/profile') ? 'text-primary' : ''}`}>Profile</span>
          </Link>

        </div>
      </div>
    </>
  );
};

export default MobileBottomNav;
