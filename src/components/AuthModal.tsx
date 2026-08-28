import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  LogOut, 
  Sparkles, 
  AlertCircle, 
  ArrowRight,
  CheckCircle2,
  Zap,
  Smartphone,
  BookOpen
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  loginWithEmail, 
  registerWithEmail, 
  signInWithGoogleAccount, 
  logoutUser 
} from '../services/authService';
import { FREE_CXR_LIMIT, FREE_CT_LIMIT } from '../services/paymentService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChanged: (user: UserProfile | null) => void;
  defaultTab?: 'login' | 'register';
  mpesaReceipt?: string;
  phoneNumber?: string;
  isPostPayment?: boolean;
  onOpenPayment?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  defaultTab = 'login',
  mpesaReceipt,
  phoneNumber,
  isPostPayment = false,
  onOpenPayment,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'register' || isPostPayment) {
        const res = await registerWithEmail(
          email,
          password,
          displayName,
          mpesaReceipt ? { mpesaReceiptNumber: mpesaReceipt, phoneNumber } : undefined
        );
        if (res.success && res.user) {
          onUserChanged(res.user);
          if (res.user.isPremium) {
            setSuccessMessage('Lifetime Pro account created! Your access is permanently saved.');
          } else {
            setSuccessMessage(`Account created! Welcome to the RadMed Free Tier (${FREE_CXR_LIMIT} CXR & ${FREE_CT_LIMIT} CT cases).`);
          }
          setTimeout(() => {
            onClose();
          }, 1400);
        } else {
          setError(res.error || 'Registration failed.');
        }
      } else {
        const res = await loginWithEmail(email, password);
        if (res.success && res.user) {
          onUserChanged(res.user);
          if (res.user.isPremium) {
            setSuccessMessage(`Welcome back, ${res.user.displayName || 'Doctor'}! Lifetime Pro access restored.`);
          } else {
            setSuccessMessage(`Welcome back, ${res.user.displayName || 'Doctor'}! Signed in to Free Tier.`);
          }
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setError(res.error || 'Login failed.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const res = await signInWithGoogleAccount(
        mpesaReceipt ? { mpesaReceiptNumber: mpesaReceipt, phoneNumber } : undefined
      );
      if (res.success && res.user) {
        onUserChanged(res.user);
        if (res.user.isPremium) {
          setSuccessMessage('Signed in with Google! Lifetime Pro access restored.');
        } else {
          setSuccessMessage(`Signed in with Google! Active on Free Tier (${FREE_CXR_LIMIT} CXR & ${FREE_CT_LIMIT} CT cases).`);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.error || 'Google sign-in failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in error.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    onUserChanged(null);
    setSuccessMessage('Logged out successfully.');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* If User is Already Logged In */}
        {currentUser && !isPostPayment ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center mx-auto mb-4 shadow-lg">
              <UserIcon className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {currentUser.displayName || 'Medical Professional'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {currentUser.email}
            </p>

            {currentUser.isPremium ? (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-left">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Lifetime Pro Active</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Your account has full unrestricted access to all chest X-rays, head CTs, diagnostic findings, and CME templates.
                </p>
                {currentUser.mpesaReceiptNumber && (
                  <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                    M-Pesa Receipt: {currentUser.mpesaReceiptNumber}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                    <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Free Tier Account</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold">
                    {FREE_CXR_LIMIT} CXR & {FREE_CT_LIMIT} CT Free
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  You are on the free clinician plan. Upgrade anytime via Lipa Na M-Pesa to unlock all cases and reporting templates with lifetime access.
                </p>
                {onOpenPayment && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPayment();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Upgrade to Lifetime Pro (KES 1,000)</span>
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out of Account
            </button>
          </div>
        ) : (
          /* Sign In / Register Form */
          <div>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-950/40 border border-blue-400/30 text-blue-100 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-300" />
                  {isPostPayment ? 'Payment Verified' : 'RadMed Clinician Account'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
                {isPostPayment 
                  ? 'Create Your Lifetime Account' 
                  : tab === 'login' 
                  ? 'Sign In to RadMed' 
                  : 'Create Free Account'}
              </h2>
              <p className="text-xs text-blue-100 leading-relaxed">
                {isPostPayment
                  ? 'Set your password to permanently save your lifetime access across all your devices.'
                  : tab === 'login'
                  ? 'Log in to sync your account, progress, and lifetime access across all your devices.'
                  : `Anyone can create a free account with ${FREE_CXR_LIMIT} free Chest X-rays & ${FREE_CT_LIMIT} Head CTs. Paid members receive full access.`}
              </p>
            </div>

            {/* Post payment badge */}
            {isPostPayment && mpesaReceipt && (
              <div className="bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800/80 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  M-Pesa Receipt: {mpesaReceipt}
                </span>
                <span className="text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                  Lifetime Pro
                </span>
              </div>
            )}

            {/* Tab switchers if not in post-payment mode */}
            {!isPostPayment && (
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setTab('login'); setError(''); }}
                  className={`flex-1 py-3 text-xs font-bold text-center transition-colors ${
                    tab === 'login'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('register'); setError(''); }}
                  className={`flex-1 py-3 text-xs font-bold text-center transition-colors ${
                    tab === 'register'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Create Account (Free Tier)
                </button>
              </div>
            )}

            <div className="p-6">
              {/* Free tier info callout on registration tab */}
              {tab === 'register' && !isPostPayment && (
                <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 leading-relaxed flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Free Tier Access:</strong> Non-paid accounts can review 5 Chest X-ray cases & 2 Head CT scans. Paid members get full access to all cases.
                  </div>
                </div>
              )}

              {/* Error & Success alerts */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {successMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Email Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                {(tab === 'register' || isPostPayment) && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name / Title (Optional)
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Dr. Wangechi"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@hospital.org"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password (min. 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <span>
                        {isPostPayment 
                          ? 'Save Lifetime Pro Account' 
                          : tab === 'login' 
                          ? 'Sign In' 
                          : `Create Free Account (${FREE_CXR_LIMIT} Free Cases)`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Or Google Sign In */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Skip option for post-payment */}
              {isPostPayment && (
                <div className="text-center mt-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline"
                  >
                    Skip for now (Your lifetime access is already active on this browser)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
