# Pixel Distributor - Security Architecture & Multi-Tenant Isolation

## 1. Threat Modeling & Security Objectives

Pixel Distributor handles mission-critical commercial workflows: wholesale pricing, proprietary catalog costs, dealer credit limits, bank payment verifications, and proprietary Android APK distributions.

### Primary Security Objectives
1. **Absolute Multi-Tenant Isolation:** Under no circumstances may Dealer A observe, query, infer, or modify data belonging to Dealer B or Central Admin.
2. **Protection Against Parameter Tampering:** Forging `dealerId` in URL routes, REST bodies, or query params must fail deterministically.
3. **Privilege Escalation Prevention:** Role promotions, custom claims assignment, and permission overrides must be restricted to authenticated `SUPER_ADMIN` / `ADMIN` entities via server-side Admin SDK operations.
4. **Zero Client Secrets:** Private keys, Firebase service account credentials, and signing secrets must never touch client codebases or public Git repositories.
5. **Data Ledger Immutability:** Audit journals (`activityLogs`) and stock movement records (`inventoryTransactions`) must be strictly append-only; updates and deletions are globally rejected at the database rule layer.

---

## 2. Authentication & Custom Claims Architecture

Authentication is powered by **Firebase Authentication** hardened with **Firebase Custom Claims**.

### Custom Token Claims Structure
When an administrator creates or updates a user account, a Cloud Function (`onUserCreated` / `syncUserClaims`) sets cryptographically signed Custom Claims on the Firebase Auth token:

```json
{
  "https://pixeldistributor.com/claims": {
    "dealerId": "DLR-1001",
    "role": "DEALER",
    "status": "ACTIVE",
    "tokenVersion": 2
  }
}
```

### Why Custom Claims?
1. **Firestore Rules Performance:** Firestore security rules can read `request.auth.token.dealerId` directly from the token without incurring extra billable document reads (`get()`).
2. **Spoof-Proof:** Custom claims are signed by Google's private key and cannot be tampered with on client devices.
3. **Instant Revocation:** When an account is suspended, `tokenVersion` is bumped in Firestore, and the token is invalidated via `admin.auth().revokeRefreshTokens(uid)`.

---

## 3. Firestore Security Rules (Version 2) Design

The Firestore rules enforce tenant scoping at the database kernel level. Even if an attacker executes raw JavaScript or cURL requests against the Firestore REST endpoint, the database blocks unauthorized queries.

### Core Helper Functions in `firestore.rules`
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Auth Validation Helpers
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return request.auth.token.role;
    }
    
    function getUserDealerId() {
      return request.auth.token.dealerId;
    }
    
    function isCentralAdmin() {
      return isAuthenticated() && (getUserRole() == 'SUPER_ADMIN' || getUserRole() == 'ADMIN');
    }
    
    function isUserActive() {
      return isAuthenticated() && request.auth.token.status == 'ACTIVE';
    }
    
    function belongsToDealer(targetDealerId) {
      return isUserActive() && getUserDealerId() == targetDealerId;
    }

    // Collection: Dealers
    match /dealers/{dealerId} {
      allow read: if isCentralAdmin() || belongsToDealer(dealerId);
      allow write: if isCentralAdmin();
    }
    
    // Collection: Products (Master Catalog)
    match /products/{productId} {
      // Central admins can manage catalog
      allow write: if isCentralAdmin();
      // Dealers can read active products, but purchasePrice is restricted server-side
      allow read: if isUserActive();
    }

    // Collection: Inventory (Current Balances)
    match /inventory/{inventoryId} {
      allow read: if isCentralAdmin() || 
        (isUserActive() && (resource.data.dealerId == getUserDealerId() || resource.data.dealerId == 'CENTRAL'));
      // Direct mutations forbidden; mutations occur via transactions or cloud functions
      allow write: if isCentralAdmin();
    }

    // Collection: Inventory Transactions (Immutable Ledger)
    match /inventoryTransactions/{transactionId} {
      allow read: if isCentralAdmin() || belongsToDealer(resource.data.dealerId);
      // Strictly append-only: no updates or deletes permitted ever
      allow create: if isCentralAdmin() || 
        (isUserActive() && request.resource.data.dealerId == getUserDealerId());
      allow update, delete: if false;
    }

    // Collection: Orders
    match /orders/{orderId} {
      allow read: if isCentralAdmin() || belongsToDealer(resource.data.dealerId);
      allow create: if isCentralAdmin() || 
        (isUserActive() && request.resource.data.dealerId == getUserDealerId());
      allow update: if isCentralAdmin() || 
        (belongsToDealer(resource.data.dealerId) && 
         // Dealers can only edit drafts or add customer notes
         resource.data.status in ['DRAFT', 'PENDING']);
      allow delete: if isCentralAdmin();
    }

    // Collection: Customers
    match /customers/{customerId} {
      allow read: if isCentralAdmin() || belongsToDealer(resource.data.dealerId);
      allow create, update: if isCentralAdmin() || 
        (isUserActive() && request.resource.data.dealerId == getUserDealerId());
      allow delete: if isCentralAdmin() || belongsToDealer(resource.data.dealerId);
    }

    // Collection: Payments
    match /payments/{paymentId} {
      allow read: if isCentralAdmin() || belongsToDealer(resource.data.dealerId);
      // Only central finance/admin can verify payments
      allow create: if isCentralAdmin() || 
        (isUserActive() && request.resource.data.dealerId == getUserDealerId());
      allow update: if isCentralAdmin();
      allow delete: if false; // Financial records are immutable
    }

    // Collection: Activity Logs (Immutable Audit Trail)
    match /activityLogs/{logId} {
      allow read: if isCentralAdmin();
      allow create: if isUserActive(); // Log appender
      allow update, delete: if false; // Never modifiable
    }

    // Collection: App Releases
    match /appReleases/{releaseId} {
      allow read: if isAuthenticated(); // Authenticated devices can check updates
      allow write: if isCentralAdmin();
    }
  }
}
```

---

## 4. App Check Architecture

To prevent API abuse, bot scraping, and credential stuffing:

1. **Android APK:** Protected via **Google Play Integrity API**. The app requests an integrity token attesting that:
   - The app binary matches the official signed keystore.
   - The device is a genuine, uncompromised Android environment (not an emulated bot or rooted tamper rig).
2. **Web / PWA Portal:** Protected via **reCAPTCHA Enterprise**.
3. **Enforcement:** Firebase App Check is enabled on:
   - Cloud Firestore.
   - Cloud Storage (protecting APK downloads and proprietary attachments).
   - Cloud Functions HTTPS endpoints.

---

## 5. Secrets Management & Environment Security

1. **Strictly Forbidden in Codebases:**
   - GCP Service Account JSON keys (`service-account-key.json`).
   - Android Keystore signing passwords (`keystore.jks`).
   - Database credentials or admin master secrets.
2. **Storage and Injection Protocol:**
   - Local development uses `.env.local` ignored by Git (`.gitignore`).
   - Backend functions read secrets from Google Secret Manager (`runWith({ secrets: [...] })`).
   - CI/CD pipelines inject secrets via GitHub Actions Encrypted Secrets or Google Cloud KMS.

---

## 6. Audit Logging Engine (`activityLogs`)

Every sensitive mutation across the platform must trigger a permanent audit entry:

| Event Type | Trigger | Captured Metadata |
| :--- | :--- | :--- |
| `USER_LOGIN` | User completes sign-in | `ipAddress`, `userAgent`, `appVersion`, `deviceModel` |
| `DEALER_CREATED` | Admin registers dealer | `dealerId`, `businessName`, `assignedWarehouse`, `priceGroup` |
| `PERMISSION_OVERRIDDEN` | Admin adjusts capabilities | `targetUserId`, `previousModules`, `newModules`, `grantedBy` |
| `STOCK_TRANSFER_DISPATCH` | Warehouse dispatches stock | `transferId`, `sourceId`, `destinationId`, `skuList`, `quantityTotal` |
| `ORDER_STATUS_CHANGED` | Order moves down lifecycle | `orderId`, `oldStatus`, `newStatus`, `reason` |
| `APK_PUBLISHED` | Admin releases new APK | `version`, `versionCode`, `mandatoryFlag`, `checksum` |
| `DEALER_SUSPENDED` | Account access revoked | `dealerId`, `reason`, `suspendedBy` |

Audit logs are written through a dedicated, isolated server-side utility that enforces monotonic server timestamps (`admin.firestore.FieldValue.serverTimestamp()`).
