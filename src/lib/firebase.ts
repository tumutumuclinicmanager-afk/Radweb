import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Silence expected verbose/benign Firestore SDK logs to keep development console clean
try {
  setLogLevel('error');
} catch (e) {
  console.info("Could not set Firestore log level:", e);
}

// Validate connection on boot quietly
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    // Firestore operating in offline mode or connection unavailable
    console.info("Firestore operating in offline mode or awaiting network connection.");
  }
}
testConnection();

