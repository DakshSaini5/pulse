import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

export const MedicalDisclaimer: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm mb-6 flex gap-3 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-[20px] pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
      <div className="shrink-0 pt-0.5">
        <ShieldAlert className="h-5 w-5 text-amber-600" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-amber-800">Educational Purpose Only</h3>
        <p className="text-sm text-amber-700 mt-1">
          Pulse provides AI-generated information. This is <strong>NOT medical advice</strong>. 
          Always consult a qualified healthcare professional before making any health decisions or changes to your treatment.
        </p>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 p-1.5 rounded-lg text-amber-600/50 hover:text-amber-700 hover:bg-amber-500/10 transition-colors"
        aria-label="Dismiss disclaimer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const AIModalDisclaimer: React.FC<{ onAcknowledge: () => void }> = ({ onAcknowledge }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="bg-amber-50 p-6 flex flex-col items-center text-center border-b border-amber-100">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Important Medical Notice</h2>
        </div>
        <div className="p-6 space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            You are about to use Pulse's AI-assisted analysis tools. Please understand that:
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li>AI outputs may contain errors or inaccuracies.</li>
            <li>This tool cannot diagnose conditions or prescribe treatments.</li>
            <li>This platform is for educational and informational purposes only.</li>
          </ul>
          <p className="font-semibold text-slate-800 pt-2 border-t border-slate-100">
            By proceeding, you agree to consult a licensed physician for any medical concerns.
          </p>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onAcknowledge}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary text-slate-900 font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
