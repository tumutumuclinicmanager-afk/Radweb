import { collection, getDocs, doc, setDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MedicalCase } from '../types';
import { MEDICAL_CASES } from '../data/casesData';
import firebaseConfig from '../../firebase-applet-config.json';

const COLLECTION_NAME = 'cases';
const LOCAL_STORAGE_KEY = 'radmed_custom_cases_cache';

export interface DiagnosticLogEntry {
  id: string;
  timestamp: number; // raw epoch milliseconds
  isoTime: string;
  level: 'info' | 'success' | 'warn' | 'error';
  category: 'sync' | 'connection' | 'storage' | 'restore' | 'auth';
  message: string;
  details?: any;
}

export interface SyncDiagnosticData {
  connectionStatus: 'connected' | 'offline' | 'checking' | 'error';
  lastPingLatencyMs: number | null;
  lastSuccessfulSyncTimestamp: number | null; // raw epoch timestamp
  lastSuccessfulSyncIso: string | null;
  lastSyncSource: 'merged' | 'firestore' | 'static-seed' | 'local-storage';
  lastSyncCaseCount: number;
  staticSeedCount: number;
  remoteFirestoreCount: number;
  localCacheCount: number;
  databaseId: string;
  projectId: string;
  lastErrorMessage: string | null;
  localCacheKey: string;
  hasFallbackSeedProtected: boolean;
  logs: DiagnosticLogEntry[];
}

let diagnosticState: SyncDiagnosticData = {
  connectionStatus: 'checking',
  lastPingLatencyMs: null,
  lastSuccessfulSyncTimestamp: null,
  lastSuccessfulSyncIso: null,
  lastSyncSource: 'static-seed',
  lastSyncCaseCount: MEDICAL_CASES.length,
  staticSeedCount: MEDICAL_CASES.length,
  remoteFirestoreCount: 0,
  localCacheCount: 0,
  databaseId: firebaseConfig.firestoreDatabaseId || 'default',
  projectId: firebaseConfig.projectId || 'unknown',
  lastErrorMessage: null,
  localCacheKey: LOCAL_STORAGE_KEY,
  hasFallbackSeedProtected: true,
  logs: [],
};

const listeners = new Set<(state: SyncDiagnosticData) => void>();

function notifySubscribers() {
  const snapshot = { ...diagnosticState, logs: [...diagnosticState.logs] };
  listeners.forEach((cb) => {
    try {
      cb(snapshot);
    } catch (e) {
      console.error('Diagnostic subscriber error:', e);
    }
  });
}

export function getDiagnosticState(): SyncDiagnosticData {
  return { ...diagnosticState, logs: [...diagnosticState.logs] };
}

export function subscribeToDiagnostics(callback: (data: SyncDiagnosticData) => void): () => void {
  listeners.add(callback);
  callback(getDiagnosticState());
  return () => {
    listeners.delete(callback);
  };
}

export function addDiagnosticLog(
  level: 'info' | 'success' | 'warn' | 'error',
  category: DiagnosticLogEntry['category'],
  message: string,
  details?: any
) {
  const now = Date.now();
  const entry: DiagnosticLogEntry = {
    id: `log-${now}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: now,
    isoTime: new Date(now).toISOString(),
    level,
    category,
    message,
    details: details ? (typeof details === 'object' ? JSON.parse(JSON.stringify(details)) : details) : undefined,
  };

  // Keep last 150 log items
  diagnosticState.logs = [entry, ...diagnosticState.logs.slice(0, 149)];
  notifySubscribers();
}

/**
 * Tests live connection to Firestore using getDocFromServer and measuring round-trip latency.
 */
export async function testFirestoreConnection(): Promise<{
  success: boolean;
  latencyMs: number;
  status: 'connected' | 'offline' | 'error';
  message: string;
}> {
  const startTime = Date.now();
  diagnosticState.connectionStatus = 'checking';
  notifySubscribers();

  addDiagnosticLog('info', 'connection', `Initiating live Firestore ping to database "${diagnosticState.databaseId}"...`);

  try {
    // Perform server-side document probe
    await getDocFromServer(doc(db, 'test', 'connection'));
    const latencyMs = Date.now() - startTime;

    diagnosticState.connectionStatus = 'connected';
    diagnosticState.lastPingLatencyMs = latencyMs;
    diagnosticState.lastErrorMessage = null;

    addDiagnosticLog('success', 'connection', `Firestore server ping successful (${latencyMs}ms roundtrip)`, {
      databaseId: diagnosticState.databaseId,
      projectId: diagnosticState.projectId,
      latencyMs,
    });

    notifySubscribers();
    return {
      success: true,
      latencyMs,
      status: 'connected',
      message: `Connected successfully (${latencyMs}ms)`,
    };
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    const errMsg = error?.message || String(error);
    const isOffline = errMsg.includes('offline') || errMsg.includes('unavailable') || errMsg.includes('network');

    diagnosticState.connectionStatus = isOffline ? 'offline' : 'error';
    diagnosticState.lastPingLatencyMs = latencyMs;
    diagnosticState.lastErrorMessage = errMsg;

    addDiagnosticLog(
      isOffline ? 'warn' : 'error',
      'connection',
      `Firestore connection probe result: ${isOffline ? 'Offline / Awaiting Network' : 'Permission / API Error'} (${latencyMs}ms)`,
      { error: errMsg, latencyMs }
    );

    notifySubscribers();
    return {
      success: false,
      latencyMs,
      status: isOffline ? 'offline' : 'error',
      message: errMsg,
    };
  }
}

/**
 * Main 3-tier sync function:
 * Tier 1: Static Seed Baseline (20 curated cases)
 * Tier 2: Remote Firestore Overlay
 * Tier 3: LocalStorage Custom Cases Cache
 */
export async function fetchCases(): Promise<MedicalCase[]> {
  const syncStartTime = Date.now();
  addDiagnosticLog('info', 'sync', 'Starting 3-tier case synchronization pipeline...');

  let remoteCases: MedicalCase[] = [];
  let remoteFetchSuccess = false;
  let remoteErrorDesc: string | null = null;

  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const casesMap = new Map<string, MedicalCase>();
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as MedicalCase;
      if (data && data.id) {
        casesMap.set(data.id, data);
      }
    });
    remoteCases = Array.from(casesMap.values());
    remoteFetchSuccess = true;
    diagnosticState.connectionStatus = 'connected';
    diagnosticState.remoteFirestoreCount = remoteCases.length;

    addDiagnosticLog('success', 'sync', `Fetched ${remoteCases.length} documents from Firestore collection "${COLLECTION_NAME}".`, {
      remoteDocumentCount: remoteCases.length,
      collection: COLLECTION_NAME,
    });
  } catch (error: any) {
    remoteErrorDesc = error?.message || String(error);
    const isOffline = remoteErrorDesc.includes('offline') || remoteErrorDesc.includes('unavailable');
    diagnosticState.connectionStatus = isOffline ? 'offline' : 'error';
    diagnosticState.lastErrorMessage = remoteErrorDesc;

    addDiagnosticLog('warn', 'sync', `Firestore query note: ${remoteErrorDesc}. Utilizing robust fallback overlay tiers.`);
  }

  // Load locally cached custom cases
  let localCustomCases: MedicalCase[] = [];
  try {
    const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedLocal) {
      localCustomCases = JSON.parse(savedLocal);
      if (!Array.isArray(localCustomCases)) localCustomCases = [];
    }
  } catch (e) {
    addDiagnosticLog('warn', 'storage', 'Could not parse local custom cases cache from localStorage.');
  }

  diagnosticState.localCacheCount = localCustomCases.length;
  diagnosticState.staticSeedCount = MEDICAL_CASES.length;

  // 3-Tier Merge Matrix
  const combinedMap = new Map<string, MedicalCase>();
  
  // 1. Include baseline 20 curated cases first
  for (const c of MEDICAL_CASES) {
    combinedMap.set(c.id, c);
  }
  // 2. Overlay remote cases from Firestore
  for (const c of remoteCases) {
    combinedMap.set(c.id, c);
  }
  // 3. Overlay local custom cases
  for (const c of localCustomCases) {
    combinedMap.set(c.id, c);
  }

  const finalCases = Array.from(combinedMap.values());
  const now = Date.now();

  diagnosticState.lastSuccessfulSyncTimestamp = now;
  diagnosticState.lastSuccessfulSyncIso = new Date(now).toISOString();
  diagnosticState.lastSyncCaseCount = finalCases.length;
  diagnosticState.hasFallbackSeedProtected = finalCases.length >= MEDICAL_CASES.length;
  diagnosticState.lastSyncSource = remoteFetchSuccess && remoteCases.length > 0 ? 'firestore' : 'merged';

  addDiagnosticLog('success', 'sync', `Synchronization complete: ${finalCases.length} total cases loaded.`, {
    rawTimestamp: now,
    isoTimestamp: diagnosticState.lastSuccessfulSyncIso,
    durationMs: now - syncStartTime,
    breakdown: {
      staticBaselineSeed: MEDICAL_CASES.length,
      remoteFirestore: remoteCases.length,
      localCache: localCustomCases.length,
      finalTotalInState: finalCases.length,
    },
    emptyArrayGuardActive: true,
  });

  notifySubscribers();
  return finalCases;
}

export async function addCaseToFirestore(newCase: MedicalCase): Promise<void> {
  addDiagnosticLog('info', 'sync', `Saving case "${newCase.title}" (ID: ${newCase.id})...`);

  // Always update local cache
  try {
    const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    const localCases: MedicalCase[] = savedLocal ? JSON.parse(savedLocal) : [];
    const updated = [newCase, ...localCases.filter(c => c.id !== newCase.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    diagnosticState.localCacheCount = updated.length;
    addDiagnosticLog('info', 'storage', `Case "${newCase.title}" written to local browser cache.`);
  } catch (e) {
    addDiagnosticLog('warn', 'storage', 'Failed to write case to localStorage.');
  }

  try {
    await setDoc(doc(db, COLLECTION_NAME, newCase.id), newCase);
    addDiagnosticLog('success', 'sync', `Case "${newCase.title}" persisted directly to Firestore.`);
  } catch (error: any) {
    addDiagnosticLog('warn', 'sync', `Firestore write encountered an error: ${error?.message || error}. Case remains safe in local cache.`);
  }

  notifySubscribers();
}

export async function deleteCaseFromFirestore(caseId: string): Promise<void> {
  addDiagnosticLog('info', 'sync', `Deleting case ID: ${caseId}...`);

  // Remove from local cache
  try {
    const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedLocal) {
      const localCases: MedicalCase[] = JSON.parse(savedLocal);
      const updated = localCases.filter(c => c.id !== caseId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      diagnosticState.localCacheCount = updated.length;
    }
  } catch (e) {
    // ignore
  }

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, caseId));
    addDiagnosticLog('success', 'sync', `Deleted case ID ${caseId} from Firestore.`);
  } catch (error: any) {
    addDiagnosticLog('warn', 'sync', `Firestore delete note: ${error?.message || error}. Case removed locally.`);
  }

  notifySubscribers();
}

/**
 * Reseeds all 20 curated baseline cases to Firestore and local cache.
 */
export async function reseedFirestoreWithBaselineCases(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  addDiagnosticLog('info', 'restore', `Initiating database re-seed of ${MEDICAL_CASES.length} curated baseline cases to Firestore...`);

  let successCount = 0;
  let lastErr: string | undefined;

  // Reseed local cache
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MEDICAL_CASES));
    diagnosticState.localCacheCount = MEDICAL_CASES.length;
    addDiagnosticLog('success', 'storage', `Local storage cache populated with ${MEDICAL_CASES.length} curated cases.`);
  } catch (e: any) {
    addDiagnosticLog('warn', 'storage', `Local storage write error: ${e?.message || e}`);
  }

  // Reseed Firestore
  for (const c of MEDICAL_CASES) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, c.id), c);
      successCount++;
    } catch (err: any) {
      lastErr = err?.message || String(err);
    }
  }

  diagnosticState.remoteFirestoreCount = successCount;
  const now = Date.now();
  diagnosticState.lastSuccessfulSyncTimestamp = now;
  diagnosticState.lastSuccessfulSyncIso = new Date(now).toISOString();

  if (successCount > 0) {
    addDiagnosticLog('success', 'restore', `Successfully seeded ${successCount}/${MEDICAL_CASES.length} cases into Firestore.`, {
      seededCount: successCount,
      rawTimestamp: now,
    });
  } else {
    addDiagnosticLog('warn', 'restore', `Could not write to remote Firestore: ${lastErr}. Baseline cases remain active in local memory & cache.`, {
      lastErr,
    });
  }

  notifySubscribers();
  return {
    success: successCount > 0,
    count: successCount,
    error: lastErr,
  };
}

/**
 * Clears local custom cache
 */
export function clearLocalCasesCache(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    diagnosticState.localCacheCount = 0;
    addDiagnosticLog('info', 'storage', 'Cleared local custom cases cache from browser storage.');
    notifySubscribers();
  } catch (e) {
    // ignore
  }
}

/**
 * Inspects localStorage cache
 */
export function inspectLocalCache(): { key: string; rawLength: number; parsedCount: number; items: any[] } {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY) || '[]';
    const parsed = JSON.parse(raw);
    return {
      key: LOCAL_STORAGE_KEY,
      rawLength: raw.length,
      parsedCount: Array.isArray(parsed) ? parsed.length : 0,
      items: Array.isArray(parsed) ? parsed : [],
    };
  } catch (e) {
    return {
      key: LOCAL_STORAGE_KEY,
      rawLength: 0,
      parsedCount: 0,
      items: [],
    };
  }
}

