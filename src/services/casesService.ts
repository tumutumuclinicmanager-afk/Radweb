import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MedicalCase } from '../types';
import { MEDICAL_CASES } from '../data/casesData';

const COLLECTION_NAME = 'cases';
const LOCAL_STORAGE_KEY = 'radmed_custom_cases_cache';

export async function fetchCases(): Promise<MedicalCase[]> {
  let remoteCases: MedicalCase[] = [];
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
  } catch (error) {
    console.info('Firestore offline or unavailable, loading from local cache / fallback.');
  }

  // Load any locally cached custom cases
  let localCustomCases: MedicalCase[] = [];
  try {
    const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedLocal) {
      localCustomCases = JSON.parse(savedLocal);
    }
  } catch (e) {
    // ignore
  }

  const combinedMap = new Map<string, MedicalCase>();
  // Start with default cases
  for (const c of MEDICAL_CASES) {
    combinedMap.set(c.id, c);
  }
  // Overlay remote cases
  for (const c of remoteCases) {
    combinedMap.set(c.id, c);
  }
  // Overlay local custom cases
  for (const c of localCustomCases) {
    combinedMap.set(c.id, c);
  }

  let finalCases = Array.from(combinedMap.values());

  // If remote was empty and no local custom cases, seed remote if possible
  if (remoteCases.length === 0 && finalCases.length === MEDICAL_CASES.length) {
    try {
      for (const c of MEDICAL_CASES) {
        await setDoc(doc(db, COLLECTION_NAME, c.id), c);
      }
    } catch (e) {
      // ignore seeding error when offline
    }
  }

  return finalCases;
}

export async function addCaseToFirestore(newCase: MedicalCase): Promise<void> {
  // Always update local cache
  try {
    const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    const localCases: MedicalCase[] = savedLocal ? JSON.parse(savedLocal) : [];
    const updated = [newCase, ...localCases.filter(c => c.id !== newCase.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // ignore
  }

  try {
    await setDoc(doc(db, COLLECTION_NAME, newCase.id), newCase);
  } catch (error) {
    console.warn('Firestore offline: Case saved locally.', error);
  }
}

export async function deleteCaseFromFirestore(caseId: string): Promise<void> {
  // Remove from local cache
  try {
    const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedLocal) {
      const localCases: MedicalCase[] = JSON.parse(savedLocal);
      const updated = localCases.filter(c => c.id !== caseId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    // ignore
  }

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, caseId));
  } catch (error) {
    console.warn('Firestore offline: Case removed locally.', error);
  }
}

