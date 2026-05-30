import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Activity, LogIn, Mail, Lock, ShieldAlert, CheckCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    setError(null);
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/search');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all standard credential fields.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/search');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill triggers for smooth developer evaluations
  const handleQuickLogin = (role: 'user' | 'admin') => {
    if (role === 'user') {
      setEmail('user@pulse.com');
      setPassword('userpassword123');
    } else {
      setEmail('admin@pulse.com');
      setPassword('adminpassword123');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-panel border border-slate-200 p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100/50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />

        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <Activity className="w-6 h-6 text-slate-900 animate-pulse" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Sign in to Pulse</h2>
          <p className="text-xs text-slate-500">Unlock custom health scanning and provider mappings</p>
        </div>

        {error && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger flex items-start gap-2 animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-1 text-left">
              <label htmlFor="email" className="text-xs font-semibold text-slate-500">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-xs text-slate-900 placeholder-slate-500 font-medium"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-semibold text-slate-500">Password</label>
                <Link to="/forgot" className="text-[10px] text-primary hover:underline font-semibold">Forgot?</Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-xs text-slate-900 placeholder-slate-500 font-medium"
                  placeholder="••••••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-slate-900 text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Authenticating Session...' : 'Sign In Now'}
          </button>
        </form>

        {/* Quick Demo Logins block */}
        <div className="space-y-3 pt-2">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">OR CONTINUE WITH</span>
            <div className="flex-grow border-t border-slate-200"></div>
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

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Zero Config Dev Shortcut</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleQuickLogin('user')}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-primary/20 bg-slate-50 hover:bg-primary/5 transition-all text-[11px] font-semibold text-slate-600 hover:text-primary flex items-center justify-center gap-1.5 group"
            >
              <CheckCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              Demo User
            </button>
            <button
              onClick={() => handleQuickLogin('admin')}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-warning/20 bg-slate-50 hover:bg-warning/5 transition-all text-[11px] font-semibold text-slate-600 hover:text-warning flex items-center justify-center gap-1.5 group"
            >
              <CheckCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              Demo Admin
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Don't have a login?{' '}
            <Link to="/register" className="text-primary hover:underline font-bold">Create Free Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
