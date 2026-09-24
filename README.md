# Pixel Distributor - Centralized Multi-Tenant Distribution Management Platform

[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20PWA%20%7C%20Android-blue)](#)
[![Architecture](https://img.shields.io/badge/Architecture-Multi--Tenant%20%28Single%20Codebase%29-green)](#)
[![Backend](https://img.shields.io/badge/Backend-Firebase%20%7C%20Cloud%20Functions-orange)](#)
[![Database](https://img.shields.io/badge/Database-Cloud%20Firestore%20v2%20Rules-red)](#)

---

## 1. Executive Summary

**Pixel Distributor** is an enterprise-grade, centralized distribution management system engineered to manage dealer networks, multi-warehouse and dealer-level transaction-based inventory, orders, financial settlements, customer data, and mobile application distribution.

### Core Architectural Principle: Single Multi-Tenant Codebase
> [!IMPORTANT]
> **We DO NOT build or maintain separate application codebases for different dealers.**
> The entire ecosystem runs on **ONE unified multi-tenant codebase**. Each dealer possesses isolated tenant records, role profiles, feature configuration flags, and data scopes. Both the **Web/PWA** and **Android APK** dynamically configure their navigation, interfaces, dashboard cards, price visibilities, and data access based on the authenticated user's permissions and dealer boundary.

---

## 2. Workspace & Toolchain Assessment

A comprehensive audit of the local development environment (`PIXEL-DISTRIBUTOR`) was performed:

| Tool | Status | Version / Path | Remediation / Recommendation |
| :--- | :---: | :--- | :--- |
| **Node.js** | Detected | `v22.23.2` (`C:\Users\naren\AppData\Local\hermes\node\node.exe`) | Supported modern LTS runtime. |
| **npm** | Detected | `10.9.8` (`npm.cmd`) | Supported. Use `npm.cmd` on Windows or bypass PowerShell script policy. |
| **Python** | Detected | `3.11.15` (`venv\Scripts\python.exe`) | Available for data migration/Excel validation scripting if needed. |
| **Git** | Detected | `2.54.0.windows.1` | Initialized repository, primary branch set to `main`. |
| **Firebase CLI** | Detected | `15.31.0` (accessible via `npx -y firebase-tools`) | Ready for local Firebase Emulator Suite and deployments. |
| **Java / JDK** | Missing | Not detected in system `PATH` | **Required for Android APK building:** Install JDK 17 or 21 (Temurin / Zulu). |
| **Android SDK / adb** | Missing | Not detected in system `PATH` | **Required for Android APK building:** Install Android SDK command-line tools or Android Studio. |

---

## 3. Two Implementation Alternatives

To cater to varying administrative operational preferences, the system specifies two distinct implementation alternatives without premature coupling:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PLAN A: EXCEL-CENTRIC HYBRID                    │
│                                                                        │
│   ┌──────────────────────┐         ┌───────────────────────────────┐   │
│   │  Excel Admin Centre  │ ◄─────► │   Sync Engine / Firebase CLI   │   │
│   │  (16 Master Sheets)  │         │   (Validation & ETL Bridge)   │   │
│   └──────────────────────┘         └───────────────┬───────────────┘   │
│                                                    │                   │
│                                                    ▼                   │
│                                      ┌───────────────────────────┐     │
│                                      │  Central Cloud Firestore  │     │
│                                      └─────────────┬─────────────┘     │
│                                                    │                   │
│                                    ┌───────────────┴───────────────┐   │
│                                    ▼                               ▼   │
│                             ┌─────────────┐                 ┌─────────┐│
│                             │ Dealer Web  │                 │ Android ││
│                             │ / PWA App   │                 │   APK   ││
│                             └─────────────┘                 └─────────┘│
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                        PLAN B: FULL WEB PLATFORM                       │
│                                                                        │
│   ┌──────────────────────┐         ┌───────────────────────────────┐   │
│   │ Admin Web Control Ctr│ ◄─────► │ Secure Backend API / Cloud Fn │   │
│   │ (Modern Web App)     │         │ (RBAC, Audit Logs, Business)  │   │
│   └──────────────────────┘         └───────────────┬───────────────┘   │
│                                                    │                   │
│                                                    ▼                   │
│                                      ┌───────────────────────────┐     │
│                                      │  Central Cloud Firestore  │     │
│                                      └─────────────┬─────────────┘     │
│                                                    │                   │
│                                    ┌───────────────┴───────────────┐   │
│                                    ▼                               ▼   │
│                             ┌─────────────┐                 ┌─────────┐│
│                             │ Dealer Web  │                 │ Android ││
│                             │ / PWA App   │                 │   APK   ││
│                             └─────────────┘                 └─────────┘│
│                                    ▲                                   │
│                                    │ (Bulk Import / Export Only)       │
│                                    ▼                                   │
│                        ┌──────────────────────┐                        │
│                        │ Excel Import/Export  │                        │
│                        │ (Staged Validation)  │                        │
│                        └──────────────────────┘                        │
└────────────────────────────────────────────────────────────────────────┘
```

- **Plan A (Excel-Centric Hybrid):** Excel is the primary operational interface for administration. Bi-directional synchronization validates, diffs, and propagates master data to Firebase Firestore.
- **Plan B (Full Web Platform):** Full browser-based responsive Admin Control Centre with real-time Firestore synchronization, RBAC management, and granular permission tuning. Excel is maintained as a strictly validated bulk import/export and reporting bridge.

---

## 4. Repository Structure

```
PIXEL-DISTRIBUTOR/
├── apps/
│   ├── admin/                 # Plan B: React/Next.js Web Admin Control Centre
│   ├── dealer-web/            # Multi-Tenant Mobile-First Dealer Web / PWA App
│   └── android/               # Unified Android Mobile App (Capacitor/Native Wrapper)
├── backend/                   # Cloud Functions / Node.js API Service & Auth Hooks
├── firebase/
│   ├── firestore.rules        # Version 2 Security Rules (Tenant Isolation & RBAC)
│   ├── firestore.indexes.json # Composite & Array Indexes for Query Optimization
│   └── storage.rules          # Security Rules for APK & Media File Storage
├── shared/
│   ├── types/                 # Shared TypeScript Data Contracts & Interfaces
│   ├── permissions/           # Multi-Tier Permission Engine & Rule Definitions
│   └── validation/            # Zod Validation Schemas for Payloads & Data Models
├── excel/
│   ├── templates/             # Validated Excel Workbooks & Import Templates
│   └── generated/             # Auto-generated or exported business sheets
├── docs/                      # Architectural, Technical, and Operational Specs
├── scripts/                   # Migration, Seeding, and Build Automation Scripts
└── tests/
    ├── unit/                  # Business Logic & Utility Unit Tests
    ├── integration/           # Multi-Tenant Workflow Integration Tests
    └── rules/                 # Firebase Emulator Suite Security Rule Tests
```

---

## 5. Architectural & Technical Documentation Index

All core architectural decisions, specifications, and operational workflows are fully detailed in the dedicated documentation suite:

1. [**Architecture Specification**](file:///c:/Users/naren/Downloads/Personal/PIXEL-DISTRIBUTOR/docs/ARCHITECTURE.md)
   - Multi-tenant runtime model, Plan A vs Plan B deep dive, tech stack selection, state management.
2. [**Database Schema Specification**](file:///c:/Users/naren/Downloads/Personal/PIXEL-DISTRIBUTOR/docs/DATABASE_SCHEMA.md)
   - Complete Cloud Firestore collection designs, entity relations, composite indexes, immutable transaction log.
3. [**Permission Matrix & Access Control**](file:///c:/Users/naren/Downloads/Personal/PIXEL-DISTRIBUTOR/docs/PERMISSIONS.md)
   - 6-level capability model (`HIDDEN`, `VIEW`, `CREATE`, `EDIT`, `DELETE`, `ADMIN`), 4-tier enforcement, dynamic UI evaluation.
4. [**Security & Isolation Model**](file:///c:/Users/naren/Downloads/Personal/PIXEL-DISTRIBUTOR/docs/SECURITY.md)
   - Firestore security rules v2, custom claims, App Check, defense-in-depth against ID tampering.
5. [**Excel Administration System (Plan A & Bulk Bridge)**](file:///c:/Users/naren/Downloads/Personal/PIXEL-DISTRIBUTOR/docs/EXCEL_SYSTEM.md)
   - 16-sheet workbook architecture, data validation, bi-directional sync, safe 5-stage import pipeline.
6. [**Android Application Architecture**](file:///c:/Users/naren/Downloads/Personal/PIXEL-DISTRIBUTOR/docs/ANDROID_APP.md)
   - Single multi-tenant APK, offline caching, biometric auth, dynamic module hydration.
7. [**APK Distribution & OTA Update Engine**](file:///c:/Users/naren/Downloads/Personal/PIXEL-DISTRIBUTOR/docs/APK_DISTRIBUTION.md)
   - Self-hosted `/download` portal, version control collection, mandatory update enforcement, `PackageInstaller` integration.
8. [**Backend API Specification**](file:///c:/Users/naren/Downloads/Personal/PIXEL-DISTRIBUTOR/docs/API_SPEC.md)
   - REST/Cloud Function endpoints, request/response contracts, Zod validations, error codes.
9. [**Deployment & DevOps Manual**](file:///c:/Users/naren/Downloads/Personal/PIXEL-DISTRIBUTOR/docs/DEPLOYMENT.md)
   - Firebase hosting, Functions deployment, environment configuration, staging and production pipelines.
10. [**Testing & Quality Assurance Guide**](file:///c:/Users/naren/Downloads/Personal/PIXEL-DISTRIBUTOR/docs/TESTING.md)
    - Security rules unit tests (`@firebase/rules-unit-testing`), E2E testing, offline test plans.
11. [**Troubleshooting & Runbook**](file:///c:/Users/naren/Downloads/Personal/PIXEL-DISTRIBUTOR/docs/TROUBLESHOOTING.md)
    - Resolution guides for common permission anomalies, sync discrepancies, build scripts.
12. [**Implementation Roadmap**](file:///c:/Users/naren/Downloads/Personal/PIXEL-DISTRIBUTOR/docs/IMPLEMENTATION_ROADMAP.md)
    - Milestone-driven execution plan (Phases 0 through 6), gating criteria, and review checkpoints.

---

## 6. Current Status & Next Steps

This project is currently in **Phase 0: Architecture, Schema & System Design Specification**.

> [!NOTE]
> Per architectural guidelines, no code generation or production deployment will commence until this architecture package is reviewed and authorized by the Lead Stakeholder.
