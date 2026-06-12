import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Mail, 
  Phone, 
  MessageSquare, 
  KeyRound, 
  Lock, 
  CheckCircle2, 
  ArrowLeft,
  LogIn
} from 'lucide-react';
import { PulseLogo } from '@web/components/PulseLogo';
import { authAPI } from '@core/services/api';
import toast from 'react-hot-toast';

type RecoveryStep = 'METHOD' | 'OTP' | 'RESET' | 'SUCCESS';

export const Forgot: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<RecoveryStep>('METHOD');
  
  // Form Inputs
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Verification Contexts
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [mockOTPAlert, setMockOTPAlert] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  React.useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(c => c - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Request Code
  const handleRequestCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email) throw new Error('Please enter your registered email address.');
      
      // Request Email Code via Resend (or console log fallback)
      await authAPI.requestEmailOTP(email);
      
      // Always mock code locally for developer convenience
      const mockCode = '123456';
      setMockOTPAlert(mockCode);
      toast.success('Verification code sent to your email.');
      setCooldown(30);
      setStep('OTP');
    } catch (err: any) {
      console.error('Request code error:', err);
      setError(err.response?.data?.message || err.message || 'Verification request failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP Code
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Verify via backend Resend validator
      const result = await authAPI.verifyEmailOTP(email, otpCode);
      setResetToken(result.resetToken);
      setStep('RESET');
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError(err.response?.data?.message || err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!PASSWORD_REGEX.test(newPassword)) {
      setError('Password must be at least 8 characters, and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await authAPI.resetPassword({
        newPassword,
        resetToken: resetToken || undefined
      });
      
      setStep('SUCCESS');
      toast.success('Password updated successfully!');
    } catch (err: any) {
      console.error('Password reset submit error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white border border-slate-200 dark:border-slate-700 rounded-3xl p-8 sm:p-10 shadow-ambient relative overflow-hidden dark:bg-slate-900">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />

        <div className="flex flex-col items-center space-y-2">
          <PulseLogo size={54} variant="vertical" showTagline={true} />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">Password Recovery</h2>
        </div>

        {error && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger flex items-start gap-2 animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: REQUEST OTP */}
        {step === 'METHOD' && (
          <form className="space-y-5" onSubmit={handleRequestCode}>
            <div className="space-y-1 text-left animate-fadeIn">
              <label htmlFor="recovery-email" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Registered Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="recovery-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 glass-input text-xs font-medium"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageSquare className="w-4 h-4" />
              {loading ? 'Sending Verification Code...' : 'Send Recovery OTP'}
            </button>
          </form>
        )}

        {/* STEP 2: ENTER OTP */}
        {step === 'OTP' && (
          <form className="space-y-5 animate-fadeIn" onSubmit={handleVerifyOTP}>
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl text-center">
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Enter the code sent to{' '}
                <strong>{email}</strong>
              </span>
              {mockOTPAlert && (
                <div className="mt-2.5 text-xs font-bold text-primary bg-primary/10 p-2 rounded-lg border border-primary/20">
                  Developer Mock OTP: {mockOTPAlert}
                </div>
              )}
            </div>

            <div className="space-y-1 text-left">
              <label htmlFor="recovery-otp" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verification Code</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  id="recovery-otp"
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 glass-input text-xs font-bold tracking-[6px] text-center"
                  placeholder="000000"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Confirming Code...' : 'Verify Code'}
            </button>

            <button
              type="button"
              disabled={cooldown > 0 || loading}
              onClick={() => handleRequestCode()}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Resend OTP Code'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('METHOD');
                setOtpCode('');
                setError(null);
                setMockOTPAlert(null);
              }}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </form>
        )}

        {/* STEP 3: RESET PASSWORD */}
        {step === 'RESET' && (
          <form className="space-y-5 animate-fadeIn" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <label htmlFor="new-password" className="text-xs font-semibold text-slate-500 dark:text-slate-400">New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="new-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 glass-input text-xs font-medium"
                    placeholder="Create a strong password"
                  />
                </div>

                {newPassword && (
                  <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] space-y-1 text-slate-600 dark:text-slate-400">
                    <div className="font-semibold uppercase tracking-wider text-[9px] mb-1">Password Requirements:</div>
                    <div className="flex items-center gap-1.5">
                      <span className={newPassword.length >= 8 ? "text-emerald-500 font-bold" : "text-slate-400"}>
                        {newPassword.length >= 8 ? "✓" : "○"} At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={/[A-Z]/.test(newPassword) ? "text-emerald-500 font-bold" : "text-slate-400"}>
                        {/[A-Z]/.test(newPassword) ? "✓" : "○"} One uppercase letter (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={/[a-z]/.test(newPassword) ? "text-emerald-500 font-bold" : "text-slate-400"}>
                        {/[a-z]/.test(newPassword) ? "✓" : "○"} One lowercase letter (a-z)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={(/[0-9]/.test(newPassword) && /[@$!%*?&]/.test(newPassword)) ? "text-emerald-500 font-bold" : "text-slate-400"}>
                        {(/[0-9]/.test(newPassword) && /[@$!%*?&]/.test(newPassword)) ? "✓" : "○"} One number & one special character (@$!%*?&)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1 text-left">
                <label htmlFor="confirm-password" className="text-xs font-semibold text-slate-500 dark:text-slate-400">Confirm New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 glass-input text-xs font-medium"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'SUCCESS' && (
          <div className="space-y-5 text-center animate-fadeIn py-4">
            <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4 border border-success/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Password Updated!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Your password has been successfully reset. You can now log in using your new credentials.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              Back to Login
            </button>
          </div>
        )}

        {step !== 'SUCCESS' && (
          <div className="text-center pt-2">
            <Link to="/login" className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-all font-semibold flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
