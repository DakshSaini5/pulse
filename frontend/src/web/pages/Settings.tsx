import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@core/context/AuthContext';
import { useTheme } from '@core/context/ThemeContext';
import { 
  Settings as SettingsIcon, User, Moon, Sun, Bell, Shield, LogOut, 
  Map, ShieldCheck, Mail, Lock, History, Trash2, Key
} from 'lucide-react';
import toast from 'react-hot-toast';
import { userAPI } from '@core/services/api';

export const Settings: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'privacy'>('profile');

  // Edit Profile States
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // BUG-10 FIX: Email change OTP flow states
  const [emailChangeStep, setEmailChangeStep] = useState<'idle' | 'enterEmail' | 'enterOtp'>('idle');
  const [pendingNewEmail, setPendingNewEmail] = useState('');
  const [emailChangeOtp, setEmailChangeOtp] = useState('');
  const [emailChangeSending, setEmailChangeSending] = useState(false);

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Appearance States
  const [searchRadius, setSearchRadius] = useState<number>(15);
  const [mapStyle, setMapStyle] = useState<string>('clinical-light');


  // Notification States
  const [notifyOcr, setNotifyOcr] = useState<boolean>(true);
  const [notifyWeekly, setNotifyWeekly] = useState<boolean>(false);
  const [notifyEmergency, setNotifyEmergency] = useState<boolean>(true);
  const [notifyNearby, setNotifyNearby] = useState<boolean>(true);

  // Privacy States
  const [autoPurgePdf, setAutoPurgePdf] = useState<boolean>(true);
  const [storeSearchHistory, setStoreSearchHistory] = useState<boolean>(true);
  const [cacheCoordinates, setCacheCoordinates] = useState<boolean>(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
    
    const storedRadius = localStorage.getItem('pulse_pref_radius');
    if (storedRadius) setSearchRadius(parseInt(storedRadius));

    const storedMapStyle = localStorage.getItem('pulse_pref_map_style');
    if (storedMapStyle) setMapStyle(storedMapStyle);



    // Notifications
    const storedOcr = localStorage.getItem('pulse_pref_notify_ocr');
    if (storedOcr) setNotifyOcr(storedOcr === 'true');

    const storedWeekly = localStorage.getItem('pulse_pref_notify_weekly');
    if (storedWeekly) setNotifyWeekly(storedWeekly === 'true');

    const storedEmergency = localStorage.getItem('pulse_pref_notify_emergency');
    if (storedEmergency) setNotifyEmergency(storedEmergency === 'true');

    const storedNearby = localStorage.getItem('pulse_pref_notify_nearby');
    if (storedNearby) setNotifyNearby(storedNearby === 'true');

    // Privacy
    const storedPurge = localStorage.getItem('pulse_pref_auto_purge');
    if (storedPurge) setAutoPurgePdf(storedPurge === 'true');

    const storedHistory = localStorage.getItem('pulse_pref_store_history');
    if (storedHistory) setStoreSearchHistory(storedHistory === 'true');

    const storedCache = localStorage.getItem('pulse_pref_cache_coords');
    if (storedCache) setCacheCoordinates(storedCache === 'true');
  }, [user]);

  if (!user) return null;

  // Save Handlers
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be blank.');
      return;
    }
    
    try {
      await userAPI.updateProfile({ name });
      await refreshUser();
      toast.success('Profile name updated successfully!');
      setIsEditingProfile(false);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to update profile details.';
      toast.error(errMsg);
    }
  };

  // BUG-10 FIX: Step 1 — send OTP to the new email
  const handleRequestEmailChange = async () => {
    if (!pendingNewEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pendingNewEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setEmailChangeSending(true);
    try {
      const res = await userAPI.requestEmailChange(pendingNewEmail);
      toast.success(res.message);
      setEmailChangeStep('enterOtp');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setEmailChangeSending(false);
    }
  };

  // BUG-10 FIX: Step 2 — verify OTP and commit email change
  const handleConfirmEmailChange = async () => {
    if (!emailChangeOtp.trim()) {
      toast.error('Please enter the verification code.');
      return;
    }
    setEmailChangeSending(true);
    try {
      const res = await userAPI.confirmEmailChange(pendingNewEmail, emailChangeOtp);
      toast.success(res.message);
      setEmail(pendingNewEmail);
      await refreshUser();
      setEmailChangeStep('idle');
      setPendingNewEmail('');
      setEmailChangeOtp('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setEmailChangeSending(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!PASSWORD_REGEX.test(newPassword)) {
      toast.error('New password must be at least 8 characters, and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Confirm password does not match new password.');
      return;
    }

    try {
      await userAPI.changePassword({ currentPassword, newPassword });
      toast.success('Your account password was updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to update password.';
      toast.error(errMsg);
    }
  };

  const handlePreferenceSave = (key: string, value: string | number | boolean) => {
    localStorage.setItem(key, value.toString());
    toast.success('Settings updated and saved locally.');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 text-left">
      {/* Settings Title */}
      <div className="flex items-center gap-3 border-b border-pulseBorder dark:border-slate-800 pb-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-primary animate-spin-slow" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure your Pulse health account preferences, map metrics, and scan security options</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="md:col-span-1 flex flex-col gap-1.5">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all ${
              activeTab === 'profile' 
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
            }`}
          >
            <User className="w-4 h-4" /> Profile & Account
          </button>
          
          <button 
            onClick={() => setActiveTab('appearance')}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all ${
              activeTab === 'appearance' 
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
            }`}
          >
            <Moon className="w-4 h-4" /> Appearance & Defaults
          </button>

          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all ${
              activeTab === 'notifications' 
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
            }`}
          >
            <Bell className="w-4 h-4" /> Alerts & Notifications
          </button>

          <button 
            onClick={() => setActiveTab('privacy')}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all ${
              activeTab === 'privacy' 
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
            }`}
          >
            <Shield className="w-4 h-4" /> Privacy & Security
          </button>
        </div>

        {/* Dynamic Content Panel */}
        <div className="md:col-span-3 space-y-6">
          
          {/* TAB 1: Profile & Account */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              
              {/* Profile details */}
              <div className="glass-panel p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-pulseBorder dark:border-slate-800 pb-3">
                  <User className="w-5 h-5 text-primary" /> Profile Details
                </h2>

                {!isEditingProfile ? (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-extrabold text-primary border border-primary/20">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center sm:text-left space-y-1">
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase">
                          {user.role}
                        </span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-full font-semibold">
                          Secure Login Enabled
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="sm:ml-auto px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-md shadow-primary/25 transition-all"
                    >
                      Edit Profile
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleProfileSave} className="space-y-5">
                    {/* Name field */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl glass-input text-xs max-w-sm"
                        placeholder="Your Name"
                      />
                    </div>

                    {/* Email — read-only display + OTP change flow (BUG-10 FIX) */}
                    <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-pulseBorder dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">Email Address</label>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{email}</span>
                        </div>
                        {emailChangeStep === 'idle' && (
                          <button
                            type="button"
                            onClick={() => setEmailChangeStep('enterEmail')}
                            className="px-3 py-1.5 text-[10px] font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg transition-all"
                          >
                            Change Email
                          </button>
                        )}
                      </div>

                      {/* Step 1: Enter new email */}
                      {emailChangeStep === 'enterEmail' && (
                        <div className="space-y-2 pt-2 border-t border-pulseBorder dark:border-slate-700">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">New Email Address</label>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={pendingNewEmail}
                              onChange={(e) => setPendingNewEmail(e.target.value)}
                              placeholder="new@email.com"
                              className="flex-1 px-3 py-2 rounded-xl glass-input text-xs"
                            />
                            <button
                              type="button"
                              onClick={handleRequestEmailChange}
                              disabled={emailChangeSending}
                              className="px-3 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all whitespace-nowrap"
                            >
                              {emailChangeSending ? 'Sending...' : 'Send Code'}
                            </button>
                            <button type="button" onClick={() => { setEmailChangeStep('idle'); setPendingNewEmail(''); }} className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-danger rounded-xl transition-all">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Enter OTP */}
                      {emailChangeStep === 'enterOtp' && (
                        <div className="space-y-2 pt-2 border-t border-pulseBorder dark:border-slate-700">
                          <p className="text-xs text-slate-500 dark:text-slate-400">A 6-digit code was sent to <strong className="text-slate-900 dark:text-white">{pendingNewEmail}</strong>. Enter it below to confirm the change.</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={emailChangeOtp}
                              onChange={(e) => setEmailChangeOtp(e.target.value.replace(/\D/g, ''))}
                              placeholder="6-digit code"
                              className="flex-1 px-3 py-2 rounded-xl glass-input text-xs font-mono tracking-widest text-center"
                            />
                            <button
                              type="button"
                              onClick={handleConfirmEmailChange}
                              disabled={emailChangeSending}
                              className="px-3 py-2 bg-success hover:bg-success/90 text-white text-xs font-bold rounded-xl transition-all whitespace-nowrap"
                            >
                              {emailChangeSending ? 'Verifying...' : 'Confirm'}
                            </button>
                            <button type="button" onClick={() => { setEmailChangeStep('idle'); setPendingNewEmail(''); setEmailChangeOtp(''); }} className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-danger rounded-xl transition-all">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setName(user.name);
                          setEmail(user.email);
                          setIsEditingProfile(false);
                          setEmailChangeStep('idle');
                        }}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Save Name
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Password update card */}
              <div className="glass-panel p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-pulseBorder dark:border-slate-800 pb-3">
                  <Lock className="w-5 h-5 text-primary" /> Update Password
                </h2>

                {user.authProvider === 'GOOGLE' ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-pulseBorder dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    Your account is registered using Google Sign-In. Password management is handled by Google.
                  </div>
                ) : (
                  <form onSubmit={handlePasswordSave} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                        placeholder="••••••••••••"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                          placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                          placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button 
                        type="submit"
                        className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-md shadow-primary/25 transition-all"
                      >
                        Update Password
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Signout Card */}
              <div className="glass-panel p-6 space-y-4 bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-slate-400" /> Session
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Sign out of your active account session on this device.</p>
                <button 
                  onClick={logout}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700 hover:border-danger/30 text-slate-700 dark:text-slate-300 hover:text-danger rounded-xl text-xs font-bold hover:bg-danger/5 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out Device
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Appearance & Defaults */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              
              {/* Theme Settings */}
              <div className="glass-panel p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-pulseBorder dark:border-slate-800 pb-3">
                  <Moon className="w-5 h-5 text-primary" /> Visual Layout & Theme
                </h2>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-pulseBorder dark:border-slate-800">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Theme Preference</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Toggle between dark mode and light mode aesthetics</p>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                  >
                    {isDarkMode ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </div>
              </div>

              {/* Map Preference Details */}
              <div className="glass-panel p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-pulseBorder dark:border-slate-800 pb-3">
                  <Map className="w-5 h-5 text-primary" /> Map & Discovery Defaults
                </h2>

                <div className="space-y-4">
                  {/* Default search radius */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Default Search Radius</span>
                      <span className="font-black text-primary">{searchRadius} km</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      step="5"
                      value={searchRadius}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSearchRadius(val);
                        handlePreferenceSave('pulse_pref_radius', val);
                      }}
                      className="w-full accent-primary bg-slate-100 dark:bg-slate-800 rounded-lg h-2"
                    />
                    <p className="text-[10px] text-slate-500">Sets the initial distance boundary for discovery maps.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Default Map Style */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Map Render Style</label>
                      <select
                        value={mapStyle}
                        onChange={(e) => {
                          setMapStyle(e.target.value);
                          handlePreferenceSave('pulse_pref_map_style', e.target.value);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-semibold"
                      >
                        <option value="clinical-light">Clinical Light Map</option>
                        <option value="charcoal-dark">Charcoal Dark Map</option>
                        <option value="streets-satellite">Satellite Overlay</option>
                      </select>
                    </div>


                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Alerts & Notifications */}
          {activeTab === 'notifications' && (
            <div className="glass-panel p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-pulseBorder dark:border-slate-800 pb-3">
                <Bell className="w-5 h-5 text-primary" /> Alerts & Communication Settings
              </h2>

              {/* BUG-09 FIX: Add clear notice that preferences are browser-local only */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-xs text-amber-700 dark:text-amber-400">
                <span className="text-base leading-none mt-0.5 shrink-0">⚠️</span>
                <p>
                  <strong className="font-bold">Note:</strong> These notification preferences are saved locally on this browser only. Clearing your browser data or switching devices will reset them. Server-side sync will be available in a future update.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-pulseBorder dark:border-slate-800">
                  <div className="pr-4">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">AI Analysis Completed</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Receive browser notifications immediately when your uploaded prescription OCR scanning completes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyOcr}
                    onChange={(e) => {
                      setNotifyOcr(e.target.checked);
                      handlePreferenceSave('pulse_pref_notify_ocr', e.target.checked);
                    }}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary mt-1"
                  />
                </div>

                <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-pulseBorder dark:border-slate-800">
                  <div className="pr-4">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Weekly Health Summaries</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Subscribe to weekly health trends summary charting your Hemoglobin, HbA1c and Thyroid counts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyWeekly}
                    onChange={(e) => {
                      setNotifyWeekly(e.target.checked);
                      handlePreferenceSave('pulse_pref_notify_weekly', e.target.checked);
                    }}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary mt-1"
                  />
                </div>

                <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-pulseBorder dark:border-slate-800">
                  <div className="pr-4">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Emergency Alerts & Logs</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Receive SMS notifications if a designated emergency contact modifies your Panic list profile details</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyEmergency}
                    onChange={(e) => {
                      setNotifyEmergency(e.target.checked);
                      handlePreferenceSave('pulse_pref_notify_emergency', e.target.checked);
                    }}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary mt-1"
                  />
                </div>

                <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-pulseBorder dark:border-slate-800">
                  <div className="pr-4">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Nearby Emergency Notifications</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Get notified about newly opened clinical branches or general hospitals within your city area boundaries</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyNearby}
                    onChange={(e) => {
                      setNotifyNearby(e.target.checked);
                      handlePreferenceSave('pulse_pref_notify_nearby', e.target.checked);
                    }}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Privacy & Security */}
          {activeTab === 'privacy' && (
            <div className="glass-panel p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-pulseBorder dark:border-slate-800 pb-3">
                <Shield className="w-5 h-5 text-primary" /> HIPAA & Medical Data Privacy
              </h2>

              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-pulseBorder dark:border-slate-800">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">Auto-purge Uploaded PDFs</h3>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black px-2 py-0.5 rounded uppercase">HIPAA Compliant</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Automatically delete raw PDF prescription files from our servers after finishing AI text extraction. (Recommended)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoPurgePdf}
                    onChange={(e) => {
                      setAutoPurgePdf(e.target.checked);
                      handlePreferenceSave('pulse_pref_auto_purge', e.target.checked);
                    }}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary mt-1"
                  />
                </div>

                <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-pulseBorder dark:border-slate-800">
                  <div className="pr-4">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Store Search History</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Allow our database to retain your search history logging to personalize recommendations on the maps page</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={storeSearchHistory}
                    onChange={(e) => {
                      setStoreSearchHistory(e.target.checked);
                      handlePreferenceSave('pulse_pref_store_history', e.target.checked);
                    }}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary mt-1"
                  />
                </div>

                <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-pulseBorder dark:border-slate-800">
                  <div className="pr-4">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Cache Coordinates Caching</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enable caching coordinates locally on your browser to reduce loading time when switching navigation scopes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={cacheCoordinates}
                    onChange={(e) => {
                      setCacheCoordinates(e.target.checked);
                      handlePreferenceSave('pulse_pref_cache_coords', e.target.checked);
                    }}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary mt-1"
                  />
                </div>
              </div>

              {/* Delete Account Section */}
              <div className="mt-8 pt-6 border-t border-red-200 dark:border-red-900/30">
                <h3 className="font-bold text-sm text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
                  <Trash2 className="w-4 h-4" /> Danger Zone
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Permanently delete your account, medical records, and AI chat history. This action cannot be undone.
                </p>
                <Link
                  to="/delete-account"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition-colors border border-red-200 dark:border-red-900/50 w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Request Account Deletion
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
export default Settings;
