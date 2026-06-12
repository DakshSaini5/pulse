import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Search, ClipboardList, User as UserIcon, ShieldAlert, Heart, FileText } from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';
import { emergencyAPI, EmergencyContact } from '@core/services/api';
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          
          {/* Nav Item 1 */}
          <Link to="/search" className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors min-w-[48px] ${isActive('/search') ? 'text-primary' : 'text-muted-foreground'}`}>
            <Search className="size-5" />
            <span className={`text-[10px] font-medium ${isActive('/search') ? 'text-primary' : ''}`}>Discover</span>
          </Link>

          {/* Nav Item 2 */}
          <Link to="/prescriptions" className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors min-w-[48px] ${isActive('/prescriptions') ? 'text-primary' : 'text-muted-foreground'}`}>
            <FileText className="size-5" />
            <span className={`text-[10px] font-medium ${isActive('/prescriptions') ? 'text-primary' : ''}`}>Records</span>
          </Link>

          {/* Center Prominent Panic Button */}
          <button 
            onClick={handlePanicClick}
            disabled={panicLoading}
            className="flex flex-col items-center gap-1 -mt-6 active:scale-95 transition-transform disabled:opacity-70"
            aria-label="Panic emergency button"
          >
            <div className="size-14 rounded-full bg-destructive shadow-lg shadow-destructive/30 flex items-center justify-center ring-4 ring-card">
              {panicLoading ? <Activity className="size-6 text-white animate-spin" /> : <ShieldAlert className="size-6 text-white" />}
            </div>
            <span className="text-[10px] font-bold text-destructive tracking-wide">PANIC</span>
          </button>

          {/* Nav Item 3 */}
          <Link to="/trends" className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors min-w-[48px] ${isActive('/trends') ? 'text-primary' : 'text-muted-foreground'}`}>
            <Activity className="size-5" />
            <span className={`text-[10px] font-medium ${isActive('/trends') ? 'text-primary' : ''}`}>Trends</span>
          </Link>

          {/* Nav Item 4 */}
          <Link to="/profile" className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors min-w-[48px] ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`}>
            <UserIcon className="size-5" />
            <span className={`text-[10px] font-medium ${isActive('/profile') ? 'text-primary' : ''}`}>Profile</span>
          </Link>

        </div>
      </nav>
      {showPanicModal && <BreathingCuesModal isOpen={showPanicModal} onClose={() => setShowPanicModal(false)} />}
    </>
  );
};

export default MobileBottomNav;
