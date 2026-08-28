import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { UserProfile } from '../types';
import { savePremiumStatus, getStoredPremiumStatus, markUserAsPremium, clearPremiumStatus } from './paymentService';

const USER_CACHE_KEY = 'radmed_user_profile_cache';

// Load cached user profile
export function getCachedUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Save cached user profile
export function cacheUserProfile(profile: UserProfile | null) {
  try {
    if (profile) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(profile));
      if (profile.isPremium) {
        savePremiumStatus(profile.mpesaReceiptNumber, profile.phoneNumber || undefined, profile.provider || 'firebase_account');
      } else {
        clearPremiumStatus();
      }
    } else {
      localStorage.removeItem(USER_CACHE_KEY);
      clearPremiumStatus();
    }
  } catch {
    // ignore
  }
}

// Update user profile in Firestore
export async function updateUserPremiumStatusInFirestore(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      isPremium: true,
      unlockedAt: data.unlockedAt || new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Could not update user premium in Firestore:', err);
  }
}

// Fetch user profile from Firestore or create baseline
export async function syncUserProfileFromFirestore(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const localPrem = getStoredPremiumStatus();

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      // If local device had an unlinked M-Pesa receipt and user is now logging in, upgrade their cloud profile
      if (localPrem.isPremium && localPrem.receiptNumber && !data.isPremium) {
        data.isPremium = true;
        data.mpesaReceiptNumber = localPrem.receiptNumber;
        data.unlockedAt = localPrem.unlockedAt || new Date().toISOString();
        await updateDoc(userRef, {
          isPremium: true,
          mpesaReceiptNumber: data.mpesaReceiptNumber,
          unlockedAt: data.unlockedAt,
        }).catch(() => null);
      }

      if (data.isPremium) {
        markUserAsPremium(data.mpesaReceiptNumber, data.phoneNumber || undefined);
      } else {
        clearPremiumStatus();
      }

      cacheUserProfile(data);
      return data;
    } else {
      // Create new user profile document (Free by default, or Premium if paid)
      const hasPaid = Boolean(localPrem.isPremium && localPrem.receiptNumber);
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Clinician',
        isPremium: hasPaid,
        mpesaReceiptNumber: hasPaid ? localPrem.receiptNumber : undefined,
        phoneNumber: hasPaid ? localPrem.phoneNumber : undefined,
        unlockedAt: hasPaid ? (localPrem.unlockedAt || new Date().toISOString()) : undefined,
        provider: user.providerData?.[0]?.providerId || 'password',
        createdAt: new Date().toISOString(),
      };

      await setDoc(userRef, newProfile).catch((err) => {
        console.warn('Could not write user profile to Firestore (operating locally):', err);
      });

      if (hasPaid) {
        markUserAsPremium(newProfile.mpesaReceiptNumber, newProfile.phoneNumber);
      } else {
        clearPremiumStatus();
      }

      cacheUserProfile(newProfile);
      return newProfile;
    }
  } catch (err) {
    console.warn('Firestore user fetch failed, using fallback profile:', err);
    const hasPaid = Boolean(localPrem.isPremium && localPrem.receiptNumber);
    const fallbackProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Clinician',
      isPremium: hasPaid,
      mpesaReceiptNumber: hasPaid ? localPrem.receiptNumber : undefined,
      phoneNumber: hasPaid ? localPrem.phoneNumber : undefined,
      createdAt: new Date().toISOString(),
    };
    if (hasPaid) {
      markUserAsPremium(fallbackProfile.mpesaReceiptNumber, fallbackProfile.phoneNumber);
    } else {
      clearPremiumStatus();
    }
    cacheUserProfile(fallbackProfile);
    return fallbackProfile;
  }
}

// Create account with email and password
// ANY clinician can create a free account (gets 5 free cases); paid members get full access
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName?: string,
  paymentDetails?: { mpesaReceiptNumber?: string; phoneNumber?: string }
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName && cred.user) {
      await updateProfile(cred.user, { displayName }).catch(() => null);
    }

    const localPrem = getStoredPremiumStatus();
    // Only mark as premium if paymentDetails provided or already paid locally with receipt
    const hasPaid = Boolean(
      paymentDetails?.mpesaReceiptNumber || 
      (localPrem.isPremium && localPrem.receiptNumber && localPrem.receiptNumber.length > 5)
    );
    const mpesaReceipt = paymentDetails?.mpesaReceiptNumber || (hasPaid ? localPrem.receiptNumber : undefined);
    const phone = paymentDetails?.phoneNumber || (hasPaid ? localPrem.phoneNumber : undefined);

    const profile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: displayName || email.split('@')[0],
      isPremium: hasPaid,
      mpesaReceiptNumber: mpesaReceipt,
      phoneNumber: phone,
      unlockedAt: hasPaid ? new Date().toISOString() : undefined,
      provider: 'email_password',
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, 'users', cred.user.uid), profile);
    } catch (e) {
      console.warn('Failed saving user document to Firestore:', e);
    }

    if (hasPaid) {
      markUserAsPremium(mpesaReceipt, phone);
    } else {
      clearPremiumStatus();
    }
    cacheUserProfile(profile);

    return { success: true, user: profile };
  } catch (err: any) {
    let msg = err.message || 'Account registration failed.';
    if (err.code === 'auth/email-already-in-use') {
      msg = 'This email already has an account. Please log in to restore your access.';
    } else if (err.code === 'auth/weak-password') {
      msg = 'Password should be at least 6 characters.';
    } else if (err.code === 'auth/invalid-email') {
      msg = 'Please enter a valid email address.';
    }
    return { success: false, error: msg };
  }
}

// Log in with email and password
export async function loginWithEmail(
  email: string,
  pass: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const profile = await syncUserProfileFromFirestore(cred.user);
    return { success: true, user: profile };
  } catch (err: any) {
    let msg = err.message || 'Login failed.';
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      msg = 'Invalid email or password. Please check your credentials.';
    }
    return { success: false, error: msg };
  }
}

// Sign in or register with Google Popup
export async function signInWithGoogleAccount(
  paymentDetails?: { mpesaReceiptNumber?: string; phoneNumber?: string }
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const userRef = doc(db, 'users', cred.user.uid);
    const localPrem = getStoredPremiumStatus();

    let profile: UserProfile;
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        profile = snap.data() as UserProfile;
        const hasPaid = Boolean(paymentDetails?.mpesaReceiptNumber || (localPrem.isPremium && localPrem.receiptNumber));
        if (hasPaid && !profile.isPremium) {
          profile.isPremium = true;
          profile.mpesaReceiptNumber = paymentDetails?.mpesaReceiptNumber || profile.mpesaReceiptNumber || localPrem.receiptNumber;
          profile.phoneNumber = paymentDetails?.phoneNumber || profile.phoneNumber || localPrem.phoneNumber;
          profile.unlockedAt = profile.unlockedAt || new Date().toISOString();
          await updateDoc(userRef, {
            isPremium: true,
            mpesaReceiptNumber: profile.mpesaReceiptNumber,
            phoneNumber: profile.phoneNumber,
            unlockedAt: profile.unlockedAt,
          }).catch(() => null);
        }
      } else {
        const hasPaid = Boolean(paymentDetails?.mpesaReceiptNumber || (localPrem.isPremium && localPrem.receiptNumber));
        profile = {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'Clinician',
          isPremium: hasPaid,
          mpesaReceiptNumber: paymentDetails?.mpesaReceiptNumber || (hasPaid ? localPrem.receiptNumber : undefined),
          phoneNumber: paymentDetails?.phoneNumber || (hasPaid ? localPrem.phoneNumber : undefined),
          unlockedAt: hasPaid ? (localPrem.unlockedAt || new Date().toISOString()) : undefined,
          provider: 'google',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, profile).catch(() => null);
      }
    } catch {
      const hasPaid = Boolean(paymentDetails?.mpesaReceiptNumber || (localPrem.isPremium && localPrem.receiptNumber));
      profile = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
        isPremium: hasPaid,
        mpesaReceiptNumber: paymentDetails?.mpesaReceiptNumber || (hasPaid ? localPrem.receiptNumber : undefined),
      };
    }

    if (profile.isPremium) {
      markUserAsPremium(profile.mpesaReceiptNumber, profile.phoneNumber || undefined);
    } else {
      clearPremiumStatus();
    }
    cacheUserProfile(profile);

    return { success: true, user: profile };
  } catch (err: any) {
    if (err.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Google sign-in popup was closed.' };
    }
    return { success: false, error: err.message || 'Google sign-in failed.' };
  }
}

// Log out user
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
  clearPremiumStatus();
  cacheUserProfile(null);
}

// Subscribe to auth changes
export function subscribeToAuth(
  onUserChanged: (user: UserProfile | null) => void
): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const profile = await syncUserProfileFromFirestore(firebaseUser);
      onUserChanged(profile);
    } else {
      const cached = getCachedUserProfile();
      onUserChanged(cached);
    }
  });
}
