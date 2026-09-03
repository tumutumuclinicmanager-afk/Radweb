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

// Global write quota circuit breaker to prevent client-side write units console errors
let writeQuotaExceeded = false;

export function tripWriteQuota() {
  if (!writeQuotaExceeded) {
    writeQuotaExceeded = true;
    console.warn('[Quota Shield] Write quota limit hit. Engaging write circuit breaker and disabling remote firestore network sync.');
    try {
      localStorage.setItem('radmed_write_quota_exceeded_timestamp', Date.now().toString());
    } catch {}
    if (typeof window !== 'undefined' && db) {
      disableNetwork(db).catch(() => {});
    }
  }
}

export function checkWriteQuotaPersisted(): boolean {
  if (writeQuotaExceeded) {
    if (typeof window !== 'undefined' && db) {
      disableNetwork(db).catch(() => {});
    }
    return true;
  }
  try {
    const saved = localStorage.getItem('radmed_write_quota_exceeded_timestamp');
    if (saved) {
      const timestamp = parseInt(saved, 10);
      // Quota resets daily, check if it was within 24 hours
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        writeQuotaExceeded = true;
        if (typeof window !== 'undefined' && db) {
          disableNetwork(db).catch(() => {});
        }
        return true;
      } else {
        localStorage.removeItem('radmed_write_quota_exceeded_timestamp');
      }
    }
  } catch {}
  return false;
}


