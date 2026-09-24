/**
 * Pixel Distributor - Firebase Cloud Functions Triggers
 *
 * Implements server-side Custom Claims synchronization and token lifecycle.
 */

import * as admin from 'firebase-admin';

// Initialize Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Sets cryptographically signed Custom Claims on a user's Firebase Auth token.
 */
export async function syncUserCustomClaims(
  uid: string,
  dealerId: string,
  role: string,
  status: 'ACTIVE' | 'SUSPENDED' | 'INVITED' | 'DEACTIVATED'
): Promise<void> {
  const claims = {
    dealerId,
    role,
    status,
    updatedAt: Date.now(),
  };

  await admin.auth().setCustomUserClaims(uid, claims);

  // If account is suspended, immediately revoke refresh tokens
  if (status === 'SUSPENDED' || status === 'DEACTIVATED') {
    await admin.auth().revokeRefreshTokens(uid);
  }
}

/**
 * Cloud Function simulation hook for Firestore user document changes.
 */
export async function handleUserDocumentChange(
  change: { before: { status?: string }; after: { dealerId: string; role: string; status: 'ACTIVE' | 'SUSPENDED' | 'INVITED' | 'DEACTIVATED' } },
  userId: string
): Promise<void> {
  const afterData = change.after;
  await syncUserCustomClaims(userId, afterData.dealerId, afterData.role, afterData.status);
}
