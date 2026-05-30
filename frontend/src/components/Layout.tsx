import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, Search, Heart, FileText, ClipboardList, TrendingUp, 
  LogOut, LogIn, UserPlus, Menu, X, Bell, User as UserIcon, ShieldAlert
} from 'lucide-react';
import ChatAssistant from './ChatAssistant';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Discover Care', path: '/search', icon: Search, guest: true },
    { name: 'Hospital Compare', path: '/compare', icon: Activity, guest: true },
    { name: 'Saved Care', path: '/saved', icon: Heart, guest: false },
    { name: 'Prescription Center', path: '/prescriptions', icon: ClipboardList, guest: false },
    { name: 'Report Analytics', path: '/reports', icon: FileText, guest: false },
    { name: 'Health Trends', path: '/trends', icon: TrendingUp, guest: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative overflow-x-hidden selection:bg-primary selection:text-slate-900">
      {/* Background visual graphics */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#198754]/5 blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform duration-300">
                <Activity className="w-5 h-5 text-slate-900 animate-pulse" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">Pulse</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.filter(item => item.guest || user).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Admin Page Switcher */}
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className={`p-2 rounded-lg border flex items-center gap-1 text-xs font-semibold ${
                      isActive('/admin') 
                        ? 'border-warning/30 bg-warning/10 text-warning' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Admin
                  </Link>
                )}

                {/* Notifications Button */}
                <div className="relative">
                  <button 
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-slate-500 hover:text-slate-900"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
                  </button>

                  {/* Dropdown menu */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-3 w-80 glass-panel border border-slate-200 rounded-2xl p-4 shadow-xl z-50 text-slate-700">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-3">
                        <span className="font-semibold text-sm">Notifications</span>
                        <span className="text-[10px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-full">New Alerts</span>
                      </div>
                      <div className="space-y-3">
                        <div className="p-2 bg-success/10 border border-success/20 rounded-lg text-xs">
                          <p className="font-medium text-slate-900 mb-0.5">Analysis Ready</p>
                          <p className="text-slate-500">Medical Report CBC analysis parsed perfectly. Route specialist updated.</p>
                        </div>
                        <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg text-xs">
                          <p className="font-medium text-slate-900 mb-0.5">Welcome to Pulse</p>
                          <p className="text-slate-500">Start discovering hospitals near your location.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile card summary */}
                <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-extrabold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-3">{user.name}</p>
                    <span className="text-[10px] text-slate-500">{user.email}</span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-danger/20 bg-slate-50 hover:bg-danger/10 hover:text-danger transition-all text-slate-500"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-primary hover:bg-primary-hover text-slate-900 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden sticky top-[64px] z-30 w-full glass-panel border-b border-slate-200 p-4 animate-fade-in text-slate-600">
          <nav className="flex flex-col gap-2">
            {navItems.filter(item => item.guest || user).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-all ${
                  isActive(item.path)
                    ? 'bg-primary/20 text-slate-900'
                    : 'hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full glass-panel border-t border-slate-200 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Pulse</span>
            <span className="text-xs text-slate-500">© 2026. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-xs text-slate-500">
            <Link to="/about" className="hover:text-slate-900 transition-colors">About Us</Link>
            <Link to="/contact" className="hover:text-slate-900 transition-colors">Contact</Link>
            <Link to="/pricing" className="hover:text-slate-900 transition-colors">SaaS Pricing</Link>
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
      {/* Floating AI Chat Assistant */}
      <ChatAssistant />
    </div>
  );
};
