/**
 * Pixel Distributor - Dealer Chameleon App Firebase Client SDK
 *
 * Real-time Firestore document listeners for dealer catalog,
 * inventory balance, personal orders, and Phone OTP auth.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User as FirebaseUser,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  addDoc,
  Timestamp,
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    !firebaseConfig.apiKey.includes('YOUR_') &&
    !firebaseConfig.projectId.includes('YOUR_')
  );
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };

// Dealer specific real-time listeners
export const subscribeDealerOrders = (
  dealerId: string,
  onData: (orders: any[]) => void
) => {
  if (!db) return () => {};
  const q = query(collection(db, 'orders'), where('dealerId', '==', dealerId));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((d) => list.push({ ...d.data(), id: d.id }));
    onData(list);
  });
};

export const subscribeDealerInventory = (
  dealerId: string,
  onData: (items: any[]) => void
) => {
  if (!db) return () => {};
  const q = query(collection(db, 'inventory'), where('locationId', '==', dealerId));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((d) => list.push({ ...d.data(), id: d.id }));
    onData(list);
  });
};

export class DealerPhoneAuth {
  private static verifier: RecaptchaVerifier | null = null;

  public static initRecaptcha(containerId: string): RecaptchaVerifier | null {
    if (!auth) return null;
    if (this.verifier) {
      this.verifier.clear();
    }
    this.verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
    });
    return this.verifier;
  }

  public static async sendOtp(phone: string, verifier: RecaptchaVerifier): Promise<ConfirmationResult> {
    if (!auth) throw new Error('Firebase Auth not initialized.');
    return await signInWithPhoneNumber(auth, phone, verifier);
  }

  public static async verifyOtp(conf: ConfirmationResult, code: string): Promise<FirebaseUser> {
    const res = await conf.confirm(code);
    return res.user;
  }

  public static async logout(): Promise<void> {
    if (auth) await signOut(auth);
  }
}
