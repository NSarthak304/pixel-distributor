# Pixel Distributor - APK Distribution & In-App Release Management

## 1. Distribution Strategy & Infrastructure

Pixel Distributor utilizes an enterprise-grade self-hosted distribution infrastructure. This enables rapid deployment of bug fixes, features, and dealer-specific configurations without relying on Google Play Store review delays, while strictly adhering to Android security standards.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      APK RELEASE & DISTRIBUTION FLOW                   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   1. Admin Control Centre              2. Cloud Storage & Firestore    │
│   ┌───────────────────────────┐        ┌───────────────────────────┐   │
│   │ Upload .apk binary        │ ────►  │ gs://releases/app-v1.2.0  │   │
│   │ Specify version & code    │        │ SHA-256 Checksum Computed │   │
│   │ Set Mandatory / Optional  │ ────►  │ Stored in `appReleases`   │   │
│   │ Publish Release           │        └─────────────┬─────────────┘   │
│   └───────────────────────────┘                      │                 │
│                                                      ▼                 │
│   3. Web Download Portal               4. Active Android Devices       │
│   ┌───────────────────────────┐        ┌───────────────────────────┐   │
│   │ Route: /download          │        │ Startup Version Check     │   │
│   │ Responsive Download Card  │        │ Update Prompt / Lockdown  │   │
│   │ QR Code for Mobile Scan   │        │ Safe PackageInstaller     │   │
│   └───────────────────────────┘        └───────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Public Download Portal (`/download`)

The system hosts a lightweight, mobile-responsive web portal at the `/download` route accessible by dealers and onboarding staff.

### Portal User Interface Components
- **Application Header:** Pixel Distributor branding, verified security badge, and Google Play Protect compatibility note.
- **Release Metadata Card:**
  - **Current Version:** e.g., `v1.2.0 (Build 120)`
  - **Release Date:** e.g., `September 24, 2026`
  - **File Size:** e.g., `18.4 MB`
  - **Minimum Android OS:** `Android 7.0 (Nougat, API 24) or higher`
  - **SHA-256 Checksum:** For enterprise integrity verification.
- **Primary CTA:** High-contrast `DOWNLOAD ANDROID APP` button.
- **Onboarding QR Code:** Displays a dynamic QR code enabling warehouse personnel to scan and download directly to handheld Android devices.
- **Installation Walkthrough:** Accordion step-by-step visual guide:
  1. Tap *Download*.
  2. If prompted, allow "Install from this source" in Android Settings.
  3. Open downloaded file and tap *Install*.
  4. Launch Pixel Distributor and sign in.
- **Release Notes Panel:** Formatted markdown changelog detailing new features, fixes, and performance improvements.

---

## 3. In-App Version Verification & Enforcement Engine

Every time the Android application launches or returns to the foreground, the `UpdateService` interrogates Firestore:

```typescript
export interface AppRelease {
  releaseId: string;
  version: string;             // e.g. "1.2.0"
  versionCode: number;         // e.g. 120
  releaseDate: FirebaseFirestore.Timestamp;
  downloadUrl: string;
  checksum: string;            // SHA-256
  fileSize: number;
  releaseNotes: string;
  minimumSupportedVersion: string; // e.g. "1.1.0"
  minimumVersionCode: number;  // e.g. 110
  mandatory: boolean;
  status: 'ACTIVE' | 'DEPRECATED' | 'REVOKED';
}
```

### Version Enforcement Logic
Given the client's current `installedVersionCode`:

```typescript
export function evaluateUpdateRequirement(
  currentVersionCode: number,
  latestActiveRelease: AppRelease
): { required: boolean; mandatory: boolean } {
  // If current version is already up to date
  if (currentVersionCode >= latestActiveRelease.versionCode) {
    return { required: false, mandatory: false };
  }

  // If current version is below the hard minimum, or the release is flagged mandatory
  const isMandatory = 
    currentVersionCode < latestActiveRelease.minimumVersionCode || 
    latestActiveRelease.mandatory === true;

  return {
    required: true,
    mandatory: isMandatory,
  };
}
```

### UX Behavior
- **Mandatory Update (`mandatory: true`):**
  - Renders a full-screen, non-dismissible modal with no close button.
  - Hardware back button is trapped.
  - All background syncing and user operations are halted until the package is updated.
- **Optional Update (`mandatory: false`):**
  - Displays a clean bottom-sheet notification: *"Version 1.2.0 is now available. Would you like to update?"*
  - Provides `[ Remind Me Later ]` and `[ Update Now ]` actions.

---

## 4. Admin APK Release Control Centre

Within the Admin Control Centre (Plan B), the `App Management -> APK Releases` module equips administrators with comprehensive lifecycle controls:

### Administrative Features
1. **Direct Binary Upload:** Drag-and-drop `.apk` file uploader that streams the binary directly to Google Cloud Storage (`gs://pixeldistributor-releases/`) and automatically calculates the SHA-256 checksum and byte size.
2. **Release Configurator Form:**
   - Semantic Version (e.g. `1.3.0`).
   - Version Code (must be strictly greater than the previous active release).
   - Minimum Supported Version Code (determines mandatory cutoff).
   - Release Notes (rich text / markdown editor).
   - Mandatory Checkbox toggle.
3. **Release Status Control:**
   - **Publish:** Immediately activates the release and notifies active clients.
   - **Deactivate / Revoke:** Immediately withdraws a release if a critical defect is identified.
4. **Adoption & Fleet Telemetry Dashboard:**
   - Live bar chart displaying distribution of active devices across version codes (e.g., `85% on v1.2.0`, `12% on v1.1.0`, `3% on older versions`).
   - List of dealers currently running outdated versions with an action button to send a targeted push notification: *"Please update your Pixel Distributor app."*
