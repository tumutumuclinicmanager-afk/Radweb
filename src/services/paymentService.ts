import { MedicalCase, PaymentConfig, PaymentTransaction } from '../types';

const STORAGE_KEY = 'radmed_premium_access_token';

export interface PremiumAccessRecord {
  isPremium: boolean;
  unlockedAt: string;
  receiptNumber?: string;
  phoneNumber?: string;
  provider?: string;
}

// Get user's local premium status
export function getStoredPremiumStatus(): PremiumAccessRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { isPremium: false, unlockedAt: '' };
    const parsed = JSON.parse(raw);
    return parsed && parsed.isPremium ? parsed : { isPremium: false, unlockedAt: '' };
  } catch {
    return { isPremium: false, unlockedAt: '' };
  }
}

// Convenient boolean getter
export function getIsPremiumStatus(): boolean {
  return getStoredPremiumStatus().isPremium;
}

// Convenient marker
export function markUserAsPremium(receiptNumber?: string, phoneNumber?: string): void {
  savePremiumStatus(receiptNumber, phoneNumber);
}


// Save unlocked premium state
export function savePremiumStatus(receiptNumber?: string, phoneNumber?: string, provider = 'mpesa_daraja'): void {
  const record: PremiumAccessRecord = {
    isPremium: true,
    unlockedAt: new Date().toISOString(),
    receiptNumber: receiptNumber || `QK${Math.floor(10000000 + Math.random() * 90000000)}`,
    phoneNumber,
    provider,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

// Fetch public payment configuration
export async function fetchPaymentConfig(): Promise<PaymentConfig> {
  try {
    const res = await fetch('/api/payment/config');
    if (!res.ok) throw new Error('Failed to load payment config');
    const data = await res.json();
    return data.config;
  } catch {
    return {
      freeCasesLimit: 5,
      premiumPriceKes: 1000,
      activeProvider: 'mpesa_daraja',
      darajaEnvironment: 'sandbox',
      darajaBusinessShortcode: '174379',
      paybillOrTillNumber: '174379',
      accountReference: 'RadMed Pro',
    };
  }
}

// Initiate M-Pesa STK Push
export async function initiateMpesaStkPush(phoneNumber: string, amount?: number): Promise<{
  success: boolean;
  checkoutRequestId?: string;
  customerMessage?: string;
  error?: string;
  mode?: string;
}> {
  try {
    const res = await fetch('/api/payment/mpesa/stkpush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, amount }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error initiating STK push' };
  }
}

// Poll STK Push transaction status
export async function pollPaymentStatus(checkoutRequestId: string): Promise<{
  success: boolean;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'NOT_FOUND';
  isCompleted?: boolean;
  receiptNumber?: string;
  transaction?: PaymentTransaction;
}> {
  try {
    const res = await fetch(`/api/payment/status/${encodeURIComponent(checkoutRequestId)}`);
    return await res.json();
  } catch {
    return { success: false, status: 'PENDING' };
  }
}

// Verify manual M-Pesa transaction code
export async function verifyManualMpesaCode(mpesaCode: string, phoneNumber?: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  transaction?: PaymentTransaction;
}> {
  try {
    const res = await fetch('/api/payment/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mpesaCode, phoneNumber }),
    });
    const data = await res.json();
    if (data.success) {
      savePremiumStatus(mpesaCode.toUpperCase(), phoneNumber, 'manual_mpesa');
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to verify M-Pesa code' };
  }
}

// Test PalPluss API Connection and retrieve Channels
export async function testPalPlussApi(apiKey?: string, adminKey = 'radmed_admin_secret_key_2026'): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}> {
  try {
    const res = await fetch('/api/admin/payment/palpluss/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminKey}`,
      },
      body: JSON.stringify({ palplussApiKey: apiKey }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error connecting to PalPluss test endpoint' };
  }
}

// Update payment configuration on server
export async function updatePaymentConfig(
  config: Partial<PaymentConfig>,
  adminKey = 'radmed_admin_secret_key_2026'
): Promise<{
  success: boolean;
  message?: string;
  config?: PaymentConfig;
  error?: string;
}> {
  try {
    const res = await fetch('/api/admin/payment/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminKey}`,
      },
      body: JSON.stringify(config),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save payment configuration' };
  }
}

// Check if a specific case is locked based on 5 free cases per category rule
export function isCaseLocked(
  targetCase: MedicalCase,
  allCases: MedicalCase[],
  isPremiumUser: boolean,
  freeCasesLimit = 5
): boolean {
  if (isPremiumUser) {
    return false;
  }

  // Get all cases in the exact same modality and category
  const categoryCases = allCases.filter(
    (c) => c.modality === targetCase.modality && c.category === targetCase.category
  );

  const index = categoryCases.findIndex((c) => c.id === targetCase.id);
  // If not found or among the first 5, it is free
  if (index === -1) return false;
  return index >= freeCasesLimit;
}

// Get the 1-based index and free status of a case in its category
export function getCaseCategoryIndex(
  targetCase: MedicalCase,
  allCases: MedicalCase[]
): { indexInCategory: number; totalInCategory: number } {
  const categoryCases = allCases.filter(
    (c) => c.modality === targetCase.modality && c.category === targetCase.category
  );
  const index = categoryCases.findIndex((c) => c.id === targetCase.id);
  return {
    indexInCategory: index >= 0 ? index + 1 : 1,
    totalInCategory: categoryCases.length,
  };
}
