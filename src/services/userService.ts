import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, checkWriteQuotaPersisted, tripWriteQuota } from '../lib/firebase';
import { UserProfile } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

export interface UserStatistics {
  totalUsers: number;
  premiumUsersCount: number; // Paid / Lifetime Pro accounts
  testerUsersCount: number;  // Free testing accounts / complimentary access
  standardFreeCount: number; // Regular free tier users (5 CXR, 2 CT)
  totalUnlockedCount: number; // Total with full access (Premium + Testers)
}

export interface CreateTesterParams {
  username: string;
  password?: string;
  email?: string;
  displayName?: string;
  roleCategory?: string;
  note?: string;
  phoneNumber?: string;
  grantedBy?: string;
}

// Calculate user statistics
export function calculateUserMetrics(users: UserProfile[]): UserStatistics {
  let premiumUsersCount = 0;
  let testerUsersCount = 0;
  let standardFreeCount = 0;

  for (const user of users) {
    if (user.isTester) {
      testerUsersCount++;
    } else if (user.isPremium) {
      premiumUsersCount++;
    } else {
      standardFreeCount++;
    }
  }

  return {
    totalUsers: users.length,
    premiumUsersCount,
    testerUsersCount,
    standardFreeCount,
    totalUnlockedCount: premiumUsersCount + testerUsersCount,
  };
}

// Subscribe to real-time users collection updates
export function subscribeToUsers(
  onUsersUpdate: (users: UserProfile[]) => void,
  onError?: (err: Error) => void
): () => void {
  const usersRef = collection(db, 'users');
  
  return onSnapshot(
    usersRef,
    (snapshot) => {
      const usersList: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserProfile;
        usersList.push({
          ...data,
          uid: docSnap.id,
        });
      });
      // Sort by creation date descending
      usersList.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      onUsersUpdate(usersList);
    },
    (err) => {
      console.warn('Users onSnapshot subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// Fetch all users one-off with server fallback
export async function fetchAllUsersList(): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const usersList: UserProfile[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as UserProfile;
      usersList.push({
        ...data,
        uid: docSnap.id,
      });
    });

    if (usersList.length > 0) {
      usersList.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      return usersList;
    }
  } catch (err) {
    console.warn('Firestore fetch all users failed, attempting server API fallback:', err);
  }

  // Fallback to server endpoint
  try {
    const res = await fetch('/api/admin/users', {
      headers: {
        Authorization: 'Bearer radmed_admin_secret_key_2026',
      },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.users)) {
        return json.users;
      }
    }
  } catch (err) {
    console.warn('Server API user fetch failed:', err);
  }

  return [];
}

// Grant or Revoke Free Testing Access for a User
export async function setTesterAccess(
  uid: string,
  isTester: boolean,
  note?: string,
  adminIdentifier = 'Admin'
): Promise<{ success: boolean; message: string; error?: string }> {
  // 1. Try server API first
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(uid)}/tester`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer radmed_admin_secret_key_2026',
      },
      body: JSON.stringify({ isTester, note, grantedBy: adminIdentifier }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data;
    }
  } catch (apiErr) {
    console.warn('Server toggle tester status failed, falling back to client-side...', apiErr);
  }

  // 2. Client-side fallback check
  if (checkWriteQuotaPersisted()) {
    return {
      success: false,
      message: '',
      error: 'Firestore write quota is exceeded. Operating resiliently (cannot update tester status client-side).',
    };
  }

  try {
    const userRef = doc(db, 'users', uid);
    const updateData: Partial<UserProfile> = {
      isTester,
      isPremium: isTester ? true : false, // Testers get full unrestricted access
      role: isTester ? 'tester' : 'user',
      testAccountNote: isTester ? (note || 'Complimentary testing access') : undefined,
      grantedBy: isTester ? adminIdentifier : undefined,
      unlockedAt: isTester ? new Date().toISOString() : undefined,
    };

    await updateDoc(userRef, updateData);

    return {
      success: true,
      message: isTester
        ? 'Free testing access granted! User now has full unrestricted access.'
        : 'Testing access revoked. User returned to standard tier.',
    };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('exceeded') || err?.code === 'resource-exhausted') {
      tripWriteQuota();
    }
    console.error('Error updating tester status in Firestore:', err);
    return { success: false, message: '', error: err.message || 'Failed to update testing access status.' };
  }
}

// Toggle Premium Status directly (Paid Pro vs Free)
export async function toggleUserPremiumStatus(
  uid: string,
  isPremium: boolean
): Promise<{ success: boolean; message: string; error?: string }> {
  // 1. Try server API first
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(uid)}/premium`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer radmed_admin_secret_key_2026',
      },
      body: JSON.stringify({ isPremium }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data;
    }
  } catch (apiErr) {
    console.warn('Server toggle premium failed, falling back to client-side...', apiErr);
  }

  // 2. Client-side fallback check
  if (checkWriteQuotaPersisted()) {
    return {
      success: false,
      message: '',
      error: 'Firestore write quota is exceeded. Operating resiliently.',
    };
  }

  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isPremium,
      unlockedAt: isPremium ? new Date().toISOString() : undefined,
    });
    return {
      success: true,
      message: isPremium ? 'User granted Lifetime Pro status.' : 'User reverted to Free tier.',
    };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('exceeded') || err?.code === 'resource-exhausted') {
      tripWriteQuota();
    }
    return { success: false, message: '', error: err.message || 'Failed to update premium status.' };
  }
}

// Generate a secure random password for testers
export function generateRandomPassword(): string {
  const words = ['Rad', 'Med', 'CXR', 'Scan', 'Doc', 'Care', 'View', 'Pulse'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(100 + Math.random() * 900);
  const chars = '!@#$%&*';
  const char = chars[Math.floor(Math.random() * chars.length)];
  return `${word}${num}${char}26`;
}

// Create a new tester account with username, password, and instant Firebase Auth provisioning
export async function createNewTesterAccount(
  params: CreateTesterParams
): Promise<{
  success: boolean;
  user?: UserProfile;
  credentials?: { username: string; email: string; password: string };
  message?: string;
  error?: string;
}> {
  const rawUsername = params.username?.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  const cleanEmail = params.email?.trim().toLowerCase() || (rawUsername ? `${rawUsername}@radmed.org` : '');
  const cleanUsername = rawUsername || (cleanEmail ? cleanEmail.split('@')[0] : '');

  if (!cleanUsername && !cleanEmail) {
    return { success: false, error: 'Please provide a username or email address for the testing account.' };
  }

  const finalPassword = params.password && params.password.trim().length >= 6
    ? params.password.trim()
    : generateRandomPassword();

  const finalEmail = cleanEmail || `${cleanUsername}@radmed.org`;
  const displayName = params.displayName?.trim() || cleanUsername || finalEmail.split('@')[0];
  const combinedNote = params.roleCategory
    ? `[${params.roleCategory}] ${params.note?.trim() || 'Clinical Reviewer'}`
    : params.note?.trim() || 'Internal Clinical Tester';

  let authUid: string | null = null;

  // Provision in Firebase Authentication using an isolated secondary app instance
  try {
    const tempAppName = `testerApp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
      const userCred = await createUserWithEmailAndPassword(tempAuth, finalEmail, finalPassword);
      if (userCred.user) {
        authUid = userCred.user.uid;
        await updateProfile(userCred.user, { displayName }).catch(() => null);
      }
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-in-use') {
        console.info('Email already exists in Firebase Auth, updating Firestore permissions.');
      } else {
        console.warn('Firebase Auth user creation warning:', authErr);
      }
    } finally {
      await deleteApp(tempApp).catch(() => null);
    }
  } catch (initErr) {
    console.warn('Secondary Firebase App init failed, will save directly to Firestore:', initErr);
  }

  // Generate deterministic or safe UID if Firebase Auth didn't return one
  const safeId = authUid || 'test_' + finalEmail.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) + '_' + Math.random().toString(36).substring(2, 7);

  const profile: UserProfile = {
    uid: safeId,
    email: finalEmail,
    username: cleanUsername,
    displayName,
    isPremium: true,
    isTester: true,
    role: 'tester',
    testAccountNote: combinedNote,
    phoneNumber: params.phoneNumber?.trim() || undefined,
    temporaryPassword: finalPassword,
    grantedBy: params.grantedBy || 'Admin Portal',
    provider: 'tester_credentials',
    createdAt: new Date().toISOString(),
    unlockedAt: new Date().toISOString(),
  };

  // 1. Prioritize Server-Side API
  try {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer radmed_admin_secret_key_2026',
      },
      body: JSON.stringify({
        ...profile,
        password: finalPassword,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          user: data.user || profile,
          credentials: {
            username: cleanUsername,
            email: finalEmail,
            password: finalPassword,
          },
          message: data.message,
        };
      }
    }
  } catch (apiErr) {
    console.warn('Server tester creation failed, falling back to client write...', apiErr);
  }

  // 2. Client-side fallback checks
  if (checkWriteQuotaPersisted()) {
    console.info('[Quota Shield] registerTesterInFirestore direct write skipped due to active circuit breaker.');
    return {
      success: true,
      user: profile,
      credentials: {
        username: cleanUsername,
        email: finalEmail,
        password: finalPassword,
      },
      message: `Testing account registered locally. Access is granted locally (Quota Exceeded).`,
    };
  }

  try {
    const userRef = doc(db, 'users', safeId);
    await setDoc(userRef, profile, { merge: true });

    return {
      success: true,
      user: profile,
      credentials: {
        username: cleanUsername,
        email: finalEmail,
        password: finalPassword,
      },
      message: `Testing account created for "${cleanUsername}" with full access.`,
    };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('exceeded') || err?.code === 'resource-exhausted') {
      tripWriteQuota();
    }
    console.error('Error creating tester in Firestore fallback:', err);
    return { success: false, error: err.message || 'Failed to create testing account.' };
  }
}

// Update tester credentials or details
export async function updateTesterCredentials(
  uid: string,
  params: {
    username?: string;
    password?: string;
    displayName?: string;
    note?: string;
    phoneNumber?: string;
  }
): Promise<{ success: boolean; message: string; error?: string }> {
  // 1. Try server API first
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(uid)}/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer radmed_admin_secret_key_2026',
      },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data;
    }
  } catch (apiErr) {
    console.warn('Server update credentials failed, falling back to client-side...', apiErr);
  }

  // 2. Client-side fallback check
  if (checkWriteQuotaPersisted()) {
    return {
      success: false,
      message: '',
      error: 'Firestore write quota is exceeded. Operating resiliently.',
    };
  }

  try {
    const userRef = doc(db, 'users', uid);
    const updates: Partial<UserProfile> = {};
    if (params.username) updates.username = params.username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (params.displayName) updates.displayName = params.displayName.trim();
    if (params.password) updates.temporaryPassword = params.password.trim();
    if (params.note !== undefined) updates.testAccountNote = params.note.trim();
    if (params.phoneNumber !== undefined) updates.phoneNumber = params.phoneNumber.trim() || undefined;

    await updateDoc(userRef, updates);
    return { success: true, message: 'Tester credentials updated successfully.' };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('exceeded') || err?.code === 'resource-exhausted') {
      tripWriteQuota();
    }
    return { success: false, message: '', error: err.message || 'Failed to update credentials.' };
  }
}

// Delete user account from Firestore
export async function deleteUserAccount(
  uid: string
): Promise<{ success: boolean; message: string; error?: string }> {
  // 1. Try server API first
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(uid)}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer radmed_admin_secret_key_2026',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data;
    }
  } catch (apiErr) {
    console.warn('Server delete account failed, falling back to client-side...', apiErr);
  }

  // 2. Client-side fallback check
  if (checkWriteQuotaPersisted()) {
    return {
      success: false,
      message: '',
      error: 'Firestore write quota is exceeded. Operating resiliently.',
    };
  }

  try {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);

    // Run background server-sync fire-and-forget
    fetch(`/api/admin/users/${encodeURIComponent(uid)}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer radmed_admin_secret_key_2026',
      },
    }).catch(() => null);

    return {
      success: true,
      message: 'Account successfully removed from database.',
    };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('exceeded') || err?.code === 'resource-exhausted') {
      tripWriteQuota();
    }
    console.error('Error deleting user from Firestore:', err);
    return { success: false, message: '', error: err.message || 'Failed to delete user account.' };
  }
}

// Bulk delete testing accounts
export async function bulkDeleteTesterAccounts(
  uids: string[]
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  if (!uids || uids.length === 0) {
    return { success: true, deletedCount: 0 };
  }

  // 1. Try server API first
  try {
    const res = await fetch('/api/admin/users/bulk-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer radmed_admin_secret_key_2026',
      },
      body: JSON.stringify({ uids }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return { success: true, deletedCount: data.deletedCount };
      }
    }
  } catch (apiErr) {
    console.warn('Server bulk delete failed, falling back to client-side...', apiErr);
  }

  // 2. Client-side fallback check
  if (checkWriteQuotaPersisted()) {
    return {
      success: false,
      deletedCount: 0,
      error: 'Firestore write quota is exceeded. Operating resiliently.',
    };
  }

  try {
    const batch = writeBatch(db);
    for (const uid of uids) {
      batch.delete(doc(db, 'users', uid));
    }
    await batch.commit();
    return { success: true, deletedCount: uids.length };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('exceeded') || err?.code === 'resource-exhausted') {
      tripWriteQuota();
    }
    console.error('Error bulk deleting in Firestore:', err);
    // Fallback one-by-one
    let count = 0;
    for (const uid of uids) {
      try {
        await deleteDoc(doc(db, 'users', uid));
        count++;
      } catch (singleErr: any) {
        const sMsg = singleErr?.message || String(singleErr);
        if (sMsg.toLowerCase().includes('quota') || sMsg.toLowerCase().includes('exceeded') || singleErr?.code === 'resource-exhausted') {
          tripWriteQuota();
          break; // Stop loop if quota triggered
        }
      }
    }
    return { success: count > 0, deletedCount: count };
  }
}
