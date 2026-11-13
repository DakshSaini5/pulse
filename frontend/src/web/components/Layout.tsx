import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@core/context/AuthContext';
import {
  Activity, Search, Heart, FileText, ClipboardList, TrendingUp,
  LogOut, LogIn, UserPlus, Menu, X, Bell, User as UserIcon, ShieldAlert, Settings,
  ArrowLeftRight, HelpCircle
} from 'lucide-react';
import ChatAssistant from './ChatAssistant';
import { NotificationCenter } from './NotificationCenter';
import { PulseLogo } from './PulseLogo';
import { Footer } from './Footer';
import toast from 'react-hot-toast';
import { isNativeApp } from '@core/utils/platform';
import MobileBottomNav from './MobileBottomNav';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(() => {
    if (!isNativeApp) return false;
    return localStorage.getItem('pulse_privacy_accepted') !== 'true';
  });

  const handleAcceptPrivacy = () => {
    localStorage.setItem('pulse_privacy_accepted', 'true');
    setShowPrivacyModal(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Nav per developer brief: Find hospitals, Compare hospitals, Understand a report, Understand a prescription, Explain a medical term, How it works
  const publicNavItems = [
    { name: 'Find hospitals', shortName: 'Find hospitals', path: '/search', icon: Search },
    { name: 'Compare hospitals', shortName: 'Compare', path: '/compare', icon: ArrowLeftRight },
    { name: 'Understand a report', shortName: 'Lab reports', path: '/reports', icon: FileText },
    { name: 'Understand a prescription', shortName: 'Prescriptions', path: '/prescriptions', icon: ClipboardList },
    { name: 'Explain a medical term', shortName: 'Medical terms', path: '/medical-terms', icon: HelpCircle },
    { name: 'How it works', shortName: 'How it works', path: '/how-it-works', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#181c1e] text-[#121414] dark:text-slate-100 flex flex-col relative selection:bg-primary selection:text-white transition-colors duration-200">
      {/* Top Header - Sticky, white, 64px tall, 1px bottom border */}
      <header 
        className="sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <Link to="/" className="flex items-center shrink-0">
              <PulseLogo size={32} showTagline={true} />
            </Link>

            {/* Desktop Navigation - Responsive labels to prevent multi-line wrapping on laptops */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 min-w-0 overflow-hidden">
              {publicNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-label={`Navigate to ${item.name}`}
                  className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive(item.path)
                      ? 'text-[#1A3BAA] bg-[#EEF2FC] font-semibold'
                      : 'text-[#4B5563] hover:text-[#121414] hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="hidden 2xl:inline">{item.name}</span>
                  <span className="2xl:hidden">{item.shortName}</span>
                </Link>
              ))}
              {user && (
                <>
                  <Link
                    to="/saved"
                    className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isActive('/saved')
                        ? 'text-[#1A3BAA] bg-[#EEF2FC] font-semibold'
                        : 'text-[#4B5563] hover:text-[#121414] hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Saved
                  </Link>
                  <Link
                    to="/trends"
                    className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isActive('/trends')
                        ? 'text-[#1A3BAA] bg-[#EEF2FC] font-semibold'
                        : 'text-[#4B5563] hover:text-[#121414] hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Trends
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <>
                {/* Admin Page Switcher */}
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className={`p-1.5 sm:p-2 rounded-lg border flex items-center gap-1 text-xs font-semibold ${
                      isActive('/admin')
                        ? 'border-warning/30 bg-warning/10 text-warning'
                        : 'border-[#E5E7EB] dark:border-slate-700 hover:bg-slate-50 text-[#4B5563]'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}

                {/* Notifications Button */}
                <NotificationCenter />

                {/* Profile Avatar & Clean Dropdown */}
                <div className="relative flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#E5E7EB] dark:border-slate-700">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    aria-label="Toggle user profile menu"
                    aria-expanded={profileOpen}
                    className="flex items-center gap-2 text-left focus:outline-none group cursor-pointer"
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EEF2FC] flex items-center justify-center border border-[#1A3BAA]/20 text-[#1A3BAA] font-bold text-xs sm:text-sm shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden 2xl:block max-w-[120px]">
                      <p className="text-xs font-semibold text-[#121414] dark:text-white leading-tight truncate">{user.name}</p>
                    </div>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 shadow-xl rounded-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-3 border-b border-[#E5E7EB] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <p className="text-sm font-semibold text-[#121414] dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-[#4B5563] dark:text-slate-400 truncate">{user.email}</p>
                      </div>
                      <div className="py-1.5">
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#121414] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#1A3BAA] transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-[#1A3BAA]" />
                          My Profile
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#121414] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#1A3BAA] transition-colors"
                        >
                          <Settings className="w-4 h-4 text-[#1A3BAA]" />
                          Settings
                        </Link>
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#C62828] hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
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
              <div className="flex items-center gap-1.5 sm:gap-3">
                <Link
                  to="/login"
                  className="hidden sm:inline-block text-sm font-medium text-[#1A3BAA] hover:underline px-2 py-1.5 whitespace-nowrap"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="h-8 sm:h-9 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold bg-[#1A3BAA] hover:bg-[#142E86] text-white transition-colors flex items-center justify-center whitespace-nowrap"
                >
                  Get started
                </Link>
              </div>
            )}

            {/* Mobile menu trigger - Only show on web below lg */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#4B5563] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden sticky top-[64px] z-30 w-full bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 p-4 text-[#121414] dark:text-slate-300">
          <nav className="flex flex-col gap-1.5">
            {publicNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
                  isActive(item.path)
                    ? 'bg-[#EEF2FC] text-[#1A3BAA] font-semibold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5 text-[#1A3BAA]" />
                {item.name}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  to="/saved"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Heart className="w-5 h-5 text-[#1A3BAA]" />
                  Saved Hospitals
                </Link>
                <Link
                  to="/trends"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <TrendingUp className="w-5 h-5 text-[#1A3BAA]" />
                  Health Trends
                </Link>
                <div className="h-px bg-[#E5E7EB] dark:bg-slate-800 my-2 mx-4" />
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <UserIcon className="w-5 h-5" />
                  My Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 text-[#C62828] hover:bg-red-50 dark:hover:bg-red-950/20 w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  Log out
                </button>
              </>
            ) : (
              <div className="pt-3 border-t border-[#E5E7EB] dark:border-slate-800 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-sm font-medium text-[#1A3BAA] border border-[#1A3BAA] rounded-lg"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-sm font-semibold text-white bg-[#1A3BAA] rounded-lg"
                >
                  Get started
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Main Content Area - max-w-[1200px], side padding 16px mobile, 24px desktop per brief */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 pb-24 sm:pt-6 sm:pb-12 relative z-10">
        {children}
      </main>

      {/* Full Footer on every page */}
      <Footer />

      {/* Mobile Bottom Tab Bar (below 768px) */}
      <MobileBottomNav />

      {/* Floating AI Chat Assistant */}
      {user && <ChatAssistant />}

      {/* Prominent Privacy Disclosure Modal for App Store Compliance */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Privacy & Data Safety</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Play Store Onboarding Compliance</p>
              </div>
            </div>
            
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              <p>
                To provide clinical assistance, Pulse securely handles specific types of health data:
              </p>
              <div className="space-y-3 pl-1">
                <div className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">📍</span>
                  <p><strong className="text-slate-900 dark:text-white">Location Access:</strong> Calculates transit distances to emergency rooms and nearby facilities.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">📄</span>
                  <p><strong className="text-slate-900 dark:text-white">Health Documents:</strong> Uploaded prescriptions and reports are structured privately.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">💬</span>
                  <p><strong className="text-slate-900 dark:text-white">Chat Triage Logs:</strong> Inquiry history is saved in a private database for you to access anytime.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">🔒</span>
                  <p><strong className="text-slate-900 dark:text-white">Data Control:</strong> You are in full control. Delete your uploads or your account at any time in settings.</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                By clicking Accept, you agree to our <Link to="/privacy" onClick={() => setShowPrivacyModal(false)} className="text-[#1A3BAA] underline">Privacy Policy</Link>.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  toast.error("You must accept the privacy policy to use the app.");
                }}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleAcceptPrivacy}
                className="flex-1 py-3 bg-[#1A3BAA] hover:bg-[#142E86] text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-95"
              >
                Accept & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
