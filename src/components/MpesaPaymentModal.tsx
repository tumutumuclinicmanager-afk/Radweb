import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CreditCard,
  Layers,
  ArrowRight,
  RefreshCw,
  QrCode,
  Mail,
  User as UserIcon,
  KeyRound,
  LogIn
} from 'lucide-react';
import { 
  initiateMpesaStkPush, 
  pollPaymentStatus, 
  verifyManualMpesaCode, 
  savePremiumStatus,
  fetchPaymentConfig,
  FREE_CXR_LIMIT,
  FREE_CT_LIMIT
} from '../services/paymentService';
import { 
  registerWithEmail, 
  signInWithGoogleAccount,
  loginWithEmail 
} from '../services/authService';
import { PaymentConfig, UserProfile } from '../types';

interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (profile?: UserProfile) => void;
  onOpenLoginModal?: () => void;
  triggerCategory?: string;
  triggerCaseTitle?: string;
  selectedCategory?: string;
  caseTitle?: string;
}

export const MpesaPaymentModal: React.FC<MpesaPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  onOpenLoginModal,
  triggerCategory,
  triggerCaseTitle,
  selectedCategory,
  caseTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'stk_push' | 'manual_code' | 'login' | 'other_providers'>('stk_push');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'push_sent' | 'checking' | 'success' | 'failed'>('idle');
  const [confirmedReceipt, setConfirmedReceipt] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(45);
  const [errorMessage, setErrorMessage] = useState('');

  // Account creation state after payment
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [accountError, setAccountError] = useState('');

  // Inline login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [config, setConfig] = useState<PaymentConfig>({
    freeCasesLimit: 5,
    premiumPriceKes: 1000,
    activeProvider: 'mpesa_daraja',
    darajaEnvironment: 'sandbox',
    darajaBusinessShortcode: '1661655',
    paybillOrTillNumber: '1661655',
    accountReference: 'RadMed Pro',
  });

  const displayCategory = triggerCategory || selectedCategory;
  const displayTitle = triggerCaseTitle || caseTitle;

  useEffect(() => {
    if (isOpen) {
      fetchPaymentConfig().then(setConfig);
      setPaymentStatus('idle');
      setErrorMessage('');
      setStatusMessage('');
      setCheckoutRequestId(null);
      setCountdown(45);
      setAccountCreated(false);
      setAccountError('');
      setLoginError('');
    }
  }, [isOpen]);

  // Handle countdown and polling when STK push is active
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let pollInterval: NodeJS.Timeout;

    if (paymentStatus === 'push_sent' && checkoutRequestId) {
      // Countdown timer
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setPaymentStatus('failed');
            setErrorMessage('Payment request timed out. Please try again or use the manual M-Pesa code tab.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Status polling every 2.5 seconds
      pollInterval = setInterval(async () => {
        const result = await pollPaymentStatus(checkoutRequestId);
        if (result.isCompleted) {
          clearInterval(pollInterval);
          clearInterval(timer);
          const receipt = result.receiptNumber || 'MPESA_APPROVED';
          setConfirmedReceipt(receipt);
          setPaymentStatus('success');
          savePremiumStatus(receipt, phoneNumber, 'mpesa_daraja');
          onPaymentSuccess();
        } else if (result.status === 'FAILED') {
          clearInterval(pollInterval);
          clearInterval(timer);
          setPaymentStatus('failed');
          setErrorMessage('M-Pesa transaction was cancelled or declined. Please retry.');
        }
      }, 2500);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [paymentStatus, checkoutRequestId, phoneNumber, onPaymentSuccess]);

  if (!isOpen) return null;

  const handleInitiateStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Quick validation
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (!cleanPhone) {
      setErrorMessage('Please enter your Safaricom phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await initiateMpesaStkPush(cleanPhone, config.premiumPriceKes);
      if (res.success && res.checkoutRequestId) {
        setCheckoutRequestId(res.checkoutRequestId);
        setPaymentStatus('push_sent');
        setStatusMessage(res.customerMessage || 'STK prompt sent to your phone.');
        setCountdown(45);
      } else {
        setPaymentStatus('failed');
        setErrorMessage(res.error || 'Failed to dispatch M-Pesa prompt. Please try again.');
      }
    } catch (err: any) {
      setPaymentStatus('failed');
      setErrorMessage(err.message || 'Connection error with payment server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyManualCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!manualCode.trim() || manualCode.trim().length < 6) {
      setErrorMessage('Please enter a valid 10-character M-Pesa transaction confirmation code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyManualMpesaCode(manualCode, phoneNumber);
      if (res.success) {
        const receipt = manualCode.trim().toUpperCase();
        setConfirmedReceipt(receipt);
        setPaymentStatus('success');
        savePremiumStatus(receipt, phoneNumber, 'manual_mpesa');
        onPaymentSuccess();
      } else {
        setErrorMessage(res.error || 'Invalid or unverified M-Pesa code. Please check your SMS.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error verifying code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create account immediately after payment
  const handlePostPaymentAccountCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError('');
    if (!accountEmail || !accountPassword) {
      setAccountError('Please enter an email and password.');
      return;
    }
    if (accountPassword.length < 6) {
      setAccountError('Password must be at least 6 characters.');
      return;
    }

    setIsCreatingAccount(true);
    try {
      const res = await registerWithEmail(
        accountEmail,
        accountPassword,
        accountName,
        { mpesaReceiptNumber: confirmedReceipt, phoneNumber }
      );
      if (res.success && res.user) {
        setAccountCreated(true);
        onPaymentSuccess(res.user);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setAccountError(res.error || 'Account creation failed.');
      }
    } catch (err: any) {
      setAccountError(err.message || 'Error creating account.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // Google Sign In for post payment
  const handlePostPaymentGoogle = async () => {
    setAccountError('');
    setIsCreatingAccount(true);
    try {
      const res = await signInWithGoogleAccount({
        mpesaReceiptNumber: confirmedReceipt,
        phoneNumber,
      });
      if (res.success && res.user) {
        setAccountCreated(true);
        onPaymentSuccess(res.user);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setAccountError(res.error || 'Google sign-in failed.');
      }
    } catch (err: any) {
      setAccountError(err.message || 'Google sign-in error.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // Handle inline login for users who already paid
  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter your email and password.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await loginWithEmail(loginEmail, loginPassword);
      if (res.success && res.user) {
        onPaymentSuccess(res.user);
        onClose();
      } else {
        setLoginError(res.error || 'Login failed.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login error.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div 
        id="mpesa-payment-modal"
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 sm:p-7 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-400/30 text-emerald-100 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              RadMed Pro • Lifetime Access
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-1 text-white">
            {paymentStatus === 'success' ? 'Payment Confirmed! Create Your Account' : 'Unlock Full Radiology Library'}
          </h2>

          <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed max-w-lg">
            {paymentStatus === 'success' ? (
              <>Save your email and password so your lifetime Pro access is accessible whenever you return or switch devices.</>
            ) : displayTitle ? (
              <>You have reached the free limit ({FREE_CXR_LIMIT} Chest X-rays & {FREE_CT_LIMIT} Head CTs). Unlock <strong className="font-semibold text-white">"{displayTitle}"</strong> and all 50+ cases for lifetime.</>
            ) : (
              <>Free tier includes {FREE_CXR_LIMIT} Chest X-rays & {FREE_CT_LIMIT} Head CT scans. Pay once for permanent lifetime access across all devices.</>
            )}
          </p>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              KES {config.premiumPriceKes}
            </span>
            <span className="text-[11px] text-emerald-100 bg-emerald-900/50 px-2.5 py-0.5 rounded-lg border border-emerald-400/20 font-medium">
              One-time payment • Lifetime access
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 overflow-y-auto flex-1">
          {/* STEP 2: POST-PAYMENT ACCOUNT CREATION */}
          {paymentStatus === 'success' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                    Payment Verified Successfully!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono">
                    Receipt: {confirmedReceipt || 'M-PESA OK'} • Pro Lifetime License Active
                  </p>
                </div>
              </div>

              {accountCreated ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                    Account Created & Linked!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your lifetime license is permanently secured. Loading case library...
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Create Your Lifetime Account
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Even if you exit or clear your browser, you can come back and log in anytime to keep all cases unlocked.
                    </p>
                  </div>

                  {accountError && (
                    <div className="mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{accountError}</span>
                    </div>
                  )}

                  <form onSubmit={handlePostPaymentAccountCreation} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name / Title (Optional)
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder="Dr. Godfrey Wangechi"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={accountEmail}
                          onChange={(e) => setAccountEmail(e.target.value)}
                          placeholder="doctor@hospital.org"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Create Password (min. 6 chars) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={accountPassword}
                          onChange={(e) => setAccountPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isCreatingAccount}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isCreatingAccount ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" /> Saving Account...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" /> Save Account & Link Lifetime Access
                        </span>
                      )}
                    </button>
                  </form>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase">
                      <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">or 1-click</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePostPaymentGoogle}
                    disabled={isCreatingAccount}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
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
                    <span>Link with Google Account</span>
                  </button>

                  <div className="text-center mt-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                    >
                      Start Exploring Now →
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Payment Method Tabs */}
              <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('stk_push');
                    setErrorMessage('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'stk_push'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>STK Push</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('manual_code');
                    setErrorMessage('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'manual_code'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Manual Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMessage('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'login'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Already Paid?</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('other_providers');
                    setErrorMessage('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'other_providers'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Card</span>
                </button>
              </div>

              {/* Error banner */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Transaction Notice:</span> {errorMessage}
                  </div>
                </div>
              )}

              {/* TAB 1: M-PESA STK PUSH */}
              {activeTab === 'stk_push' && (
                <div>
                  {paymentStatus === 'push_sent' ? (
                    <div className="text-center py-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                      <div className="relative w-14 h-14 mx-auto mb-3">
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                        <Smartphone className="w-7 h-7 text-emerald-600 dark:text-emerald-400 absolute inset-0 m-auto" />
                      </div>

                      <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                        Check Your Phone Screen
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 max-w-sm mx-auto">
                        A prompt has been sent to <strong className="text-emerald-600 dark:text-emerald-400">{phoneNumber}</strong>. Please enter your M-Pesa PIN to complete payment of <strong>KES {config.premiumPriceKes}</strong>.
                      </p>

                      {/* Countdown */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-4">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        Waiting for PIN ({countdown}s)
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentStatus('idle');
                            setCheckoutRequestId(null);
                          }}
                          className="text-xs px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                          Cancel & Retry
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('manual_code')}
                          className="text-xs px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold transition-colors"
                        >
                          Enter Code Manually
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleInitiateStkPush} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                          Safaricom M-Pesa Phone Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-semibold text-xs">
                            🇰🇪
                          </div>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="e.g. 0712345678 or 254712345678"
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs sm:text-sm"
                            required
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          Works with any Safaricom line. An automated STK Push PIN prompt will pop up on your phone.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Connecting to Safaricom...
                          </>
                        ) : (
                          <>
                            <Smartphone className="w-4 h-4" />
                            Send M-Pesa PIN Prompt (KES {config.premiumPriceKes})
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 2: MANUAL CODE ENTRY */}
              {activeTab === 'manual_code' && (
                <form onSubmit={handleVerifyManualCode} className="space-y-3.5">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Lipa na M-Pesa (Till Number / Buy Goods)
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Buy Goods
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Till Number (Buy Goods):</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-mono tracking-wider">{config.paybillOrTillNumber || '1661655'}</strong>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Amount to Pay:</span>
                        <strong className="text-slate-900 dark:text-white text-sm font-mono">KES {config.premiumPriceKes}</strong>
                      </div>
                    </div>

                    <ol className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside pt-1">
                      <li>Open M-Pesa on your phone → Select <strong className="text-slate-800 dark:text-slate-200">Lipa na M-Pesa</strong></li>
                      <li>Select <strong className="text-slate-800 dark:text-slate-200">Buy Goods and Services</strong></li>
                      <li>Enter Till Number: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{config.paybillOrTillNumber || '1661655'}</strong></li>
                      <li>Enter Amount: <strong className="text-slate-800 dark:text-slate-200">KES {config.premiumPriceKes}</strong> & Enter your M-Pesa PIN</li>
                    </ol>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      M-Pesa Confirmation Code
                    </label>
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      placeholder="e.g. QK879TR123"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold uppercase text-xs sm:text-sm tracking-widest"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Code...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" /> Verify Code & Unlock
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TAB 3: ALREADY PAID / SIGN IN */}
              {activeTab === 'login' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                    <strong>Have you already unlocked RadMed Pro?</strong> Log in to sync your lifetime Pro license on this device immediately.
                  </div>

                  {loginError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleInlineLogin} className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="doctor@hospital.org"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {loginLoading ? 'Signing in...' : 'Sign In & Restore Lifetime Access'}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 4: OTHER PROVIDERS */}
              {activeTab === 'other_providers' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Card & International Gateways
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Visa, Mastercard, Paystack & Flutterwave
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                      International clinicians or card checkout users can activate access via Stripe / Paystack.
                    </p>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab('stk_push')}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                    >
                      ← Back to Safaricom M-Pesa Checkout
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Perks Guarantee */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-slate-500 dark:text-slate-400 text-[11px]">
                <div className="flex flex-col items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 mb-0.5" />
                  <span>Instant Activation</span>
                </div>
                <div className="flex flex-col items-center">
                  <Layers className="w-3.5 h-3.5 text-blue-500 mb-0.5" />
                  <span>All Chest X-rays & CTs</span>
                </div>
                <div className="flex flex-col items-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 mb-0.5" />
                  <span>Lifetime Account</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
