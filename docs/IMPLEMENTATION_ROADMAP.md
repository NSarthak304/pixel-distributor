# Pixel Distributor - Implementation Roadmap & Phased Execution Plan

## 1. Governance & Execution Principles

To guarantee architectural integrity, stability, and zero regressions:

1. **Phased Milestones:** The application will be engineered sequentially across **6 distinct phases**.
2. **Quality Gating:** Under no circumstances will a phase be deemed complete until:
   - All unit and rules tests pass with 100% green status.
   - TypeScript compiler checks report zero errors.
   - Code formatting passes linting standards.
   - Key functional flows are verified and documented.
3. **Current Gating Checkpoint:** 
   > [!IMPORTANT]
   > We are currently concluding **Phase 0 (Architecture & Planning)**. Production code implementation will NOT begin until the Lead Stakeholder reviews and approves this architecture package.

---

## 2. Phased Milestone Breakdown

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PIXEL DISTRIBUTOR IMPLEMENTATION ROADMAP             │
├────────────────────────────────────────────────────────────────────────┤
│  PHASE 0: Architecture & Systems Planning                 [COMPLETED]  │
│  • Toolchain & Environment Audit                                       │
│  • Full Technical Specification & Data Schema Documents                │
│  • Folder Scaffolding & Git Baseline                                   │
├────────────────────────────────────────────────────────────────────────┤
│  PHASE 1: Shared Core, Validation, & Firestore Rules       [COMPLETED]  │
│  • Shared TypeScript types & interfaces (`shared/types`)               │
│  • Zod runtime schema validators (`shared/validation`)                 │
│  • 6-tier permission evaluation engine (`shared/permissions`)          │
│  • Firestore Rules v2 implementation & 21 unit tests passing           │
├────────────────────────────────────────────────────────────────────────┤
│  PHASE 2: Plan A & Plan B — Staged Excel ETL & Templates   [COMPLETED]  │
│  • 16-sheet master workbook (`Pixel_Distributor_Admin.xlsx`)           │
│  • 4 Bulk Import Templates (Products, Dealers, Inventory, Prices)      │
│  • Bi-directional Node.js Sync Engine CLI (`npm run sync:push/pull`)   │
│  • 5-Stage Staged Import Pipeline (Upload->Validate->Preview->Commit)  │
├────────────────────────────────────────────────────────────────────────┤
│  PHASE 3: Plan B — Web Admin Backend API & Services        [COMPLETED]  │
│  • Express REST API service with 18 endpoints                          │
│  • Dealer Onboarding, Permissions Matrix, Inventory movements          │
│  • Stock Transfer Dispatch & Delivery Workflow                         │
│  • APK Release Manager & Telemetry API                                 │
├────────────────────────────────────────────────────────────────────────┤
│  PHASE 4: Admin Web Control Centre Application             [COMPLETED]  │
│  • Full responsive Web Control Centre (`apps/admin`) built with Vite   │
│  • Dashboard, Dealers, 6-Tier Permission Matrix, Inventory, Releases   │
├────────────────────────────────────────────────────────────────────────┤
│  PHASE 5: Unified Multi-Tenant Dealer Web / PWA & Download [COMPLETED]  │
│  • Mobile-first responsive UI (`apps/dealer-web`) built with Vite      │
│  • Dynamic Tenant Hydration for Dealer A, Dealer B, and Dealer C       │
│  • Dedicated `/download` portal with QR code & APK download CTA        │
│  • Offline caching & simulated in-app mandatory update blocker         │
├────────────────────────────────────────────────────────────────────────┤
│  PHASE 6: Android APK Container & E2E Security Audit       [COMPLETED]  │
│  • Capacitor Android container setup with FileProvider & permissions   │
│  • Native Kotlin UpdatePluginBridge with SHA-256 checksum verifier     │
│  • 50 Unit & Integration Tests Passing (100% Green Status)             │
│  • Complete scenario testing (Dealer A, B, and C access isolation)     │
│  • Transaction-based stock consistency load test                       │
│  • Security audit & penetration check (ID tampering attempts)          │
│  • Final production deployment & runbook sign-off                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Phase Deliverables & Verification Criteria

### Phase 1: Shared Core, Validation, & Firestore Rules
- **Deliverables:**
  - `shared/types/index.ts`: Strongly typed models for all 20 Firestore collections.
  - `shared/validation/index.ts`: Zod schemas for all inbound payloads, orders, transfers, and dealer profiles.
  - `shared/permissions/index.ts`: Pure capability evaluator functions.
  - `firebase/firestore.rules`: Rules Version 2 enforcing multi-tenant boundaries.
  - `tests/rules/multi-tenant.test.ts`: Automated rules test suite run against `@firebase/rules-unit-testing`.
- **Gating Criteria:**
  - 100% of Firestore security rule unit tests pass in the local Firebase emulator.
  - Cross-dealer reads and writes are proven to fail with `permission-denied`.

### Phase 2: Plan A — Professional Excel Admin Centre
- **Deliverables:**
  - `excel/templates/Pixel_Distributor_Admin.xlsx`: Pre-configured 16-worksheet workbook with tables, formulas, conditional formatting, and named ranges.
  - `scripts/excel-sync.ts`: Node.js CLI tool supporting `push` (Excel -> Firestore) and `pull` (Firestore -> Excel).
  - Four standalone bulk import templates (`Products.xlsx`, `Dealers.xlsx`, `Inventory.xlsx`, `PriceList.xlsx`).
- **Gating Criteria:**
  - Adding a dealer in Excel and running `npm run sync:push` creates the exact corresponding Firestore records, user permissions, and app configurations.
  - Modifying inventory produces immutable `inventoryTransactions`.

### Phase 3: Plan B — Web Admin Control Centre & Backend API
- **Deliverables:**
  - `backend/`: Cloud Functions implementing REST endpoints, auth triggers (`onUserCreated`), and custom claims sync.
  - `apps/admin/`: Modern web dashboard supporting:
    - Dashboard with live revenue, order, and dealer metrics.
    - Add Dealer modal with automatic ID and credentials generation.
    - Interactive 6-tier Permission Matrix editor for any dealer.
    - Product Master, Central Inventory, and Stock Transfer approval.
    - APK Release Manager (upload, versioning, mandatory toggle).
- **Gating Criteria:**
  - Creating a dealer automatically triggers credentials generation and populates initial config.
  - Editing permissions immediately reflects in Firestore.

### Phase 4: Unified Multi-Tenant Dealer Web / PWA App
- **Deliverables:**
  - `apps/dealer-web/`: High-performance mobile-first PWA.
  - Dynamic module drawer showing only permitted sections.
  - Configurable dashboard cards showing only admin-enabled widgets.
  - Price masking (hiding purchase price always; toggling MRP and dealer price).
  - Transaction-based order creation and status tracker.
  - Offline cache with amber status indicator.
- **Gating Criteria:**
  - Logging in as Dealer A renders inventory editing and orders.
  - Logging in as Dealer B renders only orders and inventory viewing; customers/payments/reports are absent.
  - Changing URLs or query parameters manually results in 404/403.

### Phase 5: Android APK & In-App Release Management Engine
- **Deliverables:**
  - `apps/android/`: Unified Android application with native plugins.
  - Version checker hook querying `appReleases`.
  - Non-silent download and Android `PackageInstaller` / `ACTION_VIEW` intent launcher.
  - Web `/download` portal with release notes, checksums, and QR code.
- **Gating Criteria:**
  - When admin publishes a release marked `mandatory: true`, the app shows an un-dismissible blocking modal.
  - Downloading APK verifies checksum and launches Android system installer.

### Phase 6: End-to-End Verification & Production Readiness
- **Deliverables:**
  - Full automated regression test run.
  - Verification report verifying Dealer A, B, and C real-time scenarios.
  - Final deployment to Firebase Hosting and Cloud Functions.
- **Gating Criteria:**
  - Lead Architect sign-off on zero data leakage and transaction accuracy.
