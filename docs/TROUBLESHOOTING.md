# Pixel Distributor - Troubleshooting & Runbook

## 1. Multi-Tenancy & Permission Discrepancies

### Issue 1.1: Dealer Sees "Permission Denied" After Admin Updates Capabilities
- **Symptom:** Central Admin updated Dealer B's capabilities in the Admin Control Centre, but Dealer B's mobile app still displays "Access Denied" or fails Firestore reads.
- **Root Cause:** Firebase Auth ID Tokens are cryptographically cached on client devices for up to 60 minutes. Custom Claims embedded in the JWT token do not update until the token is refreshed.
- **Remediation:**
  1. The client app should listen to `userPermissions/{dealerId}_{userId}` in real-time.
  2. When the snapshot fires indicating a permission change, the app executes:
     ```typescript
     await auth.currentUser?.getIdToken(true); // Force refresh token
     ```
  3. Alternatively, have the user tap *Refresh Session* in Profile settings.

### Issue 1.2: Potential Cross-Dealer Data Leak Warning
- **Symptom:** A developer queries `collection('orders')` without specifying `where('dealerId', '==', userDealerId)`.
- **Behavior:** Firestore Security Rules reject the entire query with `permission-denied` (Rules are not filters).
- **Remediation:**
  Always prepend the tenant scope filter in all Firestore client queries:
  ```typescript
  query(collection(db, 'orders'), where('dealerId', '==', currentDealerId));
  ```

---

## 2. Windows Environment & Local Tooling

### Issue 2.1: PowerShell Error: `File npm.ps1 cannot be loaded because running scripts is disabled`
- **Root Cause:** Default Windows PowerShell `ExecutionPolicy` is set to `Restricted`.
- **Solution:**
  - Option A: Execute commands via `cmd.exe /c "npm ..."` or run `npm.cmd`.
  - Option B: Adjust execution policy for the current user process:
    ```powershell
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
    ```

### Issue 2.2: Missing Java / Android SDK during APK Build
- **Symptom:** Gradle build fails with `JAVA_HOME is not set` or `sdk.dir missing`.
- **Remediation:**
  1. Install OpenJDK 17 (e.g. Eclipse Temurin or Microsoft OpenJDK).
  2. Set `JAVA_HOME` environment variable to `C:\Program Files\Eclipse Adoptium\jdk-17...`.
  3. Install Android Studio command line tools or set `ANDROID_HOME` to `C:\Users\<user>\AppData\Local\Android\Sdk`.

---

## 3. In-App APK Updates & Android Package Installer

### Issue 3.1: Android Displays "App Not Installed" or Parse Error
- **Root Cause:**
  1. Signature mismatch: The installed version was signed with a debug keystore, but the update APK was signed with a release keystore.
  2. Corrupted binary download or invalid FileProvider authorities in `AndroidManifest.xml`.
- **Remediation:**
  - Verify FileProvider setup in `AndroidManifest.xml`:
    ```xml
    <provider
        android:name="androidx.core.content.FileProvider"
        android:authorities="${applicationId}.fileprovider"
        android:exported="false"
        android:grantUriPermissions="true">
        <meta-data
            android:name="android.support.FILE_PROVIDER_PATHS"
            android:resource="@xml/file_paths" />
    </provider>
    ```
  - Ensure the SHA-256 hash of the downloaded file strictly matches `appReleases.checksum`.

---

## 4. Excel Bi-Directional Synchronization (Plan A)

### Issue 4.1: Sync CLI Fails with "Duplicate Key in Named Range"
- **Symptom:** `npm run sync:push` errors on `tbl_Dealers` or `tbl_Products`.
- **Root Cause:** A human administrator entered an existing `Dealer_ID` or `SKU` into the Excel sheet.
- **Remediation:**
  1. Open `Pixel_Distributor_Admin.xlsx`.
  2. Navigate to column `[SKU]` in `PRODUCT_MASTER` and filter by conditional formatting duplicates.
  3. Re-execute `npm run sync:push`.

---

## 5. Firestore Index Creation Errors

### Issue 5.1: Console Warns `The query requires an index`
- **Symptom:** A multi-field query fails with an error URL pointing to the Firebase Console.
- **Remediation:**
  1. Check `firebase/firestore.indexes.json`.
  2. Add the required compound query index (as defined in `DATABASE_SCHEMA.md`).
  3. Deploy indexes:
     ```bash
     npx firebase-tools deploy --only firestore:indexes
     ```
