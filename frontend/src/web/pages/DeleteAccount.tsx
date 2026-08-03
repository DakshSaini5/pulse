import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Trash2, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../core/services/api';

export const DeleteAccount: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please provide both email and password to verify your identity.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify credentials via login
      const loginRes = await api.post('/auth/login', { email, password });
      const token = loginRes.data.token;

      // 2. Proceed with deletion using the token
      await api.delete('/user/account', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(true);
    } catch (err: any) {
      console.error('Delete account error:', err);
      setError(err.response?.data?.message || 'Failed to verify credentials or delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Pulse Healthcare</span>
        </Link>
        
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center text-red-600 mb-4">
            <Trash2 className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Request Account Deletion
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
          In compliance with Google Play and App Store data safety policies, you can request full deletion of your account and medical data.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-2xl sm:px-10 border border-slate-100 dark:border-slate-700/50">
          
          {success ? (
            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center text-green-600 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Account Deleted</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Your Pulse account, medical reports, prescriptions, and AI chat history have been permanently deleted from our servers.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-lg mb-6 flex gap-3">
                <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-sm text-red-800 dark:text-red-300">
                  <p className="font-bold mb-1">Warning: This action is permanent.</p>
                  <p>All your medical records, chat history, and profile data will be permanently wiped from our databases and Cloudinary storage. This cannot be undone.</p>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleDeleteRequest}>
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm font-medium border border-red-100 dark:border-red-800 text-center animate-in shake">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Email address</label>
                  <div className="mt-1">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  <div className="mt-1">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                      placeholder="Verify your password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Deleting Account...
                    </>
                  ) : (
                    'Permanently Delete My Account'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
