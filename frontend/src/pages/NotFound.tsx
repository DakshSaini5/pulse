import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { PulseLogo } from '../components/PulseLogo';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradients for premium glassmorphic effect */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full space-y-6 text-center bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-ambient relative">
        <div className="flex flex-col items-center space-y-4">
          <PulseLogo size={54} variant="vertical" showTagline={true} />
          
          <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center border border-danger/20 animate-pulse mt-4">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2 mt-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">404</h1>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Page Not Found</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              The page you are looking for does not exist, has been removed, or is temporarily unavailable.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
