import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MedicalCase } from '../types';
import { MEDICAL_CASES } from '../data/casesData';

const COLLECTION_NAME = 'cases';

export async function fetchCases(): Promise<MedicalCase[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const casesMap = new Map<string, MedicalCase>();
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as MedicalCase;
      if (data && data.id) {
        casesMap.set(data.id, data);
      }
    });

    let cases = Array.from(casesMap.values());

    // If no cases in Firestore yet, seed initial MEDICAL_CASES
    if (cases.length === 0) {
      for (const c of MEDICAL_CASES) {
        await setDoc(doc(db, COLLECTION_NAME, c.id), c);
        casesMap.set(c.id, c);
      }
      cases = Array.from(casesMap.values());
    }
    return cases;
  } catch (error) {
    console.error('Error fetching cases from Firestore:', error);
    return MEDICAL_CASES;
  }
}

export async function addCaseToFirestore(newCase: MedicalCase): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTION_NAME, newCase.id), newCase);
  } catch (error) {
    console.error('Error adding case to Firestore:', error);
    throw error;
  }
}

export async function deleteCaseFromFirestore(caseId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, caseId));
  } catch (error) {
    console.error('Error deleting case from Firestore:', error);
    throw error;
  }
}
