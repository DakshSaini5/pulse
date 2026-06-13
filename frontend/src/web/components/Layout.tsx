import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@core/context/AuthContext';
import {
  Activity, Search, Heart, FileText, ClipboardList, TrendingUp,
  LogOut, LogIn, UserPlus, Menu, X, Bell, User as UserIcon, ShieldAlert, Settings,
  Phone, KeyRound, MessageSquare, CheckCircle2
} from 'lucide-react';
import ChatAssistant from './ChatAssistant';
import AIChatbox from './AIChatbox';
import { NotificationCenter } from './NotificationCenter';
import { PulseLogo } from './PulseLogo';
import { userAPI } from '@core/services/api';
import toast from 'react-hot-toast';
import { isNativeApp } from '@core/utils/platform';
import MobileBottomNav from './MobileBottomNav';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Discover Hospitals', path: '/search', icon: Search, guest: true },
    { name: 'Hospital Compare', path: '/compare', icon: Activity, guest: true },
    { name: 'Saved Care', path: '/saved', icon: Heart, guest: false },
    { name: 'Prescription Center', path: '/prescriptions', icon: ClipboardList, guest: false },
    { name: 'Report Analytics', path: '/reports', icon: FileText, guest: false },
    { name: 'Health Trends', path: '/trends', icon: TrendingUp, guest: false },
  ];

  const SCREEN_LABELS: Record<string, string> = {
    '/': 'Landing',
    '/search': 'Discover',
    '/prescriptions': 'Records',
    '/trends': 'Trends',
    '/compare': 'Compare',
  };

  const [panicActive, setPanicActive] = useState(false);

  // If we are on mobile, use the exact v0 design wrapper
  if (isNativeApp) {
    const isAppScreen = location.pathname !== '/';
    
    return (
      <div className="min-h-screen bg-[oklch(0.92_0.01_250)] flex flex-col items-center">
        {/* Screen switcher pill - floats above everything */}
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 bg-card/90 backdrop-blur-md border border-border rounded-full px-2 py-1.5 shadow-xl">
          {Object.entries(SCREEN_LABELS).map(([path, label]) => (
            <Link
              key={path}
              to={path}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                location.pathname === path
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Mobile viewport wrapper */}
        <div className="w-full max-w-[390px] min-h-screen bg-background shadow-2xl relative overflow-hidden">
          {/* Top padding so content clears the pill nav */}
          <div className="h-12" />

          {children}

          {/* ── Persistent PANIC button overlay (app screens only) ── */}
          {isAppScreen && !panicActive && (
            <button
              onClick={() => setPanicActive(true)}
              className="absolute bottom-[72px] left-1/2 -translate-x-1/2 z-[150] pointer-events-none"
              aria-label="Panic emergency button"
              tabIndex={-1}
              style={{ pointerEvents: "none" }}
            />
          )}

          {/* PANIC modal */}
          {panicActive && (
            <div className="absolute inset-0 z-[300] flex flex-col items-center justify-center bg-destructive/95 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-6 px-8 text-center">
                <div className="w-24 h-24 rounded-full bg-white/20 ring-8 ring-white/30 flex items-center justify-center">
                  <ShieldAlert className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">PANIC ATTACK</h2>
                  <p className="text-white/80 text-sm mt-2 leading-relaxed">
                    Contacting nearest hospital and sharing your live location...
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <div className="bg-white/10 rounded-2xl px-5 py-3 border border-white/20">
                    <p className="text-xs text-white/70 font-medium">Nearest Emergency</p>
                    <p className="text-base font-bold text-white mt-0.5">CGHS Inderpuri — 2.1 km</p>
                    <p className="text-xs text-white/60 mt-0.5">011-25836573 · Open 24 Hours</p>
                  </div>
                  <a
                    href="tel:108"
                    className="flex items-center justify-center gap-2 bg-white text-destructive font-black text-base py-4 rounded-2xl shadow-lg"
                  >
                    Call 108 — Ambulance
                  </a>
                  <button
                    onClick={() => setPanicActive(false)}
                    className="text-white/60 text-sm font-semibold underline underline-offset-2 mt-1"
                  >
                    Cancel — I am safe
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />

          {/* Floating AI Chat Assistant */}
          {user && <AIChatbox />}
        </div>
      </div>
    );
  }

  // --- STANDARD WEB LAYOUT BELOW ---
  return (
    <div className="min-h-screen bg-pulseBg dark:bg-[#181c1e] text-slate-800 dark:text-slate-100 flex flex-col relative selection:bg-primary selection:text-white transition-colors duration-300">
      {/* Background visual graphics */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.06)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.03)_0%,transparent_70%)]" />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center group">
            <PulseLogo size={42} showTagline={true} />
          </Link>

          {/* Desktop Navigation */}
          {!isNativeApp && (
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.filter(item => item.guest || user).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-label={`Navigate to ${item.name}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${isActive(item.path)
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                >
                  <item.icon className="w-4 h-4" aria-hidden="true" />
                  {item.name}
                </Link>
              ))}
            </nav>
          )}

          {/* Placeholder for future mobile UI overhaul */}
          {/* {isNativeApp && <MobileNavPlaceholder />} */}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Admin Page Switcher */}
              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className={`p-2 rounded-lg border flex items-center gap-1 text-xs font-semibold ${isActive('/admin')
                      ? 'border-warning/30 bg-warning/10 text-warning'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Admin
                </Link>
              )}

              {/* Notifications Button */}
              <NotificationCenter />

              {/* Profile card summary and dropdown */}
              <div className="relative hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-label="Toggle user profile menu"
                  aria-expanded={profileOpen}
                  className="flex items-center gap-3 text-left focus:outline-none group"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-extrabold text-sm group-hover:bg-primary/20 transition-colors">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white leading-3 group-hover:text-primary transition-colors">{user.name}</p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{user.email}</span>
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-black/50 rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-2">
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-colors"
                      >
                        <UserIcon className="w-4 h-4" />
                        My Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                to="/login"
                className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium border border-pulseBorder dark:border-slate-700 hover:border-primary/50 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap tracking-tight"
              >
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium bg-primary hover:bg-primary-hover text-white shadow-md sm:shadow-lg transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap tracking-tight"
              >
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Join
              </Link>
            </div>
          )}

          {/* Mobile menu trigger - Only show on web */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg border border-pulseBorder dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden sticky top-[64px] z-30 w-full glass-panel rounded-none border-t-0 border-b border-pulseBorder dark:border-slate-800 p-4 animate-fade-in text-slate-600 dark:text-slate-300">
          <nav className="flex flex-col gap-2">
            {navItems.filter(item => item.guest || user).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-all ${isActive(item.path)
                    ? 'bg-primary/20 text-primary'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}

            {user && (
              <>
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2 mx-4" />
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-all ${isActive('/profile') ? 'bg-primary/20 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  <UserIcon className="w-5 h-5" />
                  My Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-all ${isActive('/settings') ? 'bg-primary/20 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-all text-danger hover:bg-danger/10 w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  Log out
                </button>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>

      {/* Footer - Only show on web */}
      <footer className="w-full glass-panel rounded-none border-b-0 border-x-0 border-pulseBorder dark:border-slate-800 mt-auto pt-8 pb-6 text-center md:text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Medical Disclaimer */}
          <div className="mb-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed max-w-4xl">
            <span className="font-bold text-slate-700 dark:text-slate-300">Disclaimer:</span> The Pulse platform is intended for informational and educational purposes only. It does not provide medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Do not disregard professional medical advice or delay in seeking it because of information provided by this platform.
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-200 dark:border-slate-800 pt-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <PulseLogo size={42} showTagline={true} />
              <span className="text-xs text-slate-500 dark:text-slate-400 md:pl-4 md:border-l md:border-slate-200 dark:md:border-slate-800">© 2026. All rights reserved.</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <Link to="/about" className="hover:text-slate-900 dark:hover:text-white transition-colors">About Us</Link>
              <Link to="/contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact</Link>
              <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Floating AI Chat Assistant */}
      {user && <ChatAssistant />}
    </div>
  );
};;
