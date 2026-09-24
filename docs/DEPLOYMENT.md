# Pixel Distributor - Deployment & DevOps Manual

## 1. Hosting & Infrastructure Architecture

Pixel Distributor leverages **Google Cloud Platform (GCP)** and **Firebase Enterprise Infrastructure** for high availability, global low-latency CDN edge caching, and serverless scalability.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      PIXEL DISTRIBUTOR DEPLOYMENT TOPOLOGY             │
├───────────────────────────────────┬────────────────────────────────────┤
│ Service Component                 │ Infrastructure Provider / Runtime  │
├───────────────────────────────────┼────────────────────────────────────┤
│ Admin Web Control Centre          │ Firebase Hosting (Custom Domain)   │
│ Dealer Web / PWA Portal           │ Firebase Hosting (Edge CDN Cached) │
│ Backend APIs & Microservices      │ Cloud Functions 2nd Gen (Node 22)  │
│ Central Realtime Database         │ Google Cloud Firestore (Multi-Reg) │
│ Binary & Media Storage            │ Google Cloud Storage Standard      │
│ Android App Distribution          │ Signed APKs in Cloud Storage       │
│ Authentication & Security         │ Firebase Auth + Play Integrity     │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 2. Firebase Configuration (`firebase.json`)

```json
{
  "firestore": {
    "rules": "firebase/firestore.rules",
    "indexes": "firebase/firestore.indexes.json"
  },
  "functions": [
    {
      "source": "backend",
      "codebase": "default",
      "ignore": ["node_modules", ".git", "firebase-debug.log", "firestore-debug.log"]
    }
  ],
  "hosting": [
    {
      "target": "admin",
      "public": "apps/admin/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    },
    {
      "target": "dealer",
      "public": "apps/dealer-web/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  ],
  "storage": {
    "rules": "firebase/storage.rules"
  },
  "emulators": {
    "auth": { "port": 9099 },
    "functions": { "port": 5001 },
    "firestore": { "port": 8080 },
    "hosting": { "port": 5000 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

---

## 3. Environment Variables & Secret Management

Every app and service utilizes scoped `.env` configuration files. Keys containing secrets (`SERVICE_ACCOUNT_KEY`, `JWT_SECRET`) are never placed in `.env` files committed to Git.

### 3.1 Backend & Cloud Functions (`backend/.env`)
```bash
NODE_ENV=production
GCP_PROJECT_ID=pixel-distributor-prod
STORAGE_BUCKET_NAME=pixel-distributor-prod.appspot.com
RELEASES_BUCKET_NAME=pixel-distributor-releases
CORS_ORIGIN=https://admin.pixeldistributor.com,https://app.pixeldistributor.com
```

### 3.2 Frontend Applications (`apps/admin/.env` & `apps/dealer-web/.env`)
```bash
VITE_FIREBASE_API_KEY=AIzaSyAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=pixel-distributor-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pixel-distributor-prod
VITE_FIREBASE_STORAGE_BUCKET=pixel-distributor-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=109283746501
VITE_FIREBASE_APP_ID=1:109283746501:web:xxxxxxxxxxxxxxxx
VITE_API_BASE_URL=https://api.pixeldistributor.com/v1
```

---

## 4. Local Development with Firebase Emulator Suite

To ensure rapid local development and zero-cost test execution:

```bash
# 1. Start all Firebase emulators (Auth, Firestore, Storage, Functions, UI)
npx firebase-tools emulators:start --only auth,firestore,storage,functions

# 2. Access the Firebase Emulator Suite GUI
# Open http://localhost:4000
```

---

## 5. Android APK Build & Release Pipeline

Prerequisites on the build server or local machine:
- OpenJDK 17 or 21 (`java -version`)
- Android SDK Build Tools 34 (`apksigner`, `zipalign`)

### Build Steps:
```bash
# 1. Build mobile-first web bundle
npm run build --workspace=apps/dealer-web

# 2. Sync with Android project
npx cap sync android

# 3. Compile release APK using Gradle Wrapper
cd apps/android
./gradlew assembleRelease

# 4. Sign APK with Enterprise Keystore
zipalign -v -p 4 app/build/outputs/apk/release/app-release-unsigned.apk app-aligned.apk
apksigner sign --ks pixel-release-key.jks --out pixel-distributor-v1.2.0.apk app-aligned.apk

# 5. Verify Signature
apksigner verify pixel-distributor-v1.2.0.apk
```
