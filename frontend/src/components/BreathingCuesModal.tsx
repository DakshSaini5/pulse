import React, { useState, useEffect } from 'react';
import { X, Heart, ShieldAlert, PhoneCall, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  emergencyContactPhone?: string;
  emergencyContactName?: string;
}

type BreathingState = 'IN' | 'HOLD' | 'OUT' | 'HOLD_OUT';

export const BreathingCuesModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  emergencyContactPhone, 
  onSuccess, // Unused but kept if passed in layout interfaces
  emergencyContactName = 'Emergency Contact'
}: any) => {
  const [step, setStep] = useState<'BREATHE' | 'CHECK' | 'YES_OKAY' | 'NO_HELP'>('BREATHE');
  
  // Breathing animation state: cycle duration is 4 seconds each (4-4-4-4 breathing)
  const [breathState, setBreathState] = useState<BreathingState>('IN');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cycleCount, setCycleCount] = useState(1);
  const totalCycles = 3;

  const helplines = [
    { name: 'National Emergency Line', phone: '112' },
    { name: 'Ambulance Service', phone: '102' },
    { name: 'Disaster Management', phone: '108' }
  ];

  useEffect(() => {
    if (!isOpen) return;
    // Reset state on open
    setStep('BREATHE');
    setBreathState('IN');
    setSecondsLeft(4);
    setCycleCount(1);
  }, [isOpen]);

  // Breathing loop timer
  useEffect(() => {
    if (!isOpen || step !== 'BREATHE') return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Transition to next breath state
          setBreathState((currentState) => {
            switch (currentState) {
              case 'IN':
                return 'HOLD';
              case 'HOLD':
                return 'OUT';
              case 'OUT':
                return 'HOLD_OUT';
              case 'HOLD_OUT':
                // Check cycles limit
                setCycleCount((count) => {
                  if (count >= totalCycles) {
                    clearInterval(interval);
                    setStep('CHECK');
                  }
                  return count + 1;
                });
                return 'IN';
              default:
                return 'IN';
            }
          });
          return 4; // Reset to 4 seconds
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, step, breathState]);

  if (!isOpen) return null;

  // Visual helper styles for breathing circle
  const getCircleScaleClass = () => {
    switch (breathState) {
      case 'IN':
        return 'scale-150 duration-[4000ms]';
      case 'HOLD':
        return 'scale-150 duration-0';
      case 'OUT':
        return 'scale-90 duration-[4000ms]';
      case 'HOLD_OUT':
        return 'scale-90 duration-0';
      default:
        return 'scale-100';
    }
  };

  const getBreathingLabel = () => {
    switch (breathState) {
      case 'IN':
        return 'Breathe In...';
      case 'HOLD':
        return 'Hold...';
      case 'OUT':
        return 'Breathe Out...';
      case 'HOLD_OUT':
        return 'Rest...';
      default:
        return '';
    }
  };

  const getBreathingInstructions = () => {
    switch (breathState) {
      case 'IN':
        return 'Let your chest expand and take a deep breath.';
      case 'HOLD':
        return 'Keep the air inside and try to relax your shoulders.';
      case 'OUT':
        return 'Slowly let the air out of your lungs.';
      case 'HOLD_OUT':
        return 'Rest before the next gentle cycle.';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900/90 border border-slate-800 text-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 text-center relative p-6 sm:p-8">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 bg-slate-800/40 rounded-full"
        >
          <X size={18} />
        </button>

        {step === 'BREATHE' && (
          <div className="space-y-8 py-4">
            <div className="space-y-2">
              <span className="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Calming Exercise • Cycle {cycleCount} of {totalCycles}
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">Calm Down & Breathe</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Follow the animated circle to regulate your heart rate and ease panic.</p>
            </div>

            {/* Breathing Circle Container */}
            <div className="h-48 flex items-center justify-center relative">
              {/* Outer pulse */}
              <div className="absolute w-36 h-36 rounded-full bg-primary/5 border border-primary/10 animate-ping duration-[3000ms]" />
              
              {/* Animated Core Circle */}
              <div 
                className={`w-28 h-28 rounded-full bg-gradient-to-tr from-primary to-blue-500 shadow-xl shadow-primary/20 flex flex-col items-center justify-center transition-transform ease-linear select-none ${getCircleScaleClass()}`}
              >
                <span className="text-xl font-black text-slate-900">{secondsLeft}s</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">{getBreathingLabel()}</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto min-h-[32px]">{getBreathingInstructions()}</p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setStep('CHECK')}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xs font-bold text-slate-200 transition-colors"
              >
                Skip to Checklist
              </button>
            </div>
          </div>
        )}

        {step === 'CHECK' && (
          <div className="space-y-6 py-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <Heart className="w-6 h-6 animate-pulse fill-primary" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-white">Are you feeling okay now?</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">It is perfectly fine if you are still feeling uneasy. Take your time.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
              <button
                onClick={() => setStep('YES_OKAY')}
                className="px-8 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Yes, I am okay
              </button>
              <button
                onClick={() => setStep('NO_HELP')}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                No, I need support
              </button>
            </div>
          </div>
        )}

        {step === 'YES_OKAY' && (
          <div className="space-y-6 py-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-8 h-8 font-black" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Glad you are safe!</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Take care of yourself, sip some warm water, and rest. If symptoms persist or feel critical, please consult a medical provider.
              </p>
            </div>

            <div className="flex flex-col gap-3 max-w-xs mx-auto pt-4">
              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl transition-colors"
              >
                Close Guidance
              </button>
            </div>
          </div>
        )}

        {step === 'NO_HELP' && (
          <div className="space-y-6 py-4 text-left animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Let's Connect You</h2>
              <p className="text-xs text-slate-400">Connecting to your contacts or national services can help ease your panic.</p>
            </div>

            <div className="space-y-4 pt-4">
              {emergencyContactPhone ? (
                <div className="p-4 rounded-2xl border border-primary/20 bg-primary/[0.03] space-y-3">
                  <div>
                    <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Saved Contact</span>
                    <h3 className="font-extrabold text-sm text-white mt-0.5">{emergencyContactName}</h3>
                    <p className="text-xs text-slate-400">{emergencyContactPhone}</p>
                  </div>
                  <a
                    href={`tel:${emergencyContactPhone.trim()}`}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <PhoneCall className="w-4 h-4 animate-bounce" />
                    Call Emergency Contact
                  </a>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-orange-500/20 bg-orange-500/[0.02] text-center">
                  <p className="text-xs text-slate-300 font-medium">No saved emergency contact located in your profile.</p>
                  <p className="text-[10px] text-slate-500 mt-1">Please dial verified national medical emergency hotlines below.</p>
                </div>
              )}

              {/* National Helplines list inside modal */}
              <div className="space-y-2.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">India Emergency Hotlines</span>
                <div className="grid grid-cols-1 gap-2">
                  {helplines.map((hp) => (
                    <div 
                      key={hp.phone} 
                      className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-xs text-white">{hp.name}</h4>
                        <span className="text-[10px] text-slate-500">{hp.phone}</span>
                      </div>
                      <a
                        href={`tel:${hp.phone}`}
                        className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                      >
                        <PhoneCall className="w-3 h-3" />
                        Dial {hp.phone}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default BreathingCuesModal;
