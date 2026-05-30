import React, { useState, useEffect } from 'react';
import { userAPI, UserProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, Activity, FileText, Lock, Save, Trash2, AlertTriangle, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const fetchProfile = async () => {
      try {
        const data = await userAPI.getProfile();
        setProfile(data);
        setName(data.name);
        setEmail(data.email);
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await userAPI.updateProfile({ name, email });
      setProfile(prev => prev ? { ...prev, ...updated } : null);
      
      // Update local storage user data
      const stored = localStorage.getItem('pulse_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('pulse_user', JSON.stringify({ ...parsed, name: updated.name, email: updated.email }));
      }
      
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match');
    }
    
    setChangingPassword(true);
    try {
      await userAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await userAPI.deleteAccount();
      toast.success('Account deleted successfully');
      logout();
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="text-left space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          <User className="text-primary w-8 h-8" />
          My Profile
        </h1>
        <p className="text-xs text-slate-500">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Column: Stats & Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 text-center relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
            
            <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto mb-4 border-4 border-white shadow-sm flex items-center justify-center text-primary text-3xl font-extrabold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            
            <h2 className="text-lg font-bold text-slate-900">{profile.name}</h2>
            <p className="text-sm text-slate-500">{profile.email}</p>
            
            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-2 text-left">
              <div className="p-3 bg-white rounded-xl border border-slate-100 flex flex-col gap-1 items-center justify-center">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-lg font-extrabold text-slate-900">{profile._count.prescriptions}</span>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider text-center leading-tight">Prescription<br/>Scans</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-100 flex flex-col gap-1 items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-lg font-extrabold text-slate-900">{profile._count.medicalReports}</span>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider text-center leading-tight">Report<br/>Analyses</span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Account Info</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Member Since</span>
                  <span className="text-slate-900 font-medium">{new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Account Role</span>
                  <span className="text-slate-900 font-medium">{profile.role}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Authentication</span>
                  <span className="text-slate-900 font-medium">{profile.authProvider === 'GOOGLE' ? 'Google Sign-In' : 'Email/Password'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Personal Details
            </h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-slate-900 text-sm font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {profile.authProvider !== 'GOOGLE' && (
            <div className="glass-panel rounded-3xl p-6 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                Change Password
              </h3>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5 max-w-md">
                  <label className="text-xs font-bold text-slate-700 uppercase">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 text-sm"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 text-sm"
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 text-sm"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
                
                <div className="flex justify-start pt-2">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-6 py-2.5 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 text-sm font-bold rounded-xl flex items-center gap-2 transition-colors"
                  >
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="glass-panel rounded-3xl p-6 border border-danger/20 bg-danger/5">
            <h3 className="text-sm font-bold text-danger uppercase tracking-wider mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Once you delete your account, there is no going back. All your uploaded prescriptions, reports, and health trends will be permanently deleted.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-2.5 bg-danger hover:bg-danger/90 text-white text-sm font-bold rounded-xl shadow-lg shadow-danger/20 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95">
            <div className="w-12 h-12 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Delete Account?</h3>
            <p className="text-center text-slate-500 text-sm mb-6">
              This action cannot be undone. This will permanently delete your account and remove your data from our servers.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2.5 bg-danger hover:bg-danger/90 text-white font-bold rounded-xl shadow-lg shadow-danger/20 transition-all"
              >
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
