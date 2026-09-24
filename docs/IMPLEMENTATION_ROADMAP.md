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
│  PHASE 1: Shared Core, Validation, & Firestore Rules       [PENDING]    │
│  • Shared TypeScript types & interfaces (`shared/types`)               │
│  • Zod runtime schema validators (`shared/validation`)                 │
│  • 6-tier permission evaluation engine (`shared/permissions`)          │
│  • Firestore Rules v2 implementation & unit test suite with Emulator   │
├────────────────────────────────────────────────────────────────────────┤
│  PHASE 2: Plan A — Professional Excel Admin Centre         [PENDING]    │
│  • 16-sheet master workbook (`Pixel_Distributor_Admin.xlsx`)           │
│  • Structured tables, validation dropdowns, named ranges, formulas     │
│  • Bi-directional Node.js Sync Engine CLI (`npm run sync:push/pull`)   │
│  • Staged Bulk Import Templates (Products, Dealers, Inventory, Prices) │
├────────────────────────────────────────────────────────────────────────┤
│  PHASE 3: Plan B — Web Admin Control Centre & Backend API  [PENDING]    │
│  • Cloud Functions / Express API service with Custom Claims            │
│  • Web Admin UI (Dealer Onboarding, Permissions Matrix, Inventory)    │
│  • Stock Transfer Dispatch & Approval Workflow                         │
│  • APK Release Manager & Telemetry Dashboard                           │
├────────────────────────────────────────────────────────────────────────┤
│  PHASE 4: Unified Multi-Tenant Dealer Web / PWA App        [PENDING]    │
│  • Mobile-first responsive UI (Tailwind CSS + Lucide)                  │
│  • Dynamic Tenant Hydration based on Dealer Context & App Config       │
│  • Dynamic Dashboard Cards, Module Routing, & Field Masking            │
│  • Offline caching & Outbox sync queue                                 │
├────────────────────────────────────────────────────────────────────────┤
│  PHASE 5: Android APK & In-App Release Management Engine   [PENDING]    │
│  • Android Capacitor / Native container setup                         │
│  • Native In-App Update Engine & PackageInstaller FileProvider bridge  │
│  • Dedicated `/download` web portal with QR scan & download CTA        │
│  • Mandatory vs Optional update lockdown enforcement                   │
├────────────────────────────────────────────────────────────────────────┤
│  PHASE 6: End-to-End Verification & Production Readiness   [PENDING]    │
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
