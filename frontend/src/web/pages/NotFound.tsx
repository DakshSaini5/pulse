import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Home, Search } from 'lucide-react';
import { PulseLogo } from '@web/components/PulseLogo';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Page not found | Pulse';
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-surface dark:bg-slate-950">
      <div className="max-w-md w-full space-y-6 text-center bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-2xl p-8 sm:p-10 shadow-sm">
        <div className="flex flex-col items-center space-y-3">
          <PulseLogo size={48} variant="vertical" showTagline={false} />
          
          <div className="pt-2">
            <span className="text-4xl font-extrabold text-primary">404</span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Page not found</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto mt-2">
              The page you are looking for does not exist, was moved, or the link may be mistyped.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Link
            to="/search"
            className="flex-1 py-2.5 px-4 rounded-xl border border-pulseBorder dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Find hospitals
          </Link>
          
          <Link
            to="/"
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
