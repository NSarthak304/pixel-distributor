/**
 * Pixel Distributor - Firebase Production Client SDK
 *
 * Provides real-time synchronization with Cloud Firestore,
 * Firebase Storage for APKs/invoices, and Phone OTP Authentication.
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
  setDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// 1. Safe Configuration Loading from Vite Environment
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

// 2. Singleton Initialization
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured()) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };

// 3. Real-Time Cloud Firestore Sync Helpers
export const syncFirestoreCollection = <T>(
  collectionName: string,
  onData: (data: T[]) => void,
  onError?: (err: Error) => void
) => {
  if (!db) return () => {};

  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const results: T[] = [];
      snapshot.forEach((docSnap) => {
        results.push({ ...docSnap.data(), id: docSnap.id } as unknown as T);
      });
      onData(results);
    },
    (err) => {
      console.warn(`Firestore sync warning for ${collectionName}:`, err);
      if (onError) onError(err);
    }
  );
};

// 4. Phone OTP Authentication Helper
export class PhoneAuthService {
  private static recaptchaVerifier: RecaptchaVerifier | null = null;

  public static initRecaptcha(containerId: string): RecaptchaVerifier | null {
    if (!auth) return null;
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
    }
    this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved - allow signInWithPhoneNumber
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired. Resetting...');
      },
    });
    return this.recaptchaVerifier;
  }

  public static async sendOtp(
    phoneNumber: string,
    verifier: RecaptchaVerifier
  ): Promise<ConfirmationResult> {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please connect your Firebase project.');
    }
    return await signInWithPhoneNumber(auth, phoneNumber, verifier);
  }

  public static async verifyOtp(
    confirmationResult: ConfirmationResult,
    verificationCode: string
  ): Promise<FirebaseUser> {
    const credential = await confirmationResult.confirm(verificationCode);
    return credential.user;
  }

  public static async logout(): Promise<void> {
    if (auth) {
      await signOut(auth);
    }
  }
}
