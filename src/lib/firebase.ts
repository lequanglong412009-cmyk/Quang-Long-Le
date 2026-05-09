import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test connection
async function testConnection() {
  try {
    // Attempting to read a special path to verify permissions and connection
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection verified.");
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    if (firebaseError?.code === 'permission-denied') {
      console.warn("Firebase connected, but test path denied (expected if rules are strict).");
    } else if (error instanceof Error && error.message?.includes('the client is offline')) {
      console.error("Firebase connection failed: Client is offline.");
    } else {
      console.error("Firebase connection test error:", error);
    }
  }
}
testConnection();
