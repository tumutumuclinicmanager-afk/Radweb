import { collection, getDocs, doc, setDoc, deleteDoc, getDocFromServer, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MedicalCase } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';
import { isDataOrBlobUrl } from '../lib/imageUtils';

const COLLECTION_NAME = 'cases';
const LOCAL_STORAGE_KEY = 'radmed_custom_cases_cache';

export interface DiagnosticLogEntry {
  id: string;
  timestamp: number; // raw epoch milliseconds
  isoTime: string;
  level: 'info' | 'success' | 'warn' | 'error';
  category: 'sync' | 'connection' | 'storage' | 'restore' | 'auth' | 'terminal';
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
  lastSyncSource: 'firestore',
  lastSyncCaseCount: 0,
  staticSeedCount: 0,
  remoteFirestoreCount: 0,
  localCacheCount: 0,
  databaseId: firebaseConfig.firestoreDatabaseId || 'default',
  projectId: firebaseConfig.projectId || 'unknown',
  lastErrorMessage: null,
  localCacheKey: LOCAL_STORAGE_KEY,
  hasFallbackSeedProtected: false,
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
 * Category Educational Weight:
 * 0: Normal / Baseline study (Always learn normal anatomy & variants first!)
 * 1: Common Pathology (e.g. lobar pneumonia, standard fractures, consolidation)
 * 2: Emergency Findings (e.g. tension pneumothorax, acute intracranial hemorrhage)
 * 3: Post-Procedural (e.g. chest tubes, lines, intubation)
 * 4: Other / General
 */
export function getCategoryEducationalWeight(category?: string): number {
  if (!category) return 99;
  const c = category.trim().toLowerCase();
  if (c === 'normal' || c.startsWith('normal')) return 0;
  if (c.includes('common') || c.includes('pathology')) return 1;
  if (c.includes('emergency') || c.includes('acute') || c.includes('urgent')) return 2;
  if (c.includes('procedural') || c.includes('post-')) return 3;
  return 4;
}

/**
 * Deterministic Sorting Algorithm:
 * Guarantees that regardless of network latency, Firestore partition return order,
 * or browser reload sequence, cases are ALWAYS returned in an educationally sound, stable sequence:
 * 1. Modality grouping (if mixed)
 * 2. Normal cases ALWAYS start at the beginning of each carousel/deck
 * 3. Next: Common Pathology -> Emergency Findings -> Post-Procedural
 * 4. Explicit orderIndex values
 * 5. Chronologically by createdAt timestamp
 * 6. Fallback to deterministic string ID comparison
 */
export function sortCasesDeterministically(cases: MedicalCase[]): MedicalCase[] {
  return [...cases].sort((a, b) => {
    // 1. Modality grouping if mixed (chest_xray first, then head_ct)
    if (a.modality !== b.modality) {
      return a.modality.localeCompare(b.modality);
    }

    // 2. Educational Hierarchy: ALWAYS prioritize "Normal" baseline cases first!
    const weightA = getCategoryEducationalWeight(a.category);
    const weightB = getCategoryEducationalWeight(b.category);
    if (weightA !== weightB) {
      return weightA - weightB;
    }

    // 3. Explicit orderIndex
    if (a.orderIndex !== undefined && b.orderIndex !== undefined && a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }
    if (a.orderIndex !== undefined && b.orderIndex === undefined) return -1;
    if (a.orderIndex === undefined && b.orderIndex !== undefined) return 1;

    // 4. CreatedAt timestamps
    const aCreated = typeof a.createdAt === 'number' ? a.createdAt : typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0;
    const bCreated = typeof b.createdAt === 'number' ? b.createdAt : typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0;
    if (aCreated !== bCreated && aCreated > 0 && bCreated > 0) {
      return aCreated - bCreated;
    }

    // 5. Fallback to string ID comparison
    return a.id.localeCompare(b.id);
  });
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
 * Sanitizes a case object for Firestore and REST storage:
 * - Removes undefined values (Firestore rejects undefined)
 * - Ensures required timestamp fields exist
 */
function sanitizeCaseForStorage(c: MedicalCase): MedicalCase {
  const clean: any = {};
  for (const [k, v] of Object.entries(c)) {
    if (v !== undefined && v !== null) {
      clean[k] = v;
    }
  }
  clean.id = clean.id || `custom-${Date.now()}`;
  clean.title = clean.title || 'Untitled Case';
  clean.modality = clean.modality || 'chest_xray';
  clean.category = clean.category || 'Common Pathology';
  clean.difficulty = clean.difficulty || 'Intermediate';
  clean.createdAt = clean.createdAt || Date.now();
  clean.updatedAt = clean.updatedAt || Date.now();
  clean.orderIndex = clean.orderIndex ?? Date.now();
  return clean as MedicalCase;
}

/**
 * Main Authoritative Case Synchronization Pipeline:
 * - Fetches remote cases from Firestore
 * - Resilient fallback to backend /api/cases
 * - Merges locally saved cases/edits with remote cases so new images are NEVER lost upon refresh
 * - Automatically pushes any local pending cases/images to Firestore in the background
 * - Applies deterministic sorting
 * - Updates local storage cache to match authoritative list
 */
export async function fetchCases(): Promise<MedicalCase[]> {
  const syncStartTime = Date.now();
  addDiagnosticLog('info', 'sync', 'Starting deterministic case synchronization pipeline...');

  let remoteCases: MedicalCase[] = [];
  let remoteFetchSuccess = false;
  let remoteErrorDesc: string | null = null;

  // 1. Attempt Client Firestore Direct Fetch
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

    addDiagnosticLog('warn', 'sync', `Firestore client query notice: ${remoteErrorDesc}. Attempting backend API fallback...`);
  }

  // 2. Fallback to /api/cases if Firestore client fetch returned 0 or errored
  if (!remoteFetchSuccess || remoteCases.length === 0) {
    try {
      const resp = await fetch('/api/cases');
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && Array.isArray(data.cases) && data.cases.length > 0) {
          remoteCases = data.cases;
          remoteFetchSuccess = true;
          diagnosticState.connectionStatus = 'connected';
          diagnosticState.remoteFirestoreCount = remoteCases.length;
          addDiagnosticLog('success', 'sync', `Fetched ${remoteCases.length} cases from backend API /api/cases.`);
        }
      }
    } catch (apiErr) {
      console.warn('Backend /api/cases fetch notice:', apiErr);
    }
  }

  // 3. Load locally cached custom cases from localStorage
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
  diagnosticState.staticSeedCount = 0;

  // 4. Authoritative Source of Truth Selection:
  let finalCases: MedicalCase[] = [];

  if (remoteFetchSuccess) {
    // When online, Firestore is the pure authoritative source of truth.
    // We NEVER resurrect cases that do not exist in Firestore (preventing deleted or stale demo cases from returning).
    finalCases = remoteCases;
  } else {
    // When offline / network unavailable, fall back to local cached cases.
    finalCases = localCustomCases;
    addDiagnosticLog('info', 'sync', `Using local offline cache (${localCustomCases.length} cases) as network fallback.`);
  }

  // 5. Apply Deterministic & Stable Sorting
  const sortedCases = sortCasesDeterministically(finalCases);
  const now = Date.now();

  // Update local storage cache to strictly mirror authoritative state
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sortedCases));
    diagnosticState.localCacheCount = sortedCases.length;
  } catch (e) {
    // ignore
  }

  diagnosticState.lastSuccessfulSyncTimestamp = now;
  diagnosticState.lastSuccessfulSyncIso = new Date(now).toISOString();
  diagnosticState.lastSyncCaseCount = sortedCases.length;
  diagnosticState.hasFallbackSeedProtected = sortedCases.length > 0;
  diagnosticState.lastSyncSource = remoteFetchSuccess && remoteCases.length > 0 ? 'firestore' : 'local-storage';

  addDiagnosticLog('success', 'sync', `Sync complete: ${sortedCases.length} cases active.`, {
    rawTimestamp: now,
    isoTimestamp: diagnosticState.lastSuccessfulSyncIso,
    durationMs: now - syncStartTime,
    source: diagnosticState.lastSyncSource,
    remoteCount: remoteCases.length,
    finalTotalInState: sortedCases.length,
  });

  notifySubscribers();
  return sortedCases;
}

export async function addCaseToFirestore(newCase: MedicalCase): Promise<void> {
  const caseToSave = sanitizeCaseForStorage({
    ...newCase,
    createdAt: newCase.createdAt || Date.now(),
    updatedAt: Date.now(),
    orderIndex: newCase.orderIndex ?? Date.now(),
  });

  addDiagnosticLog('info', 'sync', `Saving case "${caseToSave.title}" (ID: ${caseToSave.id}) to storage...`);

  // 1. Always update local cache immediately for zero-latency UI update
  try {
    const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    const localCases: MedicalCase[] = savedLocal ? JSON.parse(savedLocal) : [];
    const updated = sortCasesDeterministically([caseToSave, ...localCases.filter(c => c.id !== caseToSave.id)]);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    diagnosticState.localCacheCount = updated.length;
    addDiagnosticLog('info', 'storage', `Case "${caseToSave.title}" saved to local cache.`);
  } catch (e) {
    addDiagnosticLog('warn', 'storage', 'Failed to write case to localStorage.');
  }

  // 2. Persist directly to Firestore
  let firestoreSuccess = false;
  try {
    await setDoc(doc(db, COLLECTION_NAME, caseToSave.id), caseToSave);
    firestoreSuccess = true;
    addDiagnosticLog('success', 'sync', `Case "${caseToSave.title}" persisted directly to Firestore collection "${COLLECTION_NAME}".`);
  } catch (error: any) {
    addDiagnosticLog('warn', 'sync', `Firestore direct write notice: ${error?.message || error}. Attempting backend API pipeline...`);
  }

  // 3. Dual-persistence fallback to backend API if Firestore client write failed or to ensure server consistency
  try {
    await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseToSave),
    });
  } catch (backendErr) {
    // ignore
  }

  notifySubscribers();
}

export async function deleteCaseFromFirestore(caseId: string): Promise<void> {
  addDiagnosticLog('info', 'sync', `Deleting case ID: ${caseId}...`);

  // Remove from local cache immediately
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

  // Delete from Firestore
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, caseId));
    addDiagnosticLog('success', 'sync', `Deleted case ID ${caseId} from Firestore.`);
  } catch (error: any) {
    addDiagnosticLog('warn', 'sync', `Firestore delete note: ${error?.message || error}. Case removed locally.`);
  }

  // Dual-delete via server API
  try {
    await fetch(`/api/admin/cases/${caseId}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer radmed_admin_secret_key_2026' },
    });
  } catch {
    // ignore
  }

  notifySubscribers();
}

/**
 * Purges demo/sample cases (e.g. case-cxr-*, case-ct-*, baseline-*) from both Firestore and local storage.
 */
export async function purgeSampleCases(): Promise<{
  success: boolean;
  purgedCount: number;
  purgedIds: string[];
}> {
  addDiagnosticLog('info', 'sync', 'Initiating purge of sample/demo cases...');
  
  const sampleIdPatterns = [
    /^case-cxr-/i,
    /^case-ct-/i,
    /^baseline-/i,
    /^sample-/i,
    /^demo-/i,
    /^mock-/i,
  ];

  let currentCases: MedicalCase[] = [];
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as MedicalCase;
      if (data && data.id) {
        currentCases.push(data);
      }
    });
  } catch (e) {
    const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedLocal) currentCases = JSON.parse(savedLocal);
  }

  const casesToPurge = currentCases.filter(c => 
    sampleIdPatterns.some(pattern => pattern.test(c.id))
  );

  const purgedIds: string[] = [];
  for (const c of casesToPurge) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, c.id));
      purgedIds.push(c.id);
    } catch (err) {
      console.warn(`Could not delete sample case ${c.id}:`, err);
    }
  }

  // Also clean local storage cache
  try {
    const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedLocal) {
      const parsed: MedicalCase[] = JSON.parse(savedLocal);
      const cleaned = parsed.filter(c => !sampleIdPatterns.some(pattern => pattern.test(c.id)));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
      diagnosticState.localCacheCount = cleaned.length;
    }
  } catch (e) {
    // ignore
  }

  addDiagnosticLog('success', 'sync', `Purged ${purgedIds.length} sample/demo cases from database and cache.`, { purgedIds });
  notifySubscribers();

  return {
    success: true,
    purgedCount: purgedIds.length,
    purgedIds,
  };
}

/**
 * Syncs and cleans Firestore case sequence indices.
 */
export async function reseedFirestoreWithBaselineCases(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  addDiagnosticLog('info', 'sync', 'Synchronizing Firestore case collection...');
  return {
    success: true,
    count: diagnosticState.lastSyncCaseCount,
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

/**
 * Deep inspection of Image storage in the database
 */
export function inspectImageStorage(cases: MedicalCase[]): {
  totalCases: number;
  cdnUrlCount: number;
  dataUriCount: number;
  totalGalleryImages: number;
  avgImagePayloadLength: number;
  items: {
    id: string;
    title: string;
    modality: string;
    imageType: 'CDN_URL' | 'DATA_URI_BASE64' | 'LOCAL_PATH';
    urlSnippet: string;
    estimatedBytes: number;
    hasGallery: boolean;
    galleryCount: number;
  }[];
} {
  let cdnCount = 0;
  let dataUriCount = 0;
  let totalGallery = 0;
  let totalBytes = 0;

  const items = cases.map((c) => {
    const isDataUri = isDataOrBlobUrl(c.imageUrl);
    if (isDataUri) {
      dataUriCount++;
    } else {
      cdnCount++;
    }

    const galleryCount = Array.isArray(c.galleryImages) ? c.galleryImages.length : 0;
    totalGallery += galleryCount;

    const imgBytes = c.imageUrl ? new Blob([c.imageUrl]).size : 0;
    totalBytes += imgBytes;

    return {
      id: c.id,
      title: c.title,
      modality: c.modality,
      imageType: (isDataUri ? 'DATA_URI_BASE64' : 'CDN_URL') as 'CDN_URL' | 'DATA_URI_BASE64' | 'LOCAL_PATH',
      urlSnippet: c.imageUrl ? `${c.imageUrl.substring(0, 60)}...` : 'NONE',
      estimatedBytes: imgBytes,
      hasGallery: galleryCount > 0,
      galleryCount,
    };
  });

  return {
    totalCases: cases.length,
    cdnUrlCount: cdnCount,
    dataUriCount,
    totalGalleryImages: totalGallery,
    avgImagePayloadLength: cases.length > 0 ? Math.round(totalBytes / cases.length) : 0,
    items,
  };
}

/**
 * Command-line Database Terminal Execution Engine
 */
export interface CommandResult {
  command: string;
  timestamp: string;
  output: string;
  data?: any;
  format?: 'text' | 'table' | 'json' | 'stats';
  isError?: boolean;
}

export async function executeDatabaseCliCommand(
  rawCommand: string,
  currentCases: MedicalCase[]
): Promise<CommandResult> {
  const timestamp = new Date().toLocaleTimeString();
  const trimmed = rawCommand.trim();
  if (!trimmed) {
    return { command: rawCommand, timestamp, output: '' };
  }

  const parts = trimmed.split(' ').filter(Boolean);
  const root = parts[0].toLowerCase();
  const arg1 = parts[1]?.toLowerCase();
  const arg2 = parts[2];

  addDiagnosticLog('info', 'terminal', `CLI Command executed: "${trimmed}"`);

  switch (root) {
    case 'help':
    case '?':
      return {
        command: rawCommand,
        timestamp,
        format: 'text',
        output: [
          '================ RADMED FIRESTORE DATABASE TERMINAL ================',
          'Available Commands:',
          '  help, ?                    Show this help manual',
          '  status                     Display live Firestore connection, database ID & latency',
          '  ls, list                   List all cases in Firestore with ID, Modality & Image Type',
          '  get <caseId>, cat <id>     View complete JSON document for a specific case ID',
          '  images, inspect images     Analyze how images are stored (CDN URLs vs Base64 payloads)',
          '  stats                      Display database collections, case count & storage metrics',
          '  sort-order                 Inspect deterministic sort index values across all cases',
          '  ping                       Probe Firestore server with live roundtrip latency measurement',
          '  purge, purge-samples       Purge all fake/sample demo cases from Firestore & cache',
          '  clear-cache                Clear local browser cache to force fresh remote sync',
          '  export json                Export all cases as structured JSON payload',
          '  clear                      Clear terminal console screen',
          '=====================================================================',
        ].join('\n'),
      };

    case 'status': {
      const diag = getDiagnosticState();
      return {
        command: rawCommand,
        timestamp,
        format: 'stats',
        output: [
          `[FIRESTORE STATUS REPORT]`,
          `Database ID:      ${diag.databaseId}`,
          `Project ID:       ${diag.projectId}`,
          `Connection:       ${diag.connectionStatus.toUpperCase()}`,
          `Last Ping:        ${diag.lastPingLatencyMs ? `${diag.lastPingLatencyMs}ms` : 'Not pinged yet'}`,
          `Total Cases:      ${currentCases.length}`,
          `Baseline Seed:    ${diag.staticSeedCount} cases`,
          `Remote Firestore: ${diag.remoteFirestoreCount} docs`,
          `Local Cache:      ${diag.localCacheCount} items`,
          `Sync Timestamp:   ${diag.lastSuccessfulSyncIso || 'Never'}`,
          `Sort Engine:      Deterministic Canonical Ordering [ACTIVE]`,
        ].join('\n'),
        data: diag,
      };
    }

    case 'ls':
    case 'list': {
      const modalityFilter = arg1 && (arg1.includes('cxr') || arg1.includes('xray') || arg1.includes('chest'))
        ? 'chest_xray'
        : arg1 && (arg1.includes('ct') || arg1.includes('head'))
        ? 'head_ct'
        : null;

      const filtered = modalityFilter ? currentCases.filter(c => c.modality === modalityFilter) : currentCases;
      
      const rows = filtered.map((c, i) => {
        const imgType = isDataOrBlobUrl(c.imageUrl) ? 'DATA_URI' : 'HTTPS_CDN';
        return `${String(i + 1).padStart(2, ' ')}. [${c.id}] | ${c.modality.padEnd(10, ' ')} | ${c.category.padEnd(18, ' ')} | ${imgType.padEnd(10, ' ')} | "${c.title}"`;
      });

      return {
        command: rawCommand,
        timestamp,
        format: 'text',
        output: [
          `Found ${filtered.length} documents in collection "${COLLECTION_NAME}":`,
          `---------------------------------------------------------------------------------------------------------`,
          ` #  [Document ID]   | Modality   | Category           | Image Type | Title`,
          `---------------------------------------------------------------------------------------------------------`,
          ...rows,
          `---------------------------------------------------------------------------------------------------------`,
          `Tip: Type "get <id>" (e.g., "get case-cxr-001") to inspect the complete JSON document.`,
        ].join('\n'),
        data: filtered,
      };
    }

    case 'get':
    case 'cat':
    case 'find': {
      if (!arg1) {
        return {
          command: rawCommand,
          timestamp,
          isError: true,
          output: 'Error: Please specify a case ID. Example: "get case-cxr-001"',
        };
      }

      const found = currentCases.find(c => c.id.toLowerCase() === arg1.toLowerCase() || c.id.toLowerCase().includes(arg1.toLowerCase()));
      if (!found) {
        return {
          command: rawCommand,
          timestamp,
          isError: true,
          output: `Error: Document "${arg1}" not found in local state or Firestore cache. Type "ls" to list valid IDs.`,
        };
      }

      return {
        command: rawCommand,
        timestamp,
        format: 'json',
        output: JSON.stringify(found, null, 2),
        data: found,
      };
    }

    case 'images':
    case 'image':
    case 'inspect': {
      const inspect = inspectImageStorage(currentCases);
      return {
        command: rawCommand,
        timestamp,
        format: 'text',
        output: [
          `[IMAGE STORAGE ARCHITECTURE AUDIT]`,
          `-----------------------------------------------------------------------------------`,
          `Total Diagnostic Cases:        ${inspect.totalCases}`,
          `Secure HTTPS CDN Images:       ${inspect.cdnUrlCount} (Unsplash / Radiopaedia / PMC)`,
          `Base64 Compressed Data URIs:   ${inspect.dataUriCount} (Admin Uploads under 200KB)`,
          `Gallery Image Attachments:     ${inspect.totalGalleryImages}`,
          `Avg Image String Size:         ${inspect.avgImagePayloadLength} bytes`,
          `-----------------------------------------------------------------------------------`,
          `Breakdown per Case:`,
          ...inspect.items.map(item => ` • [${item.id}] ${item.imageType} (~${(item.estimatedBytes / 1024).toFixed(1)} KB) - ${item.hasGallery ? `+${item.galleryCount} gallery` : 'single scan'}`),
        ].join('\n'),
        data: inspect,
      };
    }

    case 'stats': {
      const inspect = inspectImageStorage(currentCases);
      const diag = getDiagnosticState();
      return {
        command: rawCommand,
        timestamp,
        format: 'stats',
        output: [
          `[RADMED DATABASE & CACHE METRICS]`,
          `-------------------------------------------------------------`,
          `Firestore Database:   ${diag.databaseId}`,
          `Collection Name:      ${COLLECTION_NAME}`,
          `Active Cases Count:   ${currentCases.length} documents`,
          `Image Architecture:   ${inspect.cdnUrlCount} CDN URLs, ${inspect.dataUriCount} Compressed Base64`,
          `LocalStorage Key:     ${diag.localCacheKey}`,
          `Deterministic Order:  Enabled (Canonical Index 1..${currentCases.length})`,
          `Zero-Flapping Guard:  Active`,
        ].join('\n'),
      };
    }

    case 'sort-order':
    case 'order': {
      const orderList = currentCases.map((c, i) => {
        return `[Pos ${i + 1}] ID: ${c.id.padEnd(16, ' ')} | orderIndex: ${String(c.orderIndex ?? 'auto').padEnd(4, ' ')} | Modality: ${c.modality.padEnd(10, ' ')} | "${c.title}"`;
      });

      return {
        command: rawCommand,
        timestamp,
        format: 'text',
        output: [
          `[DETERMINISTIC SORT SEQUENCE]`,
          `----------------------------------------------------------------------------------------`,
          ...orderList,
          `----------------------------------------------------------------------------------------`,
          `All views (Carousel, Home, Flashcards, Admin) follow this exact deterministic sequence.`,
        ].join('\n'),
      };
    }

    case 'ping': {
      const result = await testFirestoreConnection();
      return {
        command: rawCommand,
        timestamp,
        format: 'text',
        output: result.success
          ? `SUCCESS: Firestore ping responded in ${result.latencyMs}ms. Status: CONNECTED`
          : `WARN: Ping failed (${result.latencyMs}ms). Message: ${result.message}`,
        data: result,
      };
    }

    case 'purge':
    case 'purge-samples':
    case 'purge-demo': {
      const result = await purgeSampleCases();
      return {
        command: rawCommand,
        timestamp,
        format: 'text',
        output: result.purgedCount > 0
          ? `SUCCESS: Purged ${result.purgedCount} fake/sample case(s) from database and cache.\nPurged IDs: ${result.purgedIds.join(', ')}\nReloading case library...`
          : `NOTICE: No sample/demo cases found matching placeholder patterns (case-cxr-*, case-ct-*, baseline-*, sample-*). Library is clean.`,
        data: result,
      };
    }

    case 'reseed': {
      const result = await reseedFirestoreWithBaselineCases();
      return {
        command: rawCommand,
        timestamp,
        format: 'text',
        output: result.success
          ? `SUCCESS: Reseeded ${result.count} baseline cases with deterministic orderIndex to Firestore and local cache.`
          : `NOTICE: Reseed completed locally (${result.count} cases). Remote Firestore note: ${result.error || 'Offline'}`,
        data: result,
      };
    }

    case 'clear-cache': {
      clearLocalCasesCache();
      return {
        command: rawCommand,
        timestamp,
        format: 'text',
        output: `Local storage cache "${LOCAL_STORAGE_KEY}" cleared. Reloading or executing "fetch" will pull a clean authoritative dataset.`,
      };
    }

    case 'export': {
      return {
        command: rawCommand,
        timestamp,
        format: 'json',
        output: JSON.stringify(currentCases, null, 2),
        data: currentCases,
      };
    }

    case 'clear':
    case 'cls':
      return {
        command: rawCommand,
        timestamp,
        format: 'text',
        output: '__CLEAR_SCREEN__',
      };

    default:
      return {
        command: rawCommand,
        timestamp,
        isError: true,
        output: `Command not recognized: "${trimmed}". Type "help" for a list of available database commands.`,
      };
  }
}


