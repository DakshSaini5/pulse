import React from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, PhoneCall, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isNativeApp } from '../../core/utils/platform';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NeedHelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-800 text-left">
        
        {/* Header */}
        <div className="bg-red-50 dark:bg-red-500/10 p-6 flex items-start justify-between border-b border-red-100 dark:border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Emergency Services & Guidance</h2>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">Select an action for immediate assistance</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Options grid */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Please choose whether you want to navigate directly to the nearest emergency hospital map or connect immediately with a medical hotline:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Nearest Hospital */}
            <div 
              onClick={() => {
                onClose();
                navigate('/search?emergency=true&sort=distance');
              }}
              className="p-5 rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-900/60 transition-all duration-300 cursor-pointer flex flex-col justify-between h-40 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
                <MapPin className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Show Hospital</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                  Locate and navigate to the nearest active 24/7 ER room automatically.
                </p>
              </div>
            </div>

            {/* Card 2: Saved Phone Dialer */}
            <div 
              onClick={() => {
                onClose();
                navigate('/saved?emergency_call=true');
              }}
              className="p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-900/60 transition-all duration-300 cursor-pointer flex flex-col justify-between h-40 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <PhoneCall className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Emergency Call</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                  {isNativeApp 
                    ? "Dial the personal emergency contact number you filled in your profile immediately."
                    : "Quick-dial nearby hospitals or national medical emergency helplines immediately."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NeedHelpModal;
