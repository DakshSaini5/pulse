import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, FileText, ArrowLeftRight, User } from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navTabs = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Hospitals', path: '/search', icon: Search },
    { label: 'Reports', path: '/reports', icon: FileText },
    { label: 'Compare', path: '/compare', icon: ArrowLeftRight },
    { label: 'Account', path: user ? '/profile' : '/login', icon: User },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-white dark:bg-slate-900 border-t border-[#E5E7EB] dark:border-slate-800 flex items-center justify-around px-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navTabs.map((tab) => {
        const active = isActive(tab.path);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.label}
            to={tab.path}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-2 py-1 transition-colors ${
              active 
                ? 'text-[#1A3BAA] dark:text-blue-400 font-semibold' 
                : 'text-[#4B5563] dark:text-slate-400 hover:text-[#121414]'
            }`}
          >
            <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[12px] leading-tight mt-1">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
