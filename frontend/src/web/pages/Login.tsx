import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@core/context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { LogIn, Mail, Lock, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { PulseLogo } from '@web/components/PulseLogo';

export const Login: React.FC = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Sign in | Pulse';
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
      const user = await GoogleAuth.signIn();
      await googleLogin(user.authentication.idToken);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Native Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-surface dark:bg-slate-950">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        
        <div className="flex flex-col items-center text-center space-y-2">
          <PulseLogo size={48} variant="vertical" showTagline={false} />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white pt-2">Sign in to Pulse</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sign in to save your reports and compare hospitals.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-in placed at top */}
        <div className="space-y-3">
          <div className="flex justify-center w-full">
            {!Capacitor.isNativePlatform() ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Sign-In failed. Please try again.')}
                useOneTap
                theme="outline"
                size="large"
                shape="rectangular"
                width="100%"
                text="continue_with"
              />
            ) : (
              <button
                type="button"
                onClick={handleNativeGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-pulseBorder dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm text-slate-700 dark:text-slate-200 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            )}
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-pulseBorder dark:border-slate-800"></div>
            <span className="flex-shrink mx-4 text-xs text-slate-400 font-semibold uppercase tracking-wider">or sign in with email</span>
            <div className="flex-grow border-t border-pulseBorder dark:border-slate-800"></div>
          </div>
        </div>

        {/* Standard Password Login Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1 text-left">
            <label htmlFor="identifier" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email or Mobile Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-pulseBorder dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="name@example.com or 10-digit number"
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link to="/forgot" className="text-xs text-primary hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-pulseBorder dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="text-center pt-2 space-y-2 border-t border-pulseBorder dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            By continuing, you agree to our{' '}
            <Link to="/privacy" className="underline hover:text-slate-800 dark:hover:text-slate-200">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link to="/terms" className="underline hover:text-slate-800 dark:hover:text-slate-200">
              Terms
            </Link>.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
