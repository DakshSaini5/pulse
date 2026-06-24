// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Menu, X, Home, Search, FileText,
  TrendingUp, GitCompareArrows, Settings,
  HelpCircle, LogOut, User, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';

interface PulseNavProps {
  variant?: 'landing' | 'app';
  notificationCount?: number;
  activeScreen?: string;
  onNavigate?: (screen: string) => void;
  onPanic?: () => void;
}

const NAV_ITEMS = [
  { id: 'home',     label: 'Home',              icon: Home },
  { id: 'discover', label: 'Discover Hospitals', icon: Search },
  { id: 'compare',  label: 'Hospital Compare',   icon: GitCompareArrows },
  { id: 'records',  label: 'My Records',         icon: FileText },
  { id: 'trends',   label: 'Health Trends',      icon: TrendingUp },
];

const SECONDARY_ITEMS = [
  { id: 'settings',  label: 'Settings',    icon: Settings },
  { id: 'help',      label: 'Help & FAQ',  icon: HelpCircle },
  { id: 'logout',    label: 'Sign Out',    icon: LogOut },
];

export function PulseNav({
  variant = 'app',
  notificationCount = 0,
  activeScreen,
  onNavigate,
  onPanic,
}: PulseNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavigate = (id: string) => {
    setMenuOpen(false);
    if (onNavigate) {
      onNavigate(id);
    } else {
      navigate(`/${id}`);
    }
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/');
  };

  return (
    <>
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 bg-[#0F1623]/95 backdrop-blur-lg border-b border-slate-800/60">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E60D5] to-[#3B82F6] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span className="text-base font-bold text-white tracking-tight">Pulse</span>
          </div>

          {/* Right side */}
          {variant === 'landing' ? (
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm font-medium text-slate-300 border border-slate-700 rounded-lg">
                Sign In
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {/* Notifications */}
              <button
                className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-400" />
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                )}
              </button>

              {/* Hamburger */}
              <button
                onClick={() => setMenuOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Backdrop ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Slide-in drawer ── */}
      <aside
        className={`fixed top-0 right-0 z-[210] h-full w-[280px] bg-[#111827] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Navigation menu"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1E60D5]/20 flex items-center justify-center">
              <User className="w-5 h-5 text-[#1E60D5]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">{user?.name || 'Guest'}</p>
              <p className="text-xs text-slate-400 mt-0.5">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Primary nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-0.5">
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase px-3 pb-2 pt-1">
            Navigation
          </p>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleNavigate(id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                activeScreen === id
                  ? 'bg-[#1E60D5]/15 text-[#1E60D5]'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  activeScreen === id ? 'bg-[#1E60D5] text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </span>
                {label}
              </span>
              {activeScreen === id && <ChevronRight className="w-3.5 h-3.5 text-[#1E60D5]" />}
            </button>
          ))}

          {/* Divider */}
          <div className="my-3 border-t border-slate-800 mx-3" />

          {/* Secondary links */}
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase px-3 pb-2">
            Account
          </p>
          {SECONDARY_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                if (id === 'logout') {
                  handleLogout();
                } else {
                  setMenuOpen(false);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                id === 'logout' ? 'text-red-400 hover:bg-red-500/10' : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                id === 'logout' ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'
              }`}>
                <Icon className="w-4 h-4" />
              </span>
              {label}
            </button>
          ))}
        </nav>

        {/* Drawer footer */}
        <div className="px-5 py-4 border-t border-slate-800/60">
          <p className="text-[10px] text-slate-500 text-center">
            Pulse v1.0.0 &middot; HIPAA Compliant &middot; Powered by Pulse AI
          </p>
        </div>
      </aside>
    </>
  );
}
