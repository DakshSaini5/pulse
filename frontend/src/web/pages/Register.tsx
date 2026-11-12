import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@core/context/AuthContext';
import { authAPI } from '@core/services/api';
import { GoogleLogin } from '@react-oauth/google';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { UserPlus, Mail, Lock, User, ShieldAlert, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { PulseLogo } from '@web/components/PulseLogo';

export const Register: React.FC = () => {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'INPUT' | 'OTP'>('INPUT');
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    document.title = 'Create account | Pulse';
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCooldown]);

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
      const user = await GoogleAuth.signIn();
      await googleLogin(user.authentication.idToken);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Native Google Sign-Up failed.');
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
      setError(err.response?.data?.message || 'Google Sign-Up failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !mobileNumber || !password) {
      setError('Please fill in all registration fields.');
      return;
    }
    
    if (mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!PASSWORD_REGEX.test(password)) {
      setError('Password must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.sendRegisterOTP(email);
      setStep('OTP');
      setResendCooldown(30);
      
      if (res.devOtpFallback) {
        toast.success(`DEV MODE OTP: ${res.devOtpFallback}`, { duration: 8000 });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError(null);
    try {
      await authAPI.sendRegisterOTP(email);
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    const fullMobileNumber = `+91${mobileNumber}`;

    setLoading(true);
    setError(null);
    try {
      await register(name, email, fullMobileNumber, password, code);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Try checking your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-surface dark:bg-slate-950">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        
        <div className="flex flex-col items-center text-center space-y-2">
          <PulseLogo size={48} variant="vertical" showTagline={false} />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white pt-2">Create an account</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Create an account to save your reports and compare hospitals.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-up at top */}
        {step === 'INPUT' && (
          <div className="space-y-3">
            <div className="flex justify-center w-full">
              {!Capacitor.isNativePlatform() ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Sign-Up failed. Please try again.')}
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
              <span className="flex-shrink mx-4 text-xs text-slate-400 font-semibold uppercase tracking-wider">or sign up with email</span>
              <div className="flex-grow border-t border-pulseBorder dark:border-slate-800"></div>
            </div>
          </div>
        )}

        <form className="space-y-4" onSubmit={step === 'INPUT' ? handleRequestOTP : handleVerifyOTP}>
          {step === 'INPUT' ? (
            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-pulseBorder dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-pulseBorder dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label htmlFor="mobile" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 border-r border-pulseBorder dark:border-slate-700 pr-2 pointer-events-none">
                    <span>+91</span>
                  </div>
                  <input
                    id="mobile"
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setMobileNumber(val);
                    }}
                    className="w-full pl-16 pr-4 py-3 rounded-xl border border-pulseBorder dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
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
                    placeholder="Create a password"
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

                {password && (
                  <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-pulseBorder dark:border-slate-700 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Password requirements:</div>
                    <div className="flex items-center gap-1.5">
                      <span className={password.length >= 8 ? "text-emerald-600 font-bold" : "text-slate-400"}>
                        {password.length >= 8 ? "✓" : "○"} At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={/[A-Z]/.test(password) ? "text-emerald-600 font-bold" : "text-slate-400"}>
                        {/[A-Z]/.test(password) ? "✓" : "○"} One uppercase letter (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={/[a-z]/.test(password) ? "text-emerald-600 font-bold" : "text-slate-400"}>
                        {/[a-z]/.test(password) ? "✓" : "○"} One lowercase letter (a-z)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={(/[0-9]/.test(password) && /[@$!%*?&]/.test(password)) ? "text-emerald-600 font-bold" : "text-slate-400"}>
                        {(/[0-9]/.test(password) && /[@$!%*?&]/.test(password)) ? "✓" : "○"} One number & one special symbol (@$!%*?&)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Privacy assurance per Developer Brief */}
              <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-pulseBorder dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  We use your phone number only to verify your account with an OTP. We never sell your health data. Read our{' '}
                  <Link to="/privacy" className="text-primary underline">
                    Privacy Policy
                  </Link>.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                <Mail className="w-4 h-4" />
                {loading ? 'Sending code...' : 'Get started'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center space-y-1.5">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  We sent a 6-digit verification code to
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 py-1.5 px-3 rounded-lg inline-block">
                  {email}
                </p>
              </div>

              <div className="space-y-1 text-left">
                <label htmlFor="code" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Verification Code
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="code"
                    type="text"
                    required
                    value={code}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCode(val);
                    }}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-pulseBorder dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base font-bold tracking-[0.2em] text-center focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                <UserPlus className="w-4 h-4" />
                {loading ? 'Verifying...' : 'Verify & create account'}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('INPUT');
                    setError(null);
                  }}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                >
                  ← Edit details
                </button>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleResendOTP}
                  className="text-primary hover:underline font-semibold disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="text-center pt-2 space-y-2 border-t border-pulseBorder dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            By signing up, you agree to our{' '}
            <Link to="/terms" className="underline hover:text-slate-800 dark:hover:text-slate-200">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline hover:text-slate-800 dark:hover:text-slate-200">
              Privacy Policy
            </Link>.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
