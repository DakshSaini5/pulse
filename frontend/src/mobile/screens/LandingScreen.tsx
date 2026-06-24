// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@core/context/AuthContext';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { LogIn, Mail, Lock, ShieldAlert, Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck, Brain, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Login Screen ─────────────────────────────────────────
// Matches the website's Login.tsx design but styled for dark mobile app
export function LoginScreen() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: '367526945989-ebnif0f9q0s080kab2clgd42d10qqhok.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    }
  }, []);

  const handleNativeGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await GoogleAuth.signIn();
      await googleLogin(user.authentication.idToken);
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(identifier, password);
      navigate('/home');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col">
      {/* Top decorative gradient */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-[#1E60D5]/20 via-[#0B0F19] to-transparent pointer-events-none" />
      <div className="absolute top-12 right-8 w-40 h-40 bg-[#1E60D5]/10 rounded-full blur-[60px] pointer-events-none" />

      <div className="flex-1 flex flex-col justify-center px-6 py-10 relative z-10">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E60D5] to-[#3B82F6] flex items-center justify-center shadow-lg shadow-[#1E60D5]/30 mb-4">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to Pulse</h1>
          <p className="text-sm text-slate-400 mt-1">Your AI-powered health companion</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-start gap-2 animate-pulse">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email/Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email or Mobile Number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-[#1E293B]/80 border border-slate-700/60 rounded-xl text-white text-sm font-medium placeholder:text-slate-500 focus:border-[#1E60D5] focus:ring-2 focus:ring-[#1E60D5]/20 outline-none transition-all"
                placeholder="name@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3.5 bg-[#1E293B]/80 border border-slate-700/60 rounded-xl text-white text-sm font-medium placeholder:text-slate-500 focus:border-[#1E60D5] focus:ring-2 focus:ring-[#1E60D5]/20 outline-none transition-all"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-[#1E60D5] hover:bg-[#1a54bd] text-white text-sm font-bold shadow-lg shadow-[#1E60D5]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-slate-700/60" />
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">or continue with</span>
          <div className="flex-1 h-px bg-slate-700/60" />
        </div>

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleNativeGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-[#1E293B]/60 border border-slate-700/60 rounded-xl hover:bg-[#1E293B] transition-colors font-medium text-slate-200 disabled:opacity-50 active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Footer */}
        <div className="mt-8 text-center space-y-3">
          <p className="text-[10px] text-slate-500">
            By continuing, you agree to our{' '}
            <span className="underline text-slate-400">Privacy Policy</span>
          </p>
        </div>
      </div>

      {/* Bottom trust badges */}
      <div className="px-6 pb-8 flex items-center justify-center gap-6">
        <div className="flex items-center gap-1.5 text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-medium">HIPAA Safe</span>
        </div>
        <div className="w-px h-3 bg-slate-700" />
        <div className="flex items-center gap-1.5 text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-[#1E60D5]" />
          <span className="text-[10px] font-medium">Pulse AI</span>
        </div>
        <div className="w-px h-3 bg-slate-700" />
        <div className="flex items-center gap-1.5 text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-red-400" />
          <span className="text-[10px] font-medium">Live Data</span>
        </div>
      </div>
    </div>
  );
}

// Keep backward compat export
export { LoginScreen as LandingScreen };
