import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { LogIn, Mail, Lock, ShieldAlert, CheckCircle, Phone, MessageSquare, KeyRound } from 'lucide-react';
import { PulseLogo } from '../components/PulseLogo';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    setError(null);
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please fill in all standard credential fields.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(identifier, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-ambient relative overflow-hidden dark:bg-slate-900">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />

        <div className="flex flex-col items-center space-y-2">
          <PulseLogo size={54} variant="vertical" showTagline={true} />
          <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">Unlock custom health scanning and provider mappings</p>
        </div>

        {error && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger flex items-start gap-2 animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Standard Password Login Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-1 text-left">
              <label htmlFor="identifier" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email Address or Mobile Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 glass-input text-base font-medium"
                  placeholder="name@example.com or +919999999999"
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Password</label>
                <Link to="/forgot" className="text-[10px] text-primary hover:underline font-semibold">Forgot Password?</Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 glass-input text-base font-medium"
                  placeholder="••••••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Authenticating Session...' : 'Sign In with Password'}
          </button>
        </form>

        {/* Quick Demo Logins block */}
        <div className="space-y-3 pt-2">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-pulseBorder dark:border-slate-700"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">OR CONTINUE WITH</span>
            <div className="flex-grow border-t border-pulseBorder dark:border-slate-700"></div>
          </div>

          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign-In failed. Please try again.')}
              useOneTap
              theme="outline"
              size="large"
              shape="pill"
              text="continue_with"
            />
          </div>


        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don't have a login?{' '}
            <Link to="/register" className="text-primary hover:underline font-bold">Create Free Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
