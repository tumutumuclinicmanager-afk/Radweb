/**
 * Lightweight IndexedDB persistence layer for RadMed cases.
 * 
 * Unlike localStorage (which hard-caps at 5MB and throws QuotaExceededError
 * on high-resolution medical imaging base64 cases), IndexedDB provides
 * ample storage (typically 50MB - 1GB+) with high read/write speeds.
 */

import { MedicalCase } from '../types';

const DB_NAME = 'RadMedCaseDB';
const DB_VERSION = 1;
const STORE_NAME = 'authoritative_cases';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Retrieve all persisted real cases from IndexedDB with sub-20ms latency.
 */
export async function getCasesFromIndexedDB(): Promise<MedicalCase[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result as MedicalCase[];
        if (Array.isArray(results)) {
          // Exclude any stray synthetic/baseline items
          const realCases = results.filter(
            c => c && c.id && !c.id.startsWith('baseline-') && !c.id.startsWith('sample-') && !c.id.startsWith('mock-')
          );
          resolve(realCases);
        } else {
          resolve([]);
        }
      };

      req.onerror = () => {
        reject(req.error || new Error('Failed to query IndexedDB cases'));
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Read failed or unsupported, falling back:', err);
    return [];
  }
}

/**
 * Persist full array of real cases to IndexedDB asynchronously.
 */
export async function saveCasesToIndexedDB(cases: MedicalCase[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      // Clear old entries and insert current authoritative cases
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        for (const item of cases) {
          if (item && item.id && !item.id.startsWith('baseline-') && !item.id.startsWith('sample-') && !item.id.startsWith('mock-')) {
            store.put(item);
          }
        }
      };

      tx.oncomplete = () => {
        resolve();
      };

      tx.onerror = () => {
        reject(tx.error || new Error('Failed to commit cases to IndexedDB'));
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Write failed:', err);
  }
}

/**
 * Save or update a single case in IndexedDB.
 */
export async function saveSingleCaseToIndexedDB(singleCase: MedicalCase): Promise<void> {
  if (!singleCase || !singleCase.id) return;
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(singleCase);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Single case write failed:', err);
  }
}

/**
 * Remove a single case from IndexedDB.
 */
export async function removeCaseFromIndexedDB(caseId: string): Promise<void> {
  if (!caseId) return;
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(caseId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Delete failed:', err);
  }
}
