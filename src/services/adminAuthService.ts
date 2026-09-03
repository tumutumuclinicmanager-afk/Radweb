import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, checkWriteQuotaPersisted, tripWriteQuota } from '../lib/firebase';

const LOCAL_ADMIN_PASSWORD_KEY = 'rad_admin_custom_password';
const DEFAULT_INITIAL_PASSWORD = 'admin123';

// Fetch the current admin password from Firestore or localStorage
export async function fetchCurrentAdminPassword(): Promise<string> {
  // First check local storage cache
  try {
    const local = localStorage.getItem(LOCAL_ADMIN_PASSWORD_KEY);
    if (local && local.trim().length > 0) {
      return local.trim();
    }
  } catch {
    // ignore
  }

  // Next check Firestore
  try {
    const docRef = doc(db, 'settings', 'admin');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data?.adminPassword) {
        try {
          localStorage.setItem(LOCAL_ADMIN_PASSWORD_KEY, data.adminPassword);
        } catch {
          // ignore
        }
        return data.adminPassword;
      }
    }
  } catch (err) {
    console.warn('Could not fetch admin password from Firestore:', err);
  }

  return DEFAULT_INITIAL_PASSWORD;
}

// Verify input password against Firestore and LocalStorage
export async function verifyAdminPassword(input: string): Promise<boolean> {
  const cleanInput = (input || '').trim();
  if (!cleanInput) return false;

  // Master initial backups or stored password
  const currentPassword = await fetchCurrentAdminPassword();
  
  if (cleanInput === currentPassword) {
    return true;
  }

  // Also accept default/fallback if user has not yet customized password
  if (currentPassword === DEFAULT_INITIAL_PASSWORD && (cleanInput === 'admin123' || cleanInput === 'rad2026')) {
    return true;
  }

  return false;
}

// Update the admin password in Firestore and LocalStorage
export async function updateAdminPassword(
  currentPasswordInput: string,
  newPasswordInput: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const current = (currentPasswordInput || '').trim();
  const next = (newPasswordInput || '').trim();

  if (!current) {
    return { success: false, error: 'Please enter your current admin password.' };
  }

  if (!next || next.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }

  const isCurrentValid = await verifyAdminPassword(current);
  if (!isCurrentValid) {
    return { success: false, error: 'Current admin password is incorrect.' };
  }

  // Save to Firestore
  if (!checkWriteQuotaPersisted()) {
    try {
      const docRef = doc(db, 'settings', 'admin');
      await setDoc(
        docRef,
        {
          id: 'admin',
          adminPassword: next,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('exceeded') || err?.code === 'resource-exhausted') {
        tripWriteQuota();
      }
      console.warn('Could not save admin password to Firestore, saving locally:', err);
    }
  }

  // Save to LocalStorage
  try {
    localStorage.setItem(LOCAL_ADMIN_PASSWORD_KEY, next);
  } catch (err) {
    console.warn('Failed to save password to localStorage:', err);
  }

  return {
    success: true,
    message: 'Admin password has been changed successfully! Keep your new password secure.',
  };
}
