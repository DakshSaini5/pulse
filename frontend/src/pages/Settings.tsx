import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Settings as SettingsIcon, User, Moon, Sun, Bell, Shield, LogOut } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Manage your account and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1 space-y-1">
          <button className="w-full text-left px-4 py-2.5 rounded-lg bg-primary/10 text-primary font-semibold text-sm flex items-center gap-3">
            <User className="w-4 h-4" /> Profile & Account
          </button>
          <button className="w-full text-left px-4 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-sm flex items-center gap-3 transition-colors">
            <Moon className="w-4 h-4" /> Appearance
          </button>
          <button className="w-full text-left px-4 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-sm flex items-center gap-3 transition-colors">
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button className="w-full text-left px-4 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-sm flex items-center gap-3 transition-colors">
            <Shield className="w-4 h-4" /> Privacy & Security
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Profile Details
            </h2>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-500 dark:text-slate-300">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{user.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{user.email}</p>
              </div>
              <button className="ml-auto px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Edit Profile
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-pulseBorder dark:border-slate-700">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Account Role</label>
                <div className="text-sm font-medium text-slate-900 dark:text-white">{user.role}</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Authentication</label>
                <div className="text-sm font-medium text-slate-900 dark:text-white">Secure Login Enabled</div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Moon className="w-5 h-5 text-primary" /> Appearance
            </h2>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-pulseBorder dark:border-slate-700">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Theme Preference</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Switch between light and dark mode</p>
              </div>
              
              <button 
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-semibold text-sm text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>

          <div className="glass-panel p-6 space-y-4 border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <LogOut className="w-5 h-5 text-slate-400" />
              Session
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Sign out of your account on this device.</p>
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
