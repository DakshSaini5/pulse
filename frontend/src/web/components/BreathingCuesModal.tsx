import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, ShieldAlert, PhoneCall, Check } from 'lucide-react';
import { isNativeApp } from '../../core/utils/platform';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  emergencyContactPhone?: string;
  emergencyContactName?: string;
}

type BreathingState = 'IN' | 'HOLD' | 'OUT';

export const BreathingCuesModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  emergencyContactPhone, 
  emergencyContactName = 'Emergency Contact'
}: any) => {
  const [step, setStep] = useState<'BREATHE' | 'OPTIONS' | 'YES_OKAY' | 'NO_HELP'>('BREATHE');
  
  // Breathing pattern timings: IN (4s), HOLD (3s), OUT (6s)
  const [breathState, setBreathState] = useState<BreathingState>('IN');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cycleCount, setCycleCount] = useState(1);

  const affirmations = [
    "This feeling will pass. You have survived every panic attack before this one.",
    "You are safe. These sensations cannot harm you.",
    "Focus only on this screen. Nothing else right now.",
    "Slowly relax your shoulders and let your jaw loosen.",
    "You are doing great. Keep following the rhythm.",
    "With each breath out, let go of a bit of tension.",
    "Your heart rate is slowing down. You are in control."
  ];

  const [affirmationIdx, setAffirmationIdx] = useState(0);
  const [animClass, setAnimClass] = useState('opacity-100 translate-y-0');

  const helplines = [
    { name: 'National Emergency Line', phone: '112' },
    { name: 'Ambulance Service', phone: '102' },
    { name: 'Disaster Management', phone: '108' }
  ];

  // Reset state on open
  useEffect(() => {
    if (!isOpen) return;
    setStep('BREATHE');
    setBreathState('IN');
    setSecondsLeft(4);
    setCycleCount(1);
    setAffirmationIdx(0);
    setAnimClass('opacity-100 translate-y-0');
  }, [isOpen]);

  // Breathing cues timer loop
  useEffect(() => {
    if (!isOpen || step !== 'BREATHE') return;

    const timer = setTimeout(() => {
      if (secondsLeft <= 1) {
        if (breathState === 'IN') {
          setBreathState('HOLD');
          setSecondsLeft(3);
        } else if (breathState === 'HOLD') {
          setBreathState('OUT');
          setSecondsLeft(6);
        } else {
          // If we completed 7 full cycles, go to the options selection page
          if (cycleCount >= 7) {
            setStep('OPTIONS');
          } else {
            setBreathState('IN');
            setSecondsLeft(4);
            setCycleCount((c) => c + 1);
          }
        }
      } else {
        setSecondsLeft((s) => s - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOpen, step, secondsLeft, breathState, cycleCount]);

  // Rotate affirmations every 6 seconds with exit/entry slide-up animations
  useEffect(() => {
    if (!isOpen || step !== 'BREATHE') return;

    let exitTimeout: any;
    let swapTimeout: any;
    let enterTimeout: any;

    const runCycle = () => {
      // 1. Start exit animation at 5.5s (500ms before cycle end)
      exitTimeout = setTimeout(() => {
        setAnimClass('opacity-0 -translate-y-4 transition-all duration-500 ease-in-out');
      }, 5500);

      // 2. Change message and reset position at 6s
      swapTimeout = setTimeout(() => {
        setAffirmationIdx((prev) => (prev + 1) % affirmations.length);
        setAnimClass('opacity-0 translate-y-4');
        
        // 3. Slide back in from bottom
        enterTimeout = setTimeout(() => {
          setAnimClass('opacity-100 translate-y-0 transition-all duration-500 ease-in-out');
          // Run the next cycle
          runCycle();
        }, 50);
      }, 6000);
    };

    // Start cycle loop
    runCycle();

    return () => {
      clearTimeout(exitTimeout);
      clearTimeout(swapTimeout);
      clearTimeout(enterTimeout);
    };
  }, [isOpen, step]);

  if (!isOpen) return null;

  // Circle scaling class matching transition timings
  const getCircleScaleClass = () => {
    switch (breathState) {
      case 'IN':
        return 'scale-[1.65] duration-[4000ms]';
      case 'HOLD':
        return 'scale-[1.65] duration-0';
      case 'OUT':
        return 'scale-95 duration-[6000ms]';
      default:
        return 'scale-100';
    }
  };

  const getBreathingLabel = () => {
    switch (breathState) {
      case 'IN':
        return 'Breathe In...';
      case 'HOLD':
        return 'Hold In...';
      case 'OUT':
        return 'Breathe Out...';
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
        return 'Slowly and gently let the air out of your lungs.';
      default:
        return '';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 text-center relative p-6 sm:p-8">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-2 bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800/80 rounded-full"
        >
          <X size={18} />
        </button>

        {step === 'BREATHE' && (
          <div className="space-y-6 py-2">
            <div className="space-y-2">
              <span className="inline-block text-[10px] bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Calming Exercise • Cycle {cycleCount}
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">You're Safe</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Follow the animated circle to regulate your heart rate and ease panic.</p>
            </div>

            {/* Breathing Circle Container */}
            <div className="h-44 flex items-center justify-center relative">
              {/* Soft ambient background glow */}
              <div className="absolute w-48 h-48 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
              
              {/* Outer pulse glow (highly visible expanding concentric rings, slowed down) */}
              <div 
                className="absolute w-40 h-40 rounded-full bg-blue-500/20 border-2 border-blue-400/35 animate-ping" 
                style={{ animationDuration: '5000ms' }}
              />
              <div 
                className="absolute w-40 h-40 rounded-full bg-blue-500/12 border border-blue-400/20 animate-ping" 
                style={{ animationDuration: '5000ms', animationDelay: '2500ms' }}
              />
              
              {/* Animated Core Circle */}
              <div 
                className={`w-32 h-32 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 shadow-2xl shadow-blue-500/30 flex flex-col items-center justify-center transition-transform ease-linear select-none ${getCircleScaleClass()}`}
              >
                <span className="text-xl font-black text-white">{secondsLeft}s</span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{getBreathingLabel()}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto min-h-[32px]">{getBreathingInstructions()}</p>
            </div>

            {/* Affirmation Box with Slide-Up Transition */}
            <div className="max-w-sm mx-auto min-h-[48px] flex items-center justify-center overflow-hidden">
              <p className={`text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed font-semibold ${animClass}`}>
                "{affirmations[affirmationIdx]}"
              </p>
            </div>

            {/* Response Options directly on main popup */}
            <div className={`grid grid-cols-1 ${isNativeApp ? 'sm:grid-cols-2' : ''} gap-3 max-w-sm mx-auto pt-2`}>
              <button
                type="button"
                onClick={() => setStep('YES_OKAY')}
                className="py-3 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-primary/20 border border-primary/20"
              >
                <Check className="w-4 h-4" />
                Yes, I am okay
              </button>
              {isNativeApp && (
                <button
                  type="button"
                  onClick={() => setStep('NO_HELP')}
                  className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-red-600/20 border border-red-500/20"
                >
                  <ShieldAlert className="w-4 h-4" />
                  No, I need support
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'OPTIONS' && (
          <div className="space-y-6 py-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <Heart className="w-8 h-8 font-black animate-pulse text-primary" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-extrabold">Exercise Completed</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                You have completed 7 full cycles of deep breathing. How are you feeling now?
              </p>
            </div>

            <div className={`grid grid-cols-1 ${isNativeApp ? 'sm:grid-cols-2' : ''} gap-3 max-w-sm mx-auto pt-4`}>
              <button
                type="button"
                onClick={() => setStep('YES_OKAY')}
                className="py-3.5 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-primary/20 border border-primary/20"
              >
                <Check className="w-4 h-4" />
                Yes, I am okay
              </button>
              {isNativeApp && (
                <button
                  type="button"
                  onClick={() => setStep('NO_HELP')}
                  className="py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-red-600/20 border border-red-500/20"
                >
                  <ShieldAlert className="w-4 h-4" />
                  No, I need support
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'YES_OKAY' && (
          <div className="space-y-6 py-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-8 h-8 font-black animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Glad you are safe!</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                Take care of yourself, sip some warm water, and rest. If symptoms persist or feel critical, please consult a medical provider.
              </p>
            </div>

            <div className="flex flex-col gap-3 max-w-xs mx-auto pt-4">
              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
              >
                Close Guidance
              </button>
            </div>
          </div>
        )}

        {isNativeApp && step === 'NO_HELP' && (
          <div className="space-y-6 py-4 text-left animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Let's Connect You</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Connecting to your contacts or national services can help ease your panic.</p>
            </div>

            <div className="space-y-4 pt-2">
              {emergencyContactPhone ? (
                <div className="p-4 rounded-2xl border border-primary/20 bg-primary/[0.03] space-y-3">
                  <div>
                    <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Saved Contact</span>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">{emergencyContactName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{emergencyContactPhone}</p>
                  </div>
                  <a
                    href={`tel:${emergencyContactPhone.trim()}`}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <PhoneCall className="w-4 h-4 animate-bounce" />
                    Call Emergency Contact
                  </a>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-orange-500/20 bg-orange-500/[0.02] text-center">
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">No saved emergency contact located in your profile.</p>
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
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{hp.name}</h4>
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
    </div>,
    document.body
  );
};

export default BreathingCuesModal;
