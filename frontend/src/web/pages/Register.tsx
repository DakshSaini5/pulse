import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@core/context/AuthContext';
import { authAPI } from '@core/services/api';
import { GoogleLogin } from '@react-oauth/google';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { UserPlus, Mail, Lock, User, Phone, ShieldAlert, Eye, EyeOff } from 'lucide-react';
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
      setError('Password must be at least 8 characters, and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.sendRegisterOTP(email);
      setStep('OTP');
      setResendCooldown(30);
      
      // Handle dev mode bypass
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
      const res = await authAPI.sendRegisterOTP(email);
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
    <div className="min-h-[70vh] flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-panel border border-slate-200 dark:border-slate-700 p-5 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden bg-white dark:bg-slate-900">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />

        <div className="flex flex-col items-center space-y-2">
          <PulseLogo size={54} variant="vertical" showTagline={true} />
          <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">Unlock your interactive clinical reports and specialist routers</p>
        </div>

        {error && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger flex items-start gap-2 animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={step === 'INPUT' ? handleRequestOTP : handleVerifyOTP}>
          {step === 'INPUT' ? (
            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <label htmlFor="name" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-base placeholder-slate-500 font-medium"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label htmlFor="email" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-base placeholder-slate-500 font-medium"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label htmlFor="mobile" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mobile Number</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 pr-2 pointer-events-none">
                    <span>🇮🇳</span>
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
                    className="w-full pl-16 pr-4 py-3 rounded-xl glass-input text-xs placeholder-slate-500 font-medium"
                    placeholder="Enter your 10-digit number"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label htmlFor="password" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl glass-input text-xs placeholder-slate-500 font-medium"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {password && (
                  <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] space-y-1 text-slate-600 dark:text-slate-400">
                    <div className="font-semibold uppercase tracking-wider text-[9px] mb-1">Password Requirements:</div>
                    <div className="flex items-center gap-1.5">
                      <span className={password.length >= 8 ? "text-emerald-500 font-bold" : "text-slate-400"}>
                        {password.length >= 8 ? "✓" : "○"} At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={/[A-Z]/.test(password) ? "text-emerald-500 font-bold" : "text-slate-400"}>
                        {/[A-Z]/.test(password) ? "✓" : "○"} One uppercase letter (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={/[a-z]/.test(password) ? "text-emerald-500 font-bold" : "text-slate-400"}>
                        {/[a-z]/.test(password) ? "✓" : "○"} One lowercase letter (a-z)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={(/[0-9]/.test(password) && /[@$!%*?&]/.test(password)) ? "text-emerald-500 font-bold" : "text-slate-400"}>
                        {(/[0-9]/.test(password) && /[@$!%*?&]/.test(password)) ? "✓" : "○"} One number & one special character (@$!%*?&)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                <Mail className="w-4 h-4" />
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center space-y-1.5">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We have sent a 6-digit verification code to
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800/40 py-1.5 px-3 rounded-lg inline-block border border-slate-100 dark:border-slate-800/60">
                  {email}
                </p>
              </div>

              <div className="space-y-1 text-left">
                <label htmlFor="code" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verification Code</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400">
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
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-xs placeholder-slate-500 font-bold tracking-[0.2em] text-center"
                    placeholder="------"
                    maxLength={6}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                <UserPlus className="w-4 h-4" />
                {loading ? 'Verifying Code...' : 'Verify & Create Account'}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('INPUT');
                    setError(null);
                  }}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-semibold transition-colors"
                >
                  ← Edit details
                </button>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleResendOTP}
                  className="text-primary hover:underline font-bold disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed transition-colors"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Quick Demo Logins block */}
        <div className="space-y-3 pt-2">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">OR CONTINUE WITH</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          <div className="flex justify-center w-full">
            {!Capacitor.isNativePlatform() ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Sign-Up failed. Please try again.')}
                useOneTap
                theme="outline"
                size="large"
                shape="pill"
                text="continue_with"
              />
            ) : (
              <button
                type="button"
                onClick={handleNativeGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50"
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
        </div>

        <div className="text-center pt-2">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2">
            By continuing, you agree to our <Link to="/privacy" className="underline hover:text-slate-500 dark:hover:text-slate-400">Privacy Policy</Link>.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have a login?{' '}
            <Link to="/login" className="text-primary hover:underline font-bold">Sign In Instead</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
