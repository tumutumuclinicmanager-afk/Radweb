import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, setLogLevel, disableNetwork } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Clean up console by silencing Firestore SDK and filtering out remote quota messages
try {
  setLogLevel('silent');
} catch {}

if (typeof window !== 'undefined') {
  // Swallow all unhandled promise rejections and window errors stemming from Firebase quota exceptions
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason) {
      const msg = reason.message || String(reason);
      const code = reason.code;
      if (
        msg.toLowerCase().includes('quota') ||
        msg.toLowerCase().includes('exceeded') ||
        msg.toLowerCase().includes('resource-exhausted') ||
        code === 'resource-exhausted'
      ) {
        event.preventDefault(); // Stop event from bubble logging
        tripWriteQuota();
      }
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.toLowerCase().includes('quota') ||
      msg.toLowerCase().includes('exceeded') ||
      msg.toLowerCase().includes('resource-exhausted')
    ) {
      event.preventDefault(); // Swallow error
      tripWriteQuota();
    }
  });
}

// Write quota circuit breaker state
let writeQuotaExceeded = false;

export function tripWriteQuota() {
  if (!writeQuotaExceeded) {
    writeQuotaExceeded = true;
    console.warn('[Quota Shield] Firestore quota notice received. System utilizing resilient server cache.');
  }
}

export function checkWriteQuotaPersisted(): boolean {
  // If tripped in this active session, return true
  if (writeQuotaExceeded) {
    return true;
  }
  // Clear any legacy 24h lockout timestamps that desynchronized browsers
  try {
    if (localStorage.getItem('radmed_write_quota_exceeded_timestamp')) {
      localStorage.removeItem('radmed_write_quota_exceeded_timestamp');
    }
  } catch {}
  return false;
}


