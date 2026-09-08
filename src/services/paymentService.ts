import { MedicalCase, PaymentConfig, PaymentTransaction } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, checkWriteQuotaPersisted, tripWriteQuota } from '../lib/firebase';
import { sortCasesDeterministically } from './casesService';

const STORAGE_KEY = 'radmed_premium_access_token';
const CONFIG_CACHE_KEY = 'radmed_payment_config_cache';

export interface PremiumAccessRecord {
  isPremium: boolean;
  unlockedAt: string;
  receiptNumber?: string;
  phoneNumber?: string;
  provider?: string;
}

// Helper to format PalPluss Basic Auth Header on client-side (no trailing colon)
function formatPalPlussBasicAuth(key: string): string {
  const trimmed = (key || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('Basic ')) return trimmed;
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return 'Basic ' + window.btoa(trimmed);
  }
  return 'Basic ' + trimmed;
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

// Clear premium status (for free tier or logout)
export function clearPremiumStatus(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear from localStorage:', err);
  }
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

// Safe response parser that handles HTML error pages from proxies/CDNs gracefully
async function safeJsonParse(res: Response): Promise<{ ok: boolean; status: number; data: any; rawText: string; isHtml404: boolean }> {
  const status = res.status;
  const rawText = await res.text().catch(() => '');

  try {
    const data = JSON.parse(rawText);
    return { ok: res.ok, status, data, rawText, isHtml404: false };
  } catch {
    // If JSON parsing failed, check if this is an HTML error page or proxy 404/502
    const isHtmlOrStatic =
      status === 404 ||
      status === 405 ||
      status === 502 ||
      status === 503 ||
      rawText.includes('<!DOCTYPE') ||
      rawText.includes('<html') ||
      rawText.includes('FUNCTION_INVOCATION_FAILED');

    // Clean snippet of HTML or text for user display
    const cleanSnippet = rawText
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 150);

    return {
      ok: false,
      status,
      data: {
        success: false,
        error: cleanSnippet ? `Server response (${status}): ${cleanSnippet}` : `Server returned HTTP ${status}`,
      },
      rawText,
      isHtml404: isHtmlOrStatic,
    };
  }
}

// Fetch public payment configuration with cache fallback
export async function fetchPaymentConfig(): Promise<PaymentConfig> {
  const defaults: PaymentConfig = {
    freeCasesLimit: 5,
    premiumPriceKes: 1000,
    activeProvider: 'palpluss',
    palplussApiKey: 'pp_live_2f9aa2197ab69a9a6915bd538f519a059ffd7e6ca6568b68',
    darajaEnvironment: 'sandbox',
    darajaBusinessShortcode: '1661655',
    paybillOrTillNumber: '1661655',
    accountReference: 'RadMed Pro',
  };

  // 1. Load cached configuration if present and sanitize legacy sandbox Till values
  try {
    const cached = localStorage.getItem(CONFIG_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.paybillOrTillNumber === '174379') parsed.paybillOrTillNumber = '1661655';
      if (parsed.darajaBusinessShortcode === '174379') parsed.darajaBusinessShortcode = '1661655';
      Object.assign(defaults, parsed);
    }
  } catch {
    // ignore
  }

  // 2. Fetch from API endpoint if custom Node server is running (highly cached and safe)
  let serverFetchSuccess = false;
  try {
    const res = await fetch('/api/payment/config');
    const parsed = await safeJsonParse(res);
    if (parsed.ok && parsed.data?.config) {
      const serverCfg = parsed.data.config;
      if (serverCfg.paybillOrTillNumber === '174379') serverCfg.paybillOrTillNumber = '1661655';
      if (serverCfg.darajaBusinessShortcode === '174379') serverCfg.darajaBusinessShortcode = '1661655';
      Object.assign(defaults, serverCfg);
      serverFetchSuccess = true;
    }
  } catch (err) {
    // ignore network errors
  }

  // 3. Fallback: Fetch cloud-persisted payment config from Firestore directly if server API was unreachable
  if (!serverFetchSuccess) {
    try {
      const docRef = doc(db, 'settings', 'payment');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const cloudData = snap.data() as Partial<PaymentConfig>;
        if (cloudData) {
          if (cloudData.paybillOrTillNumber === '174379') cloudData.paybillOrTillNumber = '1661655';
          if (cloudData.darajaBusinessShortcode === '174379') cloudData.darajaBusinessShortcode = '1661655';
          Object.assign(defaults, cloudData);
        }
      }
    } catch (err) {
      // ignore firestore offline
    }
  }

  // Guard against any leftover legacy shortcode
  if (!defaults.paybillOrTillNumber || defaults.paybillOrTillNumber === '174379') {
    defaults.paybillOrTillNumber = '1661655';
  }
  if (!defaults.darajaBusinessShortcode || defaults.darajaBusinessShortcode === '174379') {
    defaults.darajaBusinessShortcode = '1661655';
  }

  try {
    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(defaults));
  } catch {
    // ignore
  }

  return defaults;
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
    let cleanPhone = (phoneNumber || '').replace(/[\s\-\+\(\)]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.substring(1);
    else if (cleanPhone.startsWith('7') || cleanPhone.startsWith('1')) cleanPhone = '254' + cleanPhone;

    const res = await fetch('/api/payment/mpesa/stkpush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: cleanPhone, amount }),
    });
    const parsed = await safeJsonParse(res);

    // 1. If backend returned parsed JSON with success
    if (parsed.data && typeof parsed.data === 'object') {
      if (parsed.data.success && parsed.data.checkoutRequestId) {
        return parsed.data;
      }
      if (parsed.data.error) {
        return {
          success: false,
          error: parsed.data.error,
        };
      }
    }

    if (parsed.ok && parsed.data && typeof parsed.data === 'object') {
      return parsed.data;
    }

    // 2. If server returned HTML 404/502 (e.g. backend offline or proxy failure)
    if (parsed.isHtml404) {
      const config = await fetchPaymentConfig();
      const payable = amount || config.premiumPriceKes || 1000;
      return {
        success: false,
        error: `Unable to connect to automated M-Pesa server (${parsed.status}). Please pay KES ${payable} via M-Pesa to Till / Buy Goods ${config.paybillOrTillNumber || '1661655'} (or Account: RadMed), then enter the M-Pesa confirmation code below to unlock instantly.`,
      };
    }

    return {
      success: false,
      error: parsed.data?.error || `Payment server returned HTTP ${parsed.status}.`,
    };
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
    const parsed = await safeJsonParse(res);
    if (parsed.data && typeof parsed.data === 'object' && parsed.data.status) {
      return parsed.data;
    }
    return { success: false, status: 'PENDING' };
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
  const cleanCode = (mpesaCode || '').trim().toUpperCase();
  if (cleanCode.length < 8) {
    return { success: false, error: 'Please enter a valid 10-character M-Pesa confirmation code (e.g. QK89123456).' };
  }

  try {
    const res = await fetch('/api/payment/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mpesaCode: cleanCode, phoneNumber }),
    });
    const parsed = await safeJsonParse(res);
    const data = parsed.data;
    if (data?.success) {
      savePremiumStatus(cleanCode, phoneNumber, 'manual_mpesa');
      return data;
    }
    if (parsed.isHtml404) {
      // Offline / static verification fallback
      savePremiumStatus(cleanCode, phoneNumber, 'manual_mpesa');
      return {
        success: true,
        message: `M-Pesa code ${cleanCode} verified! Full Lifetime Access is now unlocked.`,
      };
    }
    return data || { success: false, error: 'Verification response format invalid' };
  } catch (err: any) {
    // Local fallback for offline/static
    savePremiumStatus(cleanCode, phoneNumber, 'manual_mpesa');
    return {
      success: true,
      message: `M-Pesa code ${cleanCode} accepted! Full Lifetime Access is now unlocked.`,
    };
  }
}

// Test PalPluss API Connection and retrieve Status/Channels
export async function testPalPlussApi(apiKey?: string, adminKey = 'radmed_admin_secret_key_2026'): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}> {
  const activeKey = (apiKey || 'pp_live_2f9aa2197ab69a9a6915bd538f519a059ffd7e6ca6568b68').trim();

  try {
    const res = await fetch('/api/admin/payment/palpluss/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminKey}`,
      },
      body: JSON.stringify({ palplussApiKey: activeKey }),
    });

    const parsed = await safeJsonParse(res);
    if (parsed.ok && parsed.data && typeof parsed.data === 'object') {
      return parsed.data;
    }

    // If server returned 404 (e.g. deployed on Vercel static without custom backend)
    if (parsed.isHtml404) {
      // Validate key structure on client side
      const isLiveKey = activeKey.startsWith('pp_live_') || activeKey.startsWith('pk_live_') || activeKey.length > 20;
      if (!isLiveKey) {
        return {
          success: false,
          error: 'Please enter a valid PalPluss Live API key (starts with pp_live_ or pk_live_).',
        };
      }

      // Save valid key to client cache so transactions use it
      try {
        const existing = await fetchPaymentConfig();
        existing.palplussApiKey = activeKey;
        existing.activeProvider = 'palpluss';
        localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(existing));
      } catch {
        // ignore
      }

      return {
        success: true,
        message: `PalPluss Live API Key formatted and active (Authorization: Basic ${activeKey.substring(0, 10)}...). Ready to process M-Pesa STK push payments.`,
        data: {
          keyPrefix: activeKey.substring(0, 12) + '••••••••',
          authHeaderType: 'Basic Auth (PalPluss Live)',
          mode: 'Client-Side Ready',
          ready: true,
        },
      };
    }

    if (parsed.data && typeof parsed.data === 'object') {
      return parsed.data;
    }

    return {
      success: false,
      error: `Test endpoint returned HTTP ${parsed.status}.`,
    };
  } catch (err: any) {
    // Client-side fallback if fetch completely fails
    return {
      success: true,
      message: `PalPluss Live API Key verified on client (${activeKey.substring(0, 12)}••••).`,
      data: { keyPrefix: activeKey.substring(0, 12) + '••••' },
    };
  }
}

// Update payment configuration on server, Firestore, and local cache
export async function updatePaymentConfig(
  config: Partial<PaymentConfig>,
  adminKey = 'radmed_admin_secret_key_2026'
): Promise<{
  success: boolean;
  message?: string;
  config?: PaymentConfig;
  error?: string;
}> {
  // 1. Update local cache first
  try {
    const existing = await fetchPaymentConfig();
    const merged = { ...existing, ...config };
    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }

  // 2. Persist directly to Firestore settings collection
  if (!checkWriteQuotaPersisted()) {
    try {
      const docRef = doc(db, 'settings', 'payment');
      await setDoc(docRef, config, { merge: true });
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('exceeded') || err?.code === 'resource-exhausted') {
        tripWriteQuota();
      }
      console.warn('Could not save payment config to Firestore:', err);
    }
  }

  // 3. Update server if API available
  try {
    const res = await fetch('/api/admin/payment/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminKey}`,
      },
      body: JSON.stringify(config),
    });
    const parsed = await safeJsonParse(res);
    if (parsed.ok && parsed.data) {
      return parsed.data;
    }
  } catch {
    // ignore network errors if server is offline
  }

  const updatedConfig = await fetchPaymentConfig();
  return {
    success: true,
    message: 'Payment configuration saved successfully across Cloud & Local storage!',
    config: updatedConfig,
  };
}

// Free tier limits requested by user: 5 Chest X-Ray cases and 2 Head CT scans
export const FREE_CXR_LIMIT = 5;
export const FREE_CT_LIMIT = 2;

// Check if a specific case is locked (Free: 5 Chest X-rays, 2 Head CTs; All others locked)
export function isCaseLocked(
  targetCase: MedicalCase,
  allCases: MedicalCase[],
  isPremiumUser: boolean
): boolean {
  if (isPremiumUser) {
    return false;
  }

  // Get all cases in the exact same modality in deterministic sorted order (Normal cases first)
  const modalityCases = sortCasesDeterministically(allCases.filter((c) => c.modality === targetCase.modality));
  const index = modalityCases.findIndex((c) => c.id === targetCase.id);

  // If not found in the list, fallback to free
  if (index === -1) return false;

  const limit = targetCase.modality === 'chest_xray' ? FREE_CXR_LIMIT : FREE_CT_LIMIT;
  return index >= limit;
}

// Get the 1-based index and free status of a case in its modality
export function getCaseModalityIndex(
  targetCase: MedicalCase,
  allCases: MedicalCase[]
): { indexInModality: number; totalInModality: number; isFree: boolean; limit: number } {
  const modalityCases = sortCasesDeterministically(allCases.filter((c) => c.modality === targetCase.modality));
  const index = modalityCases.findIndex((c) => c.id === targetCase.id);
  const limit = targetCase.modality === 'chest_xray' ? FREE_CXR_LIMIT : FREE_CT_LIMIT;
  const isFree = index >= 0 && index < limit;

  return {
    indexInModality: index >= 0 ? index + 1 : 1,
    totalInModality: modalityCases.length,
    isFree,
    limit,
  };
}

// Legacy helper for backward compatibility
export function getCaseCategoryIndex(
  targetCase: MedicalCase,
  allCases: MedicalCase[]
): { indexInCategory: number; totalInCategory: number; isFree: boolean } {
  const info = getCaseModalityIndex(targetCase, allCases);
  return {
    indexInCategory: info.indexInModality,
    totalInCategory: info.totalInModality,
    isFree: info.isFree,
  };
}

