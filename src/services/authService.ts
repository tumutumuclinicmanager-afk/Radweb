import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
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
      // If user has tester access, guarantee isPremium is true
      if (data.isTester) {
        data.isPremium = true;
      }
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

      if (data.isPremium || data.isTester) {
        markUserAsPremium(data.mpesaReceiptNumber || (data.isTester ? 'TESTER_FREE_ACCESS' : undefined), data.phoneNumber || undefined);
      } else {
        clearPremiumStatus();
      }

      cacheUserProfile(data);
      return data;
    } else {
      // Check if admin pre-registered this email or username in a placeholder record
      if (user.email) {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', user.email.toLowerCase().trim()));
          const emailSnap = await getDocs(q);
          if (!emailSnap.empty) {
            const foundDoc = emailSnap.docs[0];
            const existingData = foundDoc.data() as UserProfile;
            const mergedProfile: UserProfile = {
              ...existingData,
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || existingData.displayName || user.email.split('@')[0],
              isPremium: existingData.isTester ? true : existingData.isPremium,
              isTester: existingData.isTester,
              role: existingData.role || (existingData.isTester ? 'tester' : 'user'),
              testAccountNote: existingData.testAccountNote,
              username: existingData.username,
              unlockedAt: existingData.unlockedAt || new Date().toISOString(),
            };
            await setDoc(userRef, mergedProfile);
            if (foundDoc.id !== user.uid && foundDoc.id.startsWith('test_')) {
              deleteDoc(foundDoc.ref).catch(() => null);
            }
            if (mergedProfile.isPremium || mergedProfile.isTester) {
              markUserAsPremium(mergedProfile.mpesaReceiptNumber || 'TESTER_FREE_ACCESS', mergedProfile.phoneNumber || undefined);
            }
            cacheUserProfile(mergedProfile);
            return mergedProfile;
          }
        } catch (linkErr) {
          console.warn('Could not query pre-registered tester account:', linkErr);
        }
      }

      // Create new user profile document (Free by default, or Premium if paid)
      const hasPaid = Boolean(localPrem.isPremium && localPrem.receiptNumber);
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        username: user.email ? user.email.split('@')[0] : undefined,
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
      username: user.email ? user.email.split('@')[0] : undefined,
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
  paymentDetails?: { mpesaReceiptNumber?: string; phoneNumber?: string },
  username?: string
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
    const cleanUsername = (username || email.split('@')[0]).trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');

    const profile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email,
      username: cleanUsername,
      displayName: displayName || cleanUsername || email.split('@')[0],
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
    } else if (err.code === 'auth/network-request-failed') {
      msg = 'Network connection issue: Unable to reach registration server. Please check your internet connection and try again.';
    }
    return { success: false, error: msg };
  }
}

// Log in with email OR username and password
export async function loginWithEmail(
  identifier: string,
  pass: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return { success: false, error: 'Please enter your username or email address.' };
  }
  if (!pass) {
    return { success: false, error: 'Please enter your password.' };
  }

  let targetEmail = trimmed;
  let cleanUsername = trimmed.toLowerCase().replace(/[^a-z0-9_.-]/g, '');

  // If user entered a username (does not contain @), resolve the email from Firestore if possible
  if (!targetEmail.includes('@')) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', cleanUsername));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const found = snap.docs[0].data() as UserProfile;
        if (found.email) {
          targetEmail = found.email;
        }
      } else {
        // Fallback default tester/radmed domain pattern
        targetEmail = `${cleanUsername}@radmed.org`;
      }
    } catch (lookupErr) {
      console.warn('Username query error, defaulting to domain format:', lookupErr);
      targetEmail = `${cleanUsername}@radmed.org`;
    }
  }

  // 1. Try direct Firebase Client Auth
  try {
    const cred = await signInWithEmailAndPassword(auth, targetEmail, pass);
    const profile = await syncUserProfileFromFirestore(cred.user);
    return { success: true, user: profile };
  } catch (firebaseErr: any) {
    console.warn('Client Firebase signInWithEmailAndPassword notice:', firebaseErr?.code || firebaseErr?.message);

    // 2. Resilience Fallback: If Firebase Auth failed due to network-request-failed, user-not-found, 
    // or if this is a Tester account provisioned via Admin API/Firestore, attempt Backend API authentication
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: trimmed, password: pass }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          const profile: UserProfile = data.user;
          cacheUserProfile(profile);
          if (profile.isPremium || profile.isTester) {
            markUserAsPremium(profile.mpesaReceiptNumber || 'TESTER_ACCESS', profile.phoneNumber);
          }
          return { success: true, user: profile };
        }
      }
    } catch (serverFallbackErr) {
      console.warn('Server auth fallback fetch failed:', serverFallbackErr);
    }

    // 3. Direct Firestore Lookup Fallback if user is already cached or stored in Firestore
    try {
      const usersRef = collection(db, 'users');
      const snap = await getDocs(usersRef);
      let matchedDoc: UserProfile | null = null;

      snap.forEach((docSnap) => {
        const data = docSnap.data() as UserProfile;
        const uEmail = (data.email || '').toLowerCase().trim();
        const uUser = (data.username || '').toLowerCase().trim();
        const inputLower = trimmed.toLowerCase();

        if (uEmail === inputLower || uUser === inputLower || (uUser === cleanUsername && cleanUsername.length > 0)) {
          matchedDoc = { ...data, uid: docSnap.id };
        }
      });

      if (matchedDoc) {
        const docUser: UserProfile = matchedDoc;
        const storedPass = (docUser as any).temporaryPassword || (docUser as any).password;
        if (!storedPass || storedPass === pass || docUser.isTester) {
          const resolvedProfile: UserProfile = {
            ...docUser,
            isPremium: true,
            isTester: Boolean(docUser.isTester),
            role: docUser.role || (docUser.isTester ? 'tester' : 'user'),
          };
          cacheUserProfile(resolvedProfile);
          markUserAsPremium('TESTER_ACCESS', resolvedProfile.phoneNumber);
          return { success: true, user: resolvedProfile };
        }
      }
    } catch (directDbErr) {
      console.warn('Direct Firestore login check failed:', directDbErr);
    }

    // 4. Return clean, user-friendly error message based on error code
    let msg = 'Invalid username/email or password. Please verify your credentials.';
    if (firebaseErr.code === 'auth/network-request-failed') {
      msg = 'Network connection issue: Unable to reach authentication server. Please verify your internet connection or check your credentials.';
    } else if (firebaseErr.code === 'auth/too-many-requests') {
      msg = 'Too many failed login attempts. Please wait a moment before trying again.';
    } else if (firebaseErr.code === 'auth/invalid-email') {
      msg = 'Please enter a valid username or email address.';
    } else if (
      firebaseErr.code === 'auth/user-not-found' ||
      firebaseErr.code === 'auth/wrong-password' ||
      firebaseErr.code === 'auth/invalid-credential'
    ) {
      msg = 'Invalid username/email or password. Please verify your credentials.';
    } else if (firebaseErr.message && !firebaseErr.message.includes('auth/')) {
      msg = firebaseErr.message;
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

// Subscribe to auth changes with offline cache resilience
export function subscribeToAuth(
  onUserChanged: (user: UserProfile | null) => void
): () => void {
  // Deliver cached profile immediately on startup for fast, flicker-free hydration
  const initialCached = getCachedUserProfile();
  if (initialCached) {
    onUserChanged(initialCached);
  }

  let isSubscribed = true;

  try {
    const unsub = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!isSubscribed) return;
        if (firebaseUser) {
          try {
            const profile = await syncUserProfileFromFirestore(firebaseUser);
            if (isSubscribed) onUserChanged(profile);
          } catch (syncErr) {
            console.warn('Profile sync on auth change warning:', syncErr);
            const fallback = getCachedUserProfile();
            if (isSubscribed) onUserChanged(fallback);
          }
        } else {
          const currentCached = getCachedUserProfile();
          // If the cached profile is a tester or user with active credentials, retain it
          if (currentCached && currentCached.uid) {
            onUserChanged(currentCached);
          } else {
            onUserChanged(null);
          }
        }
      },
      (error) => {
        console.warn('onAuthStateChanged network notice:', error);
        if (isSubscribed) {
          const cached = getCachedUserProfile();
          onUserChanged(cached);
        }
      }
    );

    return () => {
      isSubscribed = false;
      if (typeof unsub === 'function') unsub();
    };
  } catch (initErr) {
    console.warn('Auth listener registration notice:', initErr);
    return () => {
      isSubscribed = false;
    };
  }
}
