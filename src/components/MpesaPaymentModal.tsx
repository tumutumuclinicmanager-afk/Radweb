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
  QrCode
} from 'lucide-react';
import { 
  initiateMpesaStkPush, 
  pollPaymentStatus, 
  verifyManualMpesaCode, 
  savePremiumStatus,
  fetchPaymentConfig
} from '../services/paymentService';
import { PaymentConfig } from '../types';

interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  triggerCategory?: string;
  triggerCaseTitle?: string;
}

export const MpesaPaymentModal: React.FC<MpesaPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  triggerCategory,
  triggerCaseTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'stk_push' | 'manual_code' | 'other_providers'>('stk_push');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'push_sent' | 'checking' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(45);
  const [errorMessage, setErrorMessage] = useState('');
  const [config, setConfig] = useState<PaymentConfig>({
    freeCasesLimit: 5,
    premiumPriceKes: 1000,
    activeProvider: 'mpesa_daraja',
    darajaEnvironment: 'sandbox',
    darajaBusinessShortcode: '174379',
    paybillOrTillNumber: '174379',
    accountReference: 'RadMed Pro',
  });

  useEffect(() => {
    if (isOpen) {
      fetchPaymentConfig().then(setConfig);
      setPaymentStatus('idle');
      setErrorMessage('');
      setStatusMessage('');
      setCheckoutRequestId(null);
      setCountdown(45);
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
          setPaymentStatus('success');
          savePremiumStatus(result.receiptNumber || 'MPESA_APPROVED', phoneNumber, 'mpesa_daraja');
          setTimeout(() => {
            onPaymentSuccess();
          }, 1800);
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
        setPaymentStatus('success');
        setStatusMessage(res.message || 'M-Pesa payment code confirmed!');
        setTimeout(() => {
          onPaymentSuccess();
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Invalid or unverified M-Pesa code. Please check your SMS.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error verifying code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div 
        id="mpesa-payment-modal"
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
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
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-400/30 text-emerald-100 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              RadMed Pro Lifetime Access
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-white">
            Unlock Full Radiology Library
          </h2>

          <p className="text-sm text-emerald-50 leading-relaxed max-w-md">
            {triggerCaseTitle ? (
              <>You've reached the free 5-case limit for <strong className="font-semibold text-white">{triggerCategory || 'this category'}</strong>. Unlock <strong className="font-semibold text-white">"{triggerCaseTitle}"</strong> and all 50+ cases.</>
            ) : (
              <>Enjoy 5 free cases per category. Upgrade to unlock all advanced cases, CT slice stacks, and CME templates.</>
            )}
          </p>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white">
              KES {config.premiumPriceKes}
            </span>
            <span className="text-xs text-emerald-100 bg-emerald-900/50 px-2.5 py-0.5 rounded-lg border border-emerald-400/20 font-medium">
              One-time payment • Lifetime access
            </span>
          </div>
        </div>

        {/* Success Splash Screen */}
        {paymentStatus === 'success' ? (
          <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/30">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Payment Confirmed!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Full access unlocked. All radiology cases across all modalities and categories are now accessible.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow-md">
              <Sparkles className="w-4 h-4" /> Unlocking Library...
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            {/* Payment Method Tabs */}
            <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1.5 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('stk_push');
                  setErrorMessage('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'stk_push'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                M-Pesa STK Push
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('manual_code');
                  setErrorMessage('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'manual_code'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                Enter M-Pesa Code
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('other_providers');
                  setErrorMessage('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'other_providers'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Other Providers
              </button>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Transaction Notice:</span> {errorMessage}
                </div>
              </div>
            )}

            {/* TAB 1: M-PESA STK PUSH */}
            {activeTab === 'stk_push' && (
              <div>
                {paymentStatus === 'push_sent' ? (
                  <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                      <Smartphone className="w-8 h-8 text-emerald-600 dark:text-emerald-400 absolute inset-0 m-auto" />
                    </div>

                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      Check Your Phone Screen
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4 max-w-sm mx-auto">
                      A prompt has been sent to <strong className="text-emerald-600 dark:text-emerald-400">{phoneNumber}</strong>. Please enter your M-Pesa PIN to complete payment of <strong>KES {config.premiumPriceKes}</strong>.
                    </p>

                    {/* Countdown */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-6">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      Waiting for PIN entry ({countdown}s)
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentStatus('idle');
                          setCheckoutRequestId(null);
                        }}
                        className="text-xs px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                      >
                        Cancel & Retry
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('manual_code')}
                        className="text-xs px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold transition-colors"
                      >
                        Enter M-Pesa Code Manually
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleInitiateStkPush} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Safaricom M-Pesa Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                          🇰🇪
                        </div>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="e.g. 0712345678 or 254712345678"
                          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm sm:text-base"
                          required
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Works with any Safaricom line (07XXXXXXXX or 01XXXXXXXX). An automated STK Push PIN prompt will pop up on your phone.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Connecting to Safaricom...
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-5 h-5" />
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
              <form onSubmit={handleVerifyManualCode} className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Paybill / Till Instructions
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block mb-0.5">Paybill / Till:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-mono">{config.paybillOrTillNumber}</strong>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block mb-0.5">Account Ref:</span>
                      <strong className="text-slate-900 dark:text-white text-sm font-mono">{config.accountReference}</strong>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Amount: <strong className="text-slate-900 dark:text-white">KES {config.premiumPriceKes}</strong>. Once paid, paste the confirmation code from your Safaricom SMS below.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    M-Pesa Confirmation Code
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="e.g. QK879TR123"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold uppercase text-sm sm:text-base tracking-widest"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
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

            {/* TAB 3: OTHER PROVIDERS (MODULAR ADAPTERS) */}
            {activeTab === 'other_providers' && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Card & International Gateways
                      </h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Modular support for Stripe, Paystack, & Flutterwave
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    If you are an international resident or prefer card checkout (Visa, Mastercard, Amex), you can request an instant invoice or switch payment adapter in admin settings.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                      💳 Visa / Mastercard
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                      ⚡ Paystack Africa
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                      🌍 Flutterwave
                    </span>
                  </div>
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
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-slate-500 dark:text-slate-400 text-xs">
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mb-1" />
                <span>Instant Auto-Activation</span>
              </div>
              <div className="flex flex-col items-center">
                <Layers className="w-4 h-4 text-blue-500 mb-1" />
                <span>All Categories & CTs</span>
              </div>
              <div className="flex flex-col items-center">
                <Sparkles className="w-4 h-4 text-amber-500 mb-1" />
                <span>Lifetime CME Access</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
